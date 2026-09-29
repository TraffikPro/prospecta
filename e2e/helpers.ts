import type { BrowserContext, Page } from "@playwright/test";

import { ensureActiveUser } from "./helpers/ensure-active-user";

/** Matches `/app/leads/:id` but not `/app/leads/new`. */
export const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\/|$))[^/]+/;

const rateLimitScopes = new WeakMap<BrowserContext, string>();
let rateLimitScopeSequence = 0;

export async function ensureE2ERateLimitScope(page: Page): Promise<void> {
  const context = page.context();
  let scope = rateLimitScopes.get(context);
  if (!scope) {
    rateLimitScopeSequence += 1;
    scope = [
      "e2e",
      process.pid,
      Date.now().toString(36),
      rateLimitScopeSequence,
    ].join("-");
    rateLimitScopes.set(context, scope);
  }
  await context.setExtraHTTPHeaders({
    "x-prospecta-e2e-rate-limit-scope": scope,
  });
}

export async function login(page: Page, email: string, password: string) {
  await ensureE2ERateLimitScope(page);
  await ensureActiveUser(email);
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => {
    const path = url.pathname;
    return path === "/app" || path.startsWith("/app/");
  });
}
