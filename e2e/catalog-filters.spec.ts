import { test, expect } from '@playwright/test';

test.describe('Catalog browsing and filters', () => {
  test('catalog page loads with products', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/catalog produse/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/produse/i)).toBeVisible();
  });

  test('category filter works', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/categorie/i)).toBeVisible({ timeout: 10_000 });

    // Click first category in sidebar
    const categoryLink = page.locator('aside a').filter({ hasNotText: /toate/i }).first();
    if (await categoryLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const catName = await categoryLink.textContent();
      await categoryLink.click();

      // URL should have ?categorie= param
      await page.waitForTimeout(1_000);
      expect(page.url()).toContain('categorie=');

      // Breadcrumb should show category
      if (catName) {
        await expect(page.getByText(catName.trim())).toBeVisible();
      }
    }
  });

  test('sort works', async ({ page }) => {
    await page.goto('/catalog');

    const sortBtn = page.getByText('Pret crescator');
    await expect(sortBtn).toBeVisible({ timeout: 10_000 });
    await sortBtn.click();

    await page.waitForTimeout(1_000);
    expect(page.url()).toContain('sort=price-asc');
  });

  test('product page loads from catalog', async ({ page }) => {
    await page.goto('/catalog');

    const productLink = page.locator('a[href^="/produs/"]').first();
    if (await productLink.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForURL(/\/produs\//);

      // Should show product details
      await expect(page.getByText(/adauga in cos|indisponibil/i)).toBeVisible({ timeout: 5_000 });
    }
  });

  test('category page loads from nav', async ({ page }) => {
    await page.goto('/');

    // Find a category link on homepage
    const catLink = page.locator('a[href^="/categorie/"]').first();
    if (await catLink.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await catLink.click();
      await page.waitForURL(/\/categorie\//);

      // Should show category name and filter sidebar
      await expect(page.getByText(/filtre/i)).toBeVisible({ timeout: 5_000 });
    }
  });
});
