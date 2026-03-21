import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, addProductToCart, checkoutRamburs } from './helpers';

test.describe('Admin order management', () => {
  let orderNumber: string;

  test('setup: place a ramburs order as user', async ({ page }) => {
    await loginAsUser(page);
    await addProductToCart(page);
    orderNumber = await checkoutRamburs(page);
    expect(orderNumber).toMatch(/EA-\d+/);
  });

  test('admin sees the order in list', async ({ page }) => {
    test.skip(!orderNumber, 'No order created');
    await loginAsAdmin(page);
    await page.goto('/admin/comenzi');

    await expect(page.getByText(orderNumber)).toBeVisible({ timeout: 10_000 });
  });

  test('admin views order details', async ({ page }) => {
    test.skip(!orderNumber, 'No order created');
    await loginAsAdmin(page);
    await page.goto('/admin/comenzi');

    await page.getByText(orderNumber).click();
    await page.waitForURL(/\/admin\/comenzi\/.+/);

    await expect(page.getByText(/comanda ea-/i)).toBeVisible();
    await expect(page.getByText(/produse/i)).toBeVisible();
    await expect(page.getByText(/adresa livrare/i)).toBeVisible();
    await expect(page.getByText(/client/i)).toBeVisible();
  });

  test('admin changes order status to shipped', async ({ page }) => {
    test.skip(!orderNumber, 'No order created');
    await loginAsAdmin(page);
    await page.goto('/admin/comenzi');

    await page.getByText(orderNumber).click();
    await page.waitForURL(/\/admin\/comenzi\/.+/);

    // Order should be confirmed (ramburs) — mark as shipped
    const shipBtn = page.getByRole('button', { name: /marcheaza expediata/i });
    await expect(shipBtn).toBeVisible({ timeout: 5_000 });
    await shipBtn.click();

    await expect(page.getByText(/status actualizat/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/expediata/i)).toBeVisible();
  });
});
