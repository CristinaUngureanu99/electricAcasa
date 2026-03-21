import { test, expect } from '@playwright/test';
import { loginAsUser, addProductToCart, checkoutRamburs } from './helpers';

test.describe('Checkout ramburs end-to-end', () => {
  test('add product, checkout ramburs, verify confirmation', async ({ page }) => {
    await loginAsUser(page);
    await addProductToCart(page);

    // Verify cart has items
    await page.goto('/cos');
    await expect(page.getByText(/cos de cumparaturi/i)).toBeVisible();
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible();

    // Complete checkout
    const orderNumber = await checkoutRamburs(page);
    expect(orderNumber).toMatch(/EA-\d+/);

    // Verify order appears in client history
    await page.goto('/comenzi');
    await expect(page.getByText(orderNumber)).toBeVisible({ timeout: 10_000 });
  });
});
