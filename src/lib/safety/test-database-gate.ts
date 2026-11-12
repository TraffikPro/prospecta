import fs from "node:fs";
import Module from "node:module";
import path from "node:path";

/**
 * Fail-closed barrier for the test process.
 * Prisma Client loads `.env` when DATABASE_URL is unset. This gate locks the
 * variable before that load and refuses any database that is not a dedicated
 * local test database.
 */

export const TEST_DATABASE_GATE_CODE = "TEST_DATABASE_GATE";

export const AUTHORIZED_TEST_HOSTS = ["127.0.0.1", "localhost", "::1"] as const;

export const AUTHORIZED_TEST_DATABASE_NAMES = [
  "prospecta_ci",
  "prospecta_test",
] as const;

const PROCESS_ENV_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.test",
  ".env.test.local",
  ".env.production",
  ".env.production.local",
]);

const GATE_STATE = Symbol.for("prospecta.testDatabaseGate");

export type TestDatabaseGateReason =
  | "missing"
  | "malformed"
  | "remote_host"
  | "unapproved_database"
  | "overwrite";

const MESSAGES: Record<TestDatabaseGateReason, string> = {
  missing: "Test database URL is missing.",
  malformed: "Test database URL is malformed.",
  remote_host: "Test database host is not an authorized local host.",
  unapproved_database:
    "Test database name is not an authorized dedicated test database.",
  overwrite: "Test database URL changed after the safety gate locked it.",
};

export class TestDatabaseGateError extends Error {
  readonly code = TEST_DATABASE_GATE_CODE;
  readonly reason: TestDatabaseGateReason;

  constructor(reason: TestDatabaseGateReason, message = MESSAGES[reason]) {
    super(`${TEST_DATABASE_GATE_CODE} ${reason}: ${message}`);
    this.name = "TestDatabaseGateError";
    this.reason = reason;
  }
}

export type TestDatabaseVerdict =
  | { ok: true; host: string; database: string }
  | { ok: false; reason: Exclude<TestDatabaseGateReason, "overwrite"> };

type GateState = {
  snapshot: string | undefined;
};

type ModuleWithLoad = typeof Module & {
  _load: (
    this: unknown,
    request: string,
    parent: unknown,
    isMain: boolean,
  ) => unknown;
};

function gateGlobal(): GateState | undefined {
  return (globalThis as Record<symbol, GateState | undefined>)[GATE_STATE];
}

function storeGate(state: GateState): void {
  (globalThis as Record<symbol, GateState>)[GATE_STATE] = state;
}

export function evaluateTestDatabaseUrl(
  databaseUrl: string | undefined,
): TestDatabaseVerdict {
  if (databaseUrl === undefined || databaseUrl.trim() === "") {
    return { ok: false, reason: "missing" };
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl.trim());
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    return { ok: false, reason: "malformed" };
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    !AUTHORIZED_TEST_HOSTS.includes(
      host as (typeof AUTHORIZED_TEST_HOSTS)[number],
    )
  ) {
    return { ok: false, reason: "remote_host" };
  }

  const database = decodeDatabaseName(parsed.pathname);
  if (database === null) {
    return { ok: false, reason: "malformed" };
  }
  if (
    !AUTHORIZED_TEST_DATABASE_NAMES.includes(
      database as (typeof AUTHORIZED_TEST_DATABASE_NAMES)[number],
    )
  ) {
    return { ok: false, reason: "unapproved_database" };
  }

  return { ok: true, host, database };
}

export function assertAuthorizedTestDatabase(
  databaseUrl: string | undefined,
): { host: string; database: string } {
  const verdict = evaluateTestDatabaseUrl(databaseUrl);
  if (!verdict.ok) {
    throw new TestDatabaseGateError(verdict.reason);
  }
  return { host: verdict.host, database: verdict.database };
}

export function assertPrismaMayLoad(): void {
  const state = gateGlobal();
  if (!state) {
    throw new TestDatabaseGateError(
      "missing",
      "Test database gate is not installed.",
    );
  }

  const current = process.env.DATABASE_URL;
  if (current !== state.snapshot) {
    throw new TestDatabaseGateError("overwrite");
  }

  const verdict = evaluateTestDatabaseUrl(current);
  if (!verdict.ok) {
    throw new TestDatabaseGateError(verdict.reason);
  }
}

export function isProcessEnvFile(filePath: string): boolean {
  return PROCESS_ENV_FILE_NAMES.has(path.basename(filePath));
}

export function stripDatabaseUrlAssignment(contents: string): string {
  return contents
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) return true;
      return !/^(export\s+)?DATABASE_URL\s*=/.test(trimmed);
    })
    .join("\n");
}

