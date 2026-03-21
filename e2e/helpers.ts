import { type Page, expect } from '@playwright/test';

// Test credentials — must exist in Supabase with email confirmation OFF
export const TEST_USER = {
  email: 'test-e2e@electricacasa.test',
  password: 'TestPass123!',
  name: 'Test E2E User',
};

export const TEST_ADMIN = {
  email: 'maruscristina99@gmail.com',
  password: 'TestAdmin123!', // Update this to the real admin password
};

export async function registerUser(page: Page) {
  await page.goto('/register');
  await page.fill('input[placeholder="Ion Popescu"]', TEST_USER.name);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[placeholder="Minim 8 caractere"]', TEST_USER.password);
  await page.fill('input[placeholder="Repetă parola"]', TEST_USER.password);
  await page.locator('input[type="checkbox"]').check();
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10_000 });
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10_000 });
}

export async function logout(page: Page) {
  // Works from both client and admin dashboards
  const logoutBtn = page.getByText('Deconectare');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('/login', { timeout: 10_000 });
  }
}

export async function addProductToCart(page: Page) {
  // Go to catalog, click first product, add to cart
  await page.goto('/catalog');
  const productLink = page.locator('a[href^="/produs/"]').first();
  await expect(productLink).toBeVisible({ timeout: 10_000 });
  await productLink.click();
  await page.waitForURL(/\/produs\//);

  const addBtn = page.getByRole('button', { name: /adauga in cos/i });
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
  await addBtn.click();

  // Wait for toast confirmation
  await expect(page.getByText(/adaugat in cos/i)).toBeVisible({ timeout: 5_000 });
}

export async function checkoutRamburs(page: Page) {
  await page.goto('/checkout');
  await page.waitForSelector('form', { timeout: 10_000 });

  // Fill address
  await page.fill('input[name="name"], input:below(:text("Nume complet"))', 'Test User');
  await page.fill('input[type="tel"]', '0722123456');
  await page.fill('input:below(:text("Strada"))', 'Str. Test 1');
  await page.fill('input:below(:text("Oras"))', 'Bucuresti');
  await page.fill('input:below(:text("Judet"))', 'Ilfov');
  await page.fill('input:below(:text("Cod postal"))', '077025');

  // Ramburs should be default
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/checkout\/confirmare/, { timeout: 15_000 });
}
