import { expect, test } from "@playwright/test";

test.describe("auth recovery visual consistency (Fatia A)", () => {
  test("desktop forgot shows reduced public brand panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/forgot-password");

    await expect(page.getByTestId("public-auth-brand-panel")).toBeVisible();
    await expect(page.getByTestId("public-auth-mobile-brand-bar")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Recuperar acesso", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Acesse novamente sua operação."),
    ).toBeVisible();
    await expect(page.getByText("Lead", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enviar" })).toBeInViewport();
  });

  test("mobile forgot shows top bar once, no overflow, CTA in fold", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/forgot-password");

    await expect(page.getByTestId("public-auth-brand-panel")).toBeHidden();
    await expect(page.getByTestId("public-auth-mobile-brand-bar")).toBeVisible();
    await expect(
      page.locator('[data-testid="prospecta-wordmark"]:visible'),
    ).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Enviar" })).toBeInViewport();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test("reset without token keeps invalid link state in public shell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/reset-password");

    await expect(page.getByTestId("public-auth-brand-panel")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nova senha", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Link inválido ou expirado.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Solicitar novo link" }),
    ).toBeVisible();
  });

  test("forgot anti-enumeration success still works", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/forgot-password");
    await page.getByLabel("E-mail", { exact: true }).fill("nobody@prospecta.test");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByTestId("forgot-password-ack")).toHaveText(
      "Se este email estiver cadastrado, enviaremos instruções.",
    );
    await expect(
      page.getByRole("link", { name: "Voltar ao login" }),
    ).toBeVisible();
  });
});
