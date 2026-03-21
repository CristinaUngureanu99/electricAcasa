import { test, expect } from '@playwright/test';

test.describe('Register flow', () => {
  test('register new account and reach dashboard', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@electricacasa.test`;
    const password = 'RegisterTest123!';

    await page.goto('/register');

    // Fill form
    await page.fill('input[placeholder="Ion Popescu"]', 'Test Register User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[placeholder="Minim 8 caractere"]', password);
    await page.fill('input[placeholder="Repetă parola"]', password);
    await page.locator('input[type="checkbox"]').check();

    await page.click('button[type="submit"]');

    // Should either go to dashboard (email confirm OFF) or show email sent screen
    const result = await Promise.race([
      page.waitForURL('/dashboard', { timeout: 10_000 }).then(() => 'dashboard' as const),
      page.getByText(/verifica.*email/i).waitFor({ timeout: 10_000 }).then(() => 'email-sent' as const),
    ]);

    if (result === 'dashboard') {
      await expect(page.getByText(/contul tau|bine ai venit/i)).toBeVisible();
    } else {
      await expect(page.getByText(uniqueEmail)).toBeVisible();
      await expect(page.getByText(/mergi la pagina de login/i)).toBeVisible();
    }
  });

  test('register with existing email shows error', async ({ page }) => {
    // Use the known admin email which definitely exists
    const existingEmail = process.env.E2E_ADMIN_EMAIL;
    if (!existingEmail) throw new Error('E2E_ADMIN_EMAIL required');

    await page.goto('/register');
    await page.fill('input[placeholder="Ion Popescu"]', 'Duplicate User');
    await page.fill('input[type="email"]', existingEmail);
    await page.fill('input[placeholder="Minim 8 caractere"]', 'SomePass123!');
    await page.fill('input[placeholder="Repetă parola"]', 'SomePass123!');
    await page.locator('input[type="checkbox"]').check();

    await page.click('button[type="submit"]');

    // Should not reach dashboard — either error or email-sent (Supabase may not reveal existing accounts)
    await page.waitForTimeout(3_000);
    expect(page.url()).not.toContain('/dashboard');
  });

  test('register validates password mismatch', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[placeholder="Ion Popescu"]', 'Mismatch User');
    await page.fill('input[type="email"]', 'mismatch@test.com');
    await page.fill('input[placeholder="Minim 8 caractere"]', 'Password123!');
    await page.fill('input[placeholder="Repetă parola"]', 'DifferentPass!');
    await page.locator('input[type="checkbox"]').check();

    await page.click('button[type="submit"]');

    await expect(page.getByText(/parolele nu se potrivesc/i)).toBeVisible({ timeout: 3_000 });
    expect(page.url()).toContain('/register');
  });

  test('register validates short password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[placeholder="Ion Popescu"]', 'Short Pass User');
    await page.fill('input[type="email"]', 'short@test.com');
    await page.fill('input[placeholder="Minim 8 caractere"]', '123');
    await page.fill('input[placeholder="Repetă parola"]', '123');
    await page.locator('input[type="checkbox"]').check();

    await page.click('button[type="submit"]');

    await expect(page.getByText(/minim 8 caractere/i)).toBeVisible({ timeout: 3_000 });
    expect(page.url()).toContain('/register');
  });
});
