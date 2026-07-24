import type { Page } from "@playwright/test";

import { ensureActiveUser } from "./helpers/ensure-active-user";

/** Matches `/app/leads/:id` but not `/app/leads/new`. */
export const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\/|$))[^/]+/;

export async function login(page: Page, email: string, password: string) {
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