export function installTestDatabaseGate(): void {
  if (gateGlobal()) return;

  const snapshot = process.env.DATABASE_URL;
  if (snapshot !== undefined) {
    assertAuthorizedTestDatabase(snapshot);
  }

  const state: GateState = { snapshot };
  patchEnvReads();
  lockDatabaseUrl(state);
  storeGate(state);
  patchPrismaLoader();
}

function decodeDatabaseName(pathname: string): string | null {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  if (segments.length !== 1) return null;
  try {
    const database = decodeURIComponent(segments[0] ?? "");
    return database.length > 0 ? database : null;
  } catch {
    return null;
  }
}

function patchEnvReads(): void {
  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = function (
    this: unknown,
    filePath: fs.PathOrFileDescriptor,
    options?: unknown,
  ) {
    const result =
      options === undefined
        ? originalReadFileSync.call(fs, filePath as never)
        : originalReadFileSync.call(fs, filePath as never, options as never);
    return stripEnvResult(filePath, result);
  } as typeof fs.readFileSync;

  const originalReadFile = fs.promises.readFile;
  fs.promises.readFile = (async (
    filePath: fs.PathOrFileDescriptor,
    options?: unknown,
  ) => {
    const result =
      options === undefined
        ? await originalReadFile.call(fs.promises, filePath as never)
        : await originalReadFile.call(
            fs.promises,
            filePath as never,
            options as never,
          );
    return stripEnvResult(filePath, result);
  }) as typeof fs.promises.readFile;
}

function stripEnvResult(
  filePath: fs.PathOrFileDescriptor,
  result: string | Buffer,
): string | Buffer {
  const asString = pathFromDescriptor(filePath);
  if (asString === null || !isProcessEnvFile(asString)) return result;
  if (typeof result === "string") return stripDatabaseUrlAssignment(result);
  return Buffer.from(stripDatabaseUrlAssignment(result.toString("utf8")));
}

function pathFromDescriptor(filePath: fs.PathOrFileDescriptor): string | null {
  if (typeof filePath === "string") return filePath;
  if (filePath instanceof URL) return filePath.pathname;
  return null;
}

function lockDatabaseUrl(state: GateState): void {
  const target = process.env;
  const proxy = new Proxy(target, {
    set(env, key, value) {
      if (key !== "DATABASE_URL") return Reflect.set(env, key, value);
      applyDatabaseUrl(env, state, value);
      return true;
    },
    deleteProperty(env, key) {
      if (key !== "DATABASE_URL") return Reflect.deleteProperty(env, key);
      if (state.snapshot !== undefined) {
        throw new TestDatabaseGateError("overwrite");
      }
      return Reflect.deleteProperty(env, key);
    },
    defineProperty(env, key, descriptor) {
      if (key === "DATABASE_URL" && "value" in descriptor) {
        applyDatabaseUrl(env, state, descriptor.value);
        return true;
      }
      return Reflect.defineProperty(env, key, descriptor);
    },
  });

  try {
    process.env = proxy;
  } catch {
    throw new TestDatabaseGateError(
      "missing",
      "Test database gate could not lock DATABASE_URL.",
    );
  }
}

function applyDatabaseUrl(
  target: NodeJS.ProcessEnv,
  state: GateState,
  value: unknown,
): void {
  const next = value === undefined || value === null ? undefined : String(value);
  const current = target.DATABASE_URL;
  if (next === current) return;
  if (next === state.snapshot) {
    if (next === undefined) Reflect.deleteProperty(target, "DATABASE_URL");
    else Reflect.set(target, "DATABASE_URL", next);
    return;
  }
  if (state.snapshot !== undefined) {
    throw new TestDatabaseGateError("overwrite");
  }

  const verdict = evaluateTestDatabaseUrl(next);
  if (!verdict.ok) throw new TestDatabaseGateError(verdict.reason);
  Reflect.set(target, "DATABASE_URL", next);
}

function patchPrismaLoader(): void {
  const nodeModule = Module as ModuleWithLoad;
  const originalLoad = nodeModule._load;
  nodeModule._load = function (request, parent, isMain) {
    if (isPrismaClientRequest(request)) assertPrismaMayLoad();
    return originalLoad.call(this, request, parent, isMain);
  };

  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (request: string) {
    if (isPrismaClientRequest(request)) assertPrismaMayLoad();
    return originalRequire.call(this, request);
  };
}

function isPrismaClientRequest(request: string): boolean {
  const normalized = request.replace(/\\/g, "/");
  return (
    normalized === "@prisma/client" ||
    normalized.startsWith("@prisma/client/") ||
    normalized.includes("/.prisma/client/") ||
    normalized.includes("/@prisma/client/") ||
    normalized.endsWith("/.prisma/client") ||
    normalized.endsWith("/@prisma/client")
  );
}
