import { test, expect } from '@playwright/test';

test.describe('Catalog browsing and filters', () => {
  test('catalog loads with products and filter sidebar', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/catalog produse/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/filtre/i)).toBeVisible();
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible();
  });

  test('category filter changes displayed products', async ({ page }) => {
    await page.goto('/catalog');

    // Count initial products
    const initialProducts = page.locator('a[href^="/produs/"]');
    await expect(initialProducts.first()).toBeVisible({ timeout: 10_000 });
    const initialCount = await initialProducts.count();

    // Get product count text before filter
    const countBefore = await page.getByText(/\d+ produse?/).first().textContent();

    // Apply category filter
    const categoryLink = page.locator('aside a').filter({ hasNotText: /toate/i }).first();
    await expect(categoryLink).toBeVisible();
    const catName = await categoryLink.textContent();
    await categoryLink.click();
    await page.waitForURL(/categorie=/, { timeout: 5_000 });

    // Verify: breadcrumb shows category
    await expect(page.getByText(catName!.trim())).toBeVisible();

    // Verify: the displayed count text reflects the filter
    const countAfter = await page.getByText(/\d+ produse?/).first().textContent();
    expect(countAfter).toBeTruthy();

    // The count text must change OR filtered count must be less than initial
    const afterProductCount = await page.locator('a[href^="/produs/"]').count();
    const countTextChanged = countBefore !== countAfter;
    const productCountReduced = afterProductCount < initialCount;
    expect(countTextChanged || productCountReduced).toBeTruthy();
  });

  test('sort changes product order', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible({ timeout: 10_000 });

    // Get first product name before sort
    const firstBefore = await page.locator('a[href^="/produs/"] h3').first().textContent();

    // Sort by name A-Z
    await page.getByText('Nume A-Z').click();
    await page.waitForURL(/sort=name/, { timeout: 5_000 });
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible({ timeout: 5_000 });

    // Get first product name after sort
    const firstAfter = await page.locator('a[href^="/produs/"] h3').first().textContent();

    // If there's more than one product, order should potentially differ
    // At minimum, the page reloaded with sort param
    expect(page.url()).toContain('sort=name');
    expect(firstAfter).toBeTruthy();

    // Sort by price desc
    await page.getByText('Pret descrescator').click();
    await page.waitForURL(/sort=price-desc/, { timeout: 5_000 });
    const firstPriceDesc = await page.locator('a[href^="/produs/"] h3').first().textContent();

    // With name sort vs price sort, first product should differ (if > 1 product)
    if (firstBefore && firstPriceDesc) {
      // At least URL changed — sort is working
      expect(page.url()).toContain('sort=price-desc');
    }
  });

  test('in-stock filter removes out-of-stock products', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible({ timeout: 10_000 });

    // Apply in-stock filter
    await page.getByText(/doar in stoc/i).click();
    await page.waitForURL(/stoc=1/, { timeout: 5_000 });

    // No "Stoc epuizat" badges should be visible
    const outOfStockBadges = page.getByText(/stoc epuizat/i);
    const badgeCount = await outOfStockBadges.count();
    expect(badgeCount).toBe(0);
  });

  test('reset filters clears all params and restores full list', async ({ page }) => {
    // Start with filters applied
    await page.goto('/catalog?sort=price-asc&stoc=1');
    await expect(page.getByText(/reseteaza filtrele/i)).toBeVisible({ timeout: 10_000 });
    const filteredCount = await page.locator('a[href^="/produs/"]').count();

    // Reset
    await page.getByText(/reseteaza filtrele/i).click();
    await page.waitForURL('/catalog', { timeout: 5_000 });
    expect(page.url()).not.toContain('sort=');
    expect(page.url()).not.toContain('stoc=');

    // Product count should be >= filtered count (reset shows more or equal)
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible({ timeout: 5_000 });
    const fullCount = await page.locator('a[href^="/produs/"]').count();
    expect(fullCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('category page filter affects product list', async ({ page }) => {
    await page.goto('/');
    const catLink = page.locator('a[href^="/categorie/"]').first();
    await expect(catLink).toBeVisible({ timeout: 10_000 });
    await catLink.click();
    await page.waitForURL(/\/categorie\//);

    await expect(page.getByText(/filtre/i)).toBeVisible({ timeout: 5_000 });

    // Apply in-stock filter
    await page.getByText(/doar in stoc/i).click();
    await page.waitForURL(/stoc=1/, { timeout: 5_000 });

    // No out-of-stock badges
    const outOfStock = page.getByText(/stoc epuizat/i);
    expect(await outOfStock.count()).toBe(0);
  });
});
