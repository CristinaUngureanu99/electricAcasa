import { test, expect } from '@playwright/test';
import { TEST_USER, loginUser, addProductToCart, checkoutRamburs } from './helpers';

test.describe('Checkout ramburs end-to-end', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, TEST_USER.email, TEST_USER.password);
  });

  test('add product to cart and complete ramburs checkout', async ({ page }) => {
    // Add product
    await addProductToCart(page);

    // Go to cart
    await page.goto('/cos');
    await expect(page.getByText(/cos de cumparaturi/i)).toBeVisible();
    const cartItems = page.locator('[class*="rounded-2xl"]').filter({ hasText: /RON/ });
    await expect(cartItems.first()).toBeVisible();

    // Checkout
    await checkoutRamburs(page);

    // Verify confirmation
    await expect(page.getByText(/comanda.*confirmata|multumim/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/EA-/)).toBeVisible();
  });

  test('order appears in client order history', async ({ page }) => {
    await page.goto('/comenzi');
    await expect(page.getByText(/EA-/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Confirmata|In asteptare/i)).toBeVisible();
  });
});
