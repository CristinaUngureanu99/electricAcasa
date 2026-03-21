import { test, expect } from '@playwright/test';

test.describe('Catalog browsing and filters', () => {
  test('catalog loads with products and filter sidebar', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/catalog produse/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/filtre/i)).toBeVisible();
    await expect(page.locator('a[href^="/produs/"]').first()).toBeVisible();
  });

  test('category filter updates product list', async ({ page }) => {
    await page.goto('/catalog');
    const categoryLink = page.locator('aside a').filter({ hasNotText: /toate/i }).first();
    await expect(categoryLink).toBeVisible({ timeout: 10_000 });

    const catName = await categoryLink.textContent();
    await categoryLink.click();

    await page.waitForURL(/categorie=/, { timeout: 5_000 });
    // Breadcrumb should show selected category
    await expect(page.getByText(catName!.trim())).toBeVisible();
  });

  test('sort changes URL and persists', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByText('Pret crescator').click();
    await page.waitForURL(/sort=price-asc/, { timeout: 5_000 });

    // Reload and verify sort persists
    await page.reload();
    expect(page.url()).toContain('sort=price-asc');
    await expect(page.getByText(/catalog produse/i)).toBeVisible({ timeout: 10_000 });
  });

  test('reset filters clears all params', async ({ page }) => {
    await page.goto('/catalog?sort=price-asc&stoc=1');
    await expect(page.getByText(/reseteaza filtrele/i)).toBeVisible({ timeout: 10_000 });
    await page.getByText(/reseteaza filtrele/i).click();

    await page.waitForURL('/catalog', { timeout: 5_000 });
    expect(page.url()).not.toContain('sort=');
    expect(page.url()).not.toContain('stoc=');
  });

  test('category page has working filters', async ({ page }) => {
    await page.goto('/');
    const catLink = page.locator('a[href^="/categorie/"]').first();
    await expect(catLink).toBeVisible({ timeout: 10_000 });
    await catLink.click();
    await page.waitForURL(/\/categorie\//);

    await expect(page.getByText(/filtre/i)).toBeVisible({ timeout: 5_000 });

    // Test "Doar in stoc" filter
    await page.getByText(/doar in stoc/i).click();
    await page.waitForURL(/stoc=1/, { timeout: 5_000 });
    expect(page.url()).toContain('stoc=1');
  });
});
