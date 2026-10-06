import fs from "node:fs";

/** Synthetic: unused import / prefer patterns covered by baseline. */
export function readSomething() {
  return fs.existsSync("package.json");
}

import path from "node:path";
export const joined = path.join("a", "b");
