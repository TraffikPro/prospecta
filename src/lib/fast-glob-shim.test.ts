import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const fg = require(
  path.join(process.cwd(), "tooling", "fast-glob-shim", "index.cjs"),
);

describe("fast-glob-shim", () => {
  it("lists directories only for recursive pattern", () => {
    const dirs = fg.globSync("src/**", { onlyDirectories: true });
    assert.ok(dirs.includes("src"));
    assert.ok(dirs.some((d: string) => d.startsWith("src/")));
    assert.ok(dirs.every((d: string) => !d.endsWith(".ts")));
  });

  it("returns empty for missing literal path", () => {
    const out = fg.globSync("definitely-missing-root-dir-xyz", {
      onlyDirectories: true,
    });
    assert.deepEqual(out, []);
  });

  it("exposes sync alias used by fast-glob consumers", () => {
    assert.equal(typeof fg.sync, "function");
    assert.equal(fg.sync, fg.globSync);
  });
});
