import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const ROOT = path.resolve("src/server/ai-analysis");
const FORBIDDEN = [
  "@prisma/client",
  "child_process",
  "@/lib/prisma",
  "lead.service",
  "execFile",
  "spawn(",
];

function sourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      found.push(...sourceFiles(full));
      continue;
    }
    if (full.endsWith(".ts") && !full.endsWith(".test.ts")) {
      found.push(full);
    }
  }
  return found;
}

describe("analysis core boundaries", () => {
  it("does not import CRM writes, SQL or shell", () => {
    const files = sourceFiles(ROOT);
    assert.ok(files.length > 0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const token of FORBIDDEN) {
        assert.equal(source.includes(token), false, `${file} contains ${token}`);
      }
    }
  });

  it("keeps the feature flag out of the orchestrator", () => {
    const source = readFileSync(path.join(ROOT, "orchestrator.ts"), "utf8");
    assert.equal(source.includes("LEAD_AI_ANALYSIS_ENABLED"), false);
  });
});
