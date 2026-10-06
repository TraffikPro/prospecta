/**
 * Minimal CommonJS shim of `fast-glob` for Prospecta's ESLint stack.
 *
 * Why: `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces@3.0.3`
 * (GHSA-vfj7-8cjw-p6xm). The plugin only needs `globSync(pattern, { onlyDirectories })`
 * in `get-root-dirs.js`. This shim uses Node.js built-in `fs.globSync` (no npm braces).
 *
 * License: MIT (original Prospecta code). Not a fork of micromatch/braces.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * @param {string} pattern
 * @param {{ onlyDirectories?: boolean; cwd?: string; absolute?: boolean }} [options]
 * @returns {string[]}
 */
function globSync(pattern, options = {}) {
  if (typeof pattern !== "string") {
    throw new TypeError("fast-glob-shim: pattern must be a string");
  }
  if (typeof fs.globSync !== "function") {
    throw new Error(
      "fast-glob-shim requires Node.js >= 22 (fs.globSync). CI uses Node 22.",
    );
  }

  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const onlyDirectories = Boolean(options.onlyDirectories);
  const wantAbsolute = Boolean(options.absolute);
  const normalized = pattern.replace(/\\/g, "/");

  /** @type {string[]} */
  let matches;
  try {
    matches = fs.globSync(normalized, { cwd });
  } catch (error) {
    // Literal non-glob paths that do not exist: fast-glob returns [].
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "ENOENT" || error.code === "ENOTDIR")
    ) {
      return [];
    }
    throw error;
  }

  /** @type {string[]} */
  const out = [];
  for (const match of matches) {
    const absolute = path.isAbsolute(match) ? match : path.resolve(cwd, match);
    if (onlyDirectories) {
      let st;
      try {
        st = fs.statSync(absolute);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
    }
    const rendered = wantAbsolute
      ? absolute
      : path.relative(cwd, absolute) || ".";
    out.push(rendered.replace(/\\/g, "/"));
  }
  return out;
}

module.exports = {
  globSync,
  sync: globSync,
};
module.exports.default = module.exports;
