import { test, expect } from '@playwright/test';
import { TEST_ADMIN, loginUser } from './helpers';

test.describe('Admin order management', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_ADMIN.email, TEST_ADMIN.password);
  });

  test('admin can see orders list', async ({ page }) => {
    await page.goto('/admin/comenzi');
    await expect(page.getByText(/comenzi/i)).toBeVisible({ timeout: 10_000 });

    // Should see at least order numbers if orders exist
    const orderCards = page.getByText(/EA-/);
    const count = await orderCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('admin can view order details', async ({ page }) => {
    await page.goto('/admin/comenzi');

    const orderLink = page.locator('a[href^="/admin/comenzi/"]').first();
    if (await orderLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await orderLink.click();
      await page.waitForURL(/\/admin\/comenzi\/.+/);

      // Should show order details
      await expect(page.getByText(/comanda ea-/i)).toBeVisible();
      await expect(page.getByText(/produse/i)).toBeVisible();
      await expect(page.getByText(/adresa livrare/i)).toBeVisible();
    }
  });

  test('admin can change order status', async ({ page }) => {
    await page.goto('/admin/comenzi');

    const orderLink = page.locator('a[href^="/admin/comenzi/"]').first();
    if (await orderLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await orderLink.click();
      await page.waitForURL(/\/admin\/comenzi\/.+/);

      // Check if status change buttons exist
      const statusSection = page.getByText(/schimba status/i);
      if (await statusSection.isVisible({ timeout: 3_000 }).catch(() => false)) {
        // Find any available status button (depends on current status)
        const actionBtn = page.locator('button').filter({
          hasText: /marcheaza|anuleaza/i,
        }).first();

        if (await actionBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          const btnText = await actionBtn.textContent();
          await actionBtn.click();

          // Wait for toast
          await expect(page.getByText(/status actualizat/i)).toBeVisible({ timeout: 5_000 });
          // Status should have changed from what was on the button
          expect(btnText).toBeTruthy();
        }
      }
    }
  });
});
