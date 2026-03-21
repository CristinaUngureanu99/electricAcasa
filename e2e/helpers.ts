import { type Page, expect } from '@playwright/test';

function requiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}. Set it in .env or CI.`);
  return val;
}

export const TEST_USER = {
  get email() { return requiredEnv('E2E_USER_EMAIL'); },
  get password() { return requiredEnv('E2E_USER_PASSWORD'); },
  name: 'Test E2E User',
};

export const TEST_ADMIN = {
  get email() { return requiredEnv('E2E_ADMIN_EMAIL'); },
  get password() { return requiredEnv('E2E_ADMIN_PASSWORD'); },
};

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10_000 });
}

export async function loginAsUser(page: Page) {
  await loginUser(page, TEST_USER.email, TEST_USER.password);
}

export async function loginAsAdmin(page: Page) {
  await loginUser(page, TEST_ADMIN.email, TEST_ADMIN.password);
}

export async function logout(page: Page) {
  const logoutBtn = page.getByText('Deconectare');
  await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
  await logoutBtn.click();
  await page.waitForURL('/login', { timeout: 10_000 });
}

export async function addProductToCart(page: Page) {
  await page.goto('/catalog');
  const productLink = page.locator('a[href^="/produs/"]').first();
  await expect(productLink).toBeVisible({ timeout: 10_000 });
  await productLink.click();
  await page.waitForURL(/\/produs\//);

  const addBtn = page.getByRole('button', { name: /adauga in cos/i });
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
  await addBtn.click();
  await expect(page.getByText(/adaugat in cos/i)).toBeVisible({ timeout: 5_000 });
}

export async function checkoutRamburs(page: Page): Promise<string> {
  await page.goto('/checkout');
  await page.waitForSelector('form', { timeout: 10_000 });

  await page.fill('input[name="name"], input:below(:text("Nume complet"))', 'Test User');
  await page.fill('input[type="tel"]', '0722123456');
  await page.fill('input:below(:text("Strada"))', 'Str. Test 1');
  await page.fill('input:below(:text("Oras"))', 'Bucuresti');
  await page.fill('input:below(:text("Judet"))', 'Ilfov');
  await page.fill('input:below(:text("Cod postal"))', '077025');

  await page.click('button[type="submit"]');
  await page.waitForURL(/\/checkout\/confirmare/, { timeout: 15_000 });

  // Extract order number from confirmation page
  const orderText = await page.getByText(/EA-\d+/).first().textContent();
  expect(orderText).toBeTruthy();
  return orderText!;
}
