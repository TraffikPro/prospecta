/* eslint-disable @typescript-eslint/no-require-imports -- Node --require loads this file as CommonJS before Prisma. */
require("tsx/cjs");

const { installTestDatabaseGate } = require("./test-database-gate.ts");

installTestDatabaseGate();
