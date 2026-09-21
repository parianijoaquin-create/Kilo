import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("flujos autenticados", () => {
  test.skip(!email || !password, "Definí E2E_EMAIL y E2E_PASSWORD con una cuenta de prueba confirmada.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  for (const route of ["/dashboard", "/diary", "/macros", "/habits", "/profile"]) {
    test(`abre ${route} sin errores de página`, async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
      await expect(page.locator("body")).toBeVisible();
      expect(pageErrors).toEqual([]);
    });
  }
});
