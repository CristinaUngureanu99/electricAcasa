import { test, expect } from '@playwright/test';

test('landing page loads and shows navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav')).toBeVisible();
});

test('login page loads and shows form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /login|autentificare|conectare|intră|sign in/i })).toBeVisible();
});

test('admin redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain('/login');
});
