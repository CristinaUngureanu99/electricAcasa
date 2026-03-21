import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  const uniqueEmail = `test-${Date.now()}@electricacasa.test`;
  const password = 'TestPass123!';

  test('register new account', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[placeholder="Ion Popescu"]', 'Test New User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[placeholder="Minim 8 caractere"]', password);
    await page.fill('input[placeholder="Repetă parola"]', password);
    await page.locator('input[type="checkbox"]').check();
    await page.click('button[type="submit"]');

    // Should either redirect to dashboard (email confirm OFF) or show email sent message
    await Promise.race([
      page.waitForURL('/dashboard', { timeout: 10_000 }),
      expect(page.getByText(/verifica.*email/i)).toBeVisible({ timeout: 10_000 }),
    ]);
  });

  test('login with existing account', async ({ page }) => {
    // Use the account created in previous test (or existing test account)
    await page.goto('/login');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10_000 });

    await expect(page.getByText(/contul tau|bine ai venit/i)).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10_000 });

    await page.getByText('Deconectare').click();
    await page.waitForURL('/login', { timeout: 10_000 });
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 5_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user can browse catalog', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/catalog produse/i)).toBeVisible({ timeout: 10_000 });
  });
});
