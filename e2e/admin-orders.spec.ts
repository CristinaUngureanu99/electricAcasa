import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, addProductToCart, checkoutRamburs } from './helpers';

test.describe('Admin order management', () => {
  test('admin sees a new ramburs order in list', async ({ browser }) => {
    // Create order as user
    const userCtx = await browser.newContext();
    const userPage = await userCtx.newPage();
    await loginAsUser(userPage);
    await addProductToCart(userPage);
    const orderNumber = await checkoutRamburs(userPage);
    await userCtx.close();

    // Verify as admin
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.goto('/admin/comenzi');
    await expect(adminPage.getByText(orderNumber)).toBeVisible({ timeout: 10_000 });
    await adminCtx.close();
  });

  test('admin views order details with all sections', async ({ browser }) => {
    // Create order as user
    const userCtx = await browser.newContext();
    const userPage = await userCtx.newPage();
    await loginAsUser(userPage);
    await addProductToCart(userPage);
    const orderNumber = await checkoutRamburs(userPage);
    await userCtx.close();

    // View details as admin
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.goto('/admin/comenzi');
    await adminPage.getByText(orderNumber).click();
    await adminPage.waitForURL(/\/admin\/comenzi\/.+/);

    await expect(adminPage.getByText(/comanda ea-/i)).toBeVisible();
    await expect(adminPage.getByText(/produse/i)).toBeVisible();
    await expect(adminPage.getByText(/adresa livrare/i)).toBeVisible();
    await expect(adminPage.getByText(/client/i)).toBeVisible();
    await expect(adminPage.getByText(/ramburs/i)).toBeVisible();
    await adminCtx.close();
  });

  test('admin changes order status from confirmed to shipped', async ({ browser }) => {
    // Create order as user
    const userCtx = await browser.newContext();
    const userPage = await userCtx.newPage();
    await loginAsUser(userPage);
    await addProductToCart(userPage);
    const orderNumber = await checkoutRamburs(userPage);
    await userCtx.close();

    // Change status as admin
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginAsAdmin(adminPage);
    await adminPage.goto('/admin/comenzi');
    await adminPage.getByText(orderNumber).click();
    await adminPage.waitForURL(/\/admin\/comenzi\/.+/);

    // Ramburs order starts as confirmed
    await expect(adminPage.getByText(/confirmata/i)).toBeVisible();

    const shipBtn = adminPage.getByRole('button', { name: /marcheaza expediata/i });
    await expect(shipBtn).toBeVisible({ timeout: 5_000 });
    await shipBtn.click();

    await expect(adminPage.getByText(/status actualizat/i)).toBeVisible({ timeout: 5_000 });

    // Reload and verify persisted
    await adminPage.reload();
    await expect(adminPage.getByText(/expediata/i)).toBeVisible({ timeout: 5_000 });
    await adminCtx.close();
  });
});
