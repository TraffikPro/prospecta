import type { Page } from "@playwright/test";

import { ensureActiveUser } from "./helpers/ensure-active-user";

export async function login(page: Page, email: string, password: string) {
  await ensureActiveUser(email);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/app");
}
