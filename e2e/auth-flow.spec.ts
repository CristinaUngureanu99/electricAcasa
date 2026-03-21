import { test, expect } from '@playwright/test';
import { loginAsUser, logout } from './helpers';

test.describe('Auth flow', () => {
  test('login and reach dashboard', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByText(/contul tau|bine ai venit/i)).toBeVisible({ timeout: 5_000 });
  });

  test('logout redirects to login', async ({ page }) => {
    await loginAsUser(page);
    await logout(page);
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 5_000 });
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated user can browse catalog', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/catalog produse/i)).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user can view product', async ({ page }) => {
    await page.goto('/catalog');
    const productLink = page.locator('a[href^="/produs/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10_000 });
    await productLink.click();
    await page.waitForURL(/\/produs\//);
    await expect(page.getByText(/adauga in cos|indisponibil/i)).toBeVisible({ timeout: 5_000 });
  });
});
