import { assertSafeForMutableTestsOrThrow } from "../src/lib/safety/production-mutation-guard";

/**
 * Hard stop: Playwright must not mutate production DB/app by default.
 */
export default async function globalSetup() {
  assertSafeForMutableTestsOrThrow({
    databaseUrl: process.env.DATABASE_URL,
    appUrl:
      process.env.PLAYWRIGHT_BASE_URL ||
      process.env.SMOKE_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL,
    breakGlass: process.env.PROSPECTA_ALLOW_PROD_DB_MUTATION,
  });
}
