import { test, expect } from '@playwright/test';
import { loginAsUser, addProductToCart, checkoutRamburs } from './helpers';

test.describe('Client order cancellation', () => {
  test('place ramburs order then cancel it', async ({ page }) => {
    await loginAsUser(page);
    await addProductToCart(page);
    const orderNumber = await checkoutRamburs(page);

    // Go to order detail
    await page.goto('/comenzi');
    await expect(page.getByText(orderNumber)).toBeVisible({ timeout: 10_000 });
    await page.getByText(orderNumber).click();
    await page.waitForURL(/\/comenzi\/.+/);

    // Cancel
    const cancelBtn = page.getByRole('button', { name: /anuleaza comanda/i });
    await expect(cancelBtn).toBeVisible({ timeout: 5_000 });
    await cancelBtn.click();

    // Confirm
    const confirmBtn = page.getByRole('button', { name: /da, anuleaza/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify
    await expect(page.getByText(/comanda a fost anulata/i)).toBeVisible({ timeout: 5_000 });

    // Reload and verify status persisted
    await page.reload();
    await expect(page.getByText(/anulata/i)).toBeVisible({ timeout: 5_000 });
  });
});
