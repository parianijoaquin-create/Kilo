import { expect, test } from "@playwright/test";

test("login expone sólo controles visibles y etiquetados", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.locator("#login-password")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Código de barras" })).toHaveCount(0);
});

test("las rutas privadas redirigen al login", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  // Los prefijos parecidos no deben heredar accidentalmente el carácter público.
  await page.goto("/login-interno");
  await expect(page).toHaveURL(/\/login$/);
});

test("registro valida la contraseña sin enviar el formulario", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nombre").fill("Prueba E2E");
  await page.getByLabel("Email").fill("e2e@example.com");
  await page.locator("#register-password").fill("123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("recuperación de contraseña es pública y accesible", async ({ page }) => {
  await page.goto("/reset-password");

  await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar enlace" })).toBeVisible();
});
