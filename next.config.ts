import type { NextConfig } from "next";

const excludedNonPostgresWasmBase64 = [
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.mysql.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.mysql.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.sqlite.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.sqlite.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.cockroachdb.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.cockroachdb.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.mysql.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.mysql.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.sqlite.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.sqlite.wasm-base64.mjs",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.sqlserver.wasm-base64.js",
  "node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/query_engine_bg.sqlserver.wasm-base64.mjs",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    authInterrupts: true,
  },
  outputFileTracingExcludes: {
    "*": excludedNonPostgresWasmBase64,
  },
};

export default nextConfig;
