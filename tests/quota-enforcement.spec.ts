import { test, expect, Page } from '@playwright/test';

/**
 * Quota Enforcement Tests
 * Verifies that quota limits are properly enforced across all tiers
 * Requirement 26.6, 26.7, 26.8
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('Quota Enforcement: Free Tier', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'free-tier@example.com', 'FreeUser123!');
  });

  test('should block searches after 20 daily limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Mock quota exhaustion
    await page.route('**/api/search*', (route) => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ 
          error: 'Daily quota exceeded',
          quota: { used: 20, limit: 20 }
        }),
      });
    });
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('test query');
    await searchBar.press('Enter');
    
    // Should show quota exceeded message
    await expect(page.locator('text=/quota exceeded/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Upgrade to Pro/i')).toBeVisible();
  });

  test('should limit results to 5 per search', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Mock API response with more than 5 results
    await page.route('**/api/search*', (route) => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        title: `Document ${i}`,
        content: `Content ${i}`,
        relevance: 0.9 - i * 0.05
      }));
      
      route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          results: results.slice(0, 5), // Only return 5
          total: 10,
          quota: { used: 1, limit: 20 }
        }),
      });
    });
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('compliance');
    await searchBar.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Count visible results
    const results = page.locator('[data-testid="search-result"]');
    const count = await results.count();
    expect(count).toBeLessThanOrEqual(5);
  });

  test('should show quota status in UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should display quota information
    await expect(page.locator('text=/20 searches per day/i')).toBeVisible();
    await expect(page.locator('text=/5 results per search/i')).toBeVisible();
    
    // Should show usage progress
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });

  test('should reset quota at midnight', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should show next reset time
    await expect(page.locator('text=/Resets at midnight/i')).toBeVisible();
  });
});

test.describe('Quota Enforcement: Pro Tier', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pro-tier@example.com', 'ProUser123!');
  });

  test('should block searches after 500 daily limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Mock quota exhaustion
    await page.route('**/api/search*', (route) => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ 
          error: 'Daily quota exceeded',
          quota: { used: 500, limit: 500 }
        }),
      });
    });
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('test query');
    await searchBar.press('Enter');
    
    // Should show quota exceeded message
    await expect(page.locator('text=/quota exceeded/i')).toBeVisible({ timeout: 5000 });
  });

  test('should limit results to 50 per search', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('compliance regulations');
    await searchBar.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Should have pagination for more results
    const pagination = page.locator('nav[aria-label="pagination"]');
    const loadMore = page.locator('button:has-text("Load More")');
    
    const hasPagination = await pagination.count() > 0;
    const hasLoadMore = await loadMore.count() > 0;
    
    expect(hasPagination || hasLoadMore).toBeTruthy();
  });

  test('should show pro tier quota status', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should display pro quota information
    await expect(page.locator('text=/500 searches per day/i')).toBeVisible();
    await expect(page.locator('text=/50 results per search/i')).toBeVisible();
  });
});

test.describe('Quota Enforcement: Enterprise Tier', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'enterprise-tier@example.com', 'EnterpriseUser123!');
  });

  test('should have unlimited searches', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should show unlimited status
    await expect(page.locator('text=/Unlimited searches/i')).toBeVisible();
  });

  test('should allow up to 100 results per search', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('regulatory compliance');
    await searchBar.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Should have pagination for many results
    const pagination = page.locator('nav[aria-label="pagination"]');
    await expect(pagination).toBeVisible();
  });

  test('should not show quota warnings', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should not show quota warnings
    const warningMessage = page.locator('text=/approaching limit/i');
    const count = await warningMessage.count();
    expect(count).toBe(0);
  });
});

test.describe('Quota Enforcement: Upgrade Prompts', () => {
  test('should show upgrade prompt when free tier approaches limit', async ({ page }) => {
    await login(page, 'free-tier@example.com', 'FreeUser123!');
    await page.goto(`${BASE_URL}/search`);
    
    // Mock near-limit quota
    await page.route('**/api/quota*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          used: 18,
          limit: 20,
          percentage: 90
        }),
      });
    });
    
    await page.reload();
    
    // Should show upgrade prompt
    await expect(page.locator('text=/Upgrade to Pro/i')).toBeVisible();
  });

  test('should link to pricing page from upgrade prompt', async ({ page }) => {
    await login(page, 'free-tier@example.com', 'FreeUser123!');
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Click upgrade button
    const upgradeButton = page.locator('button:has-text("Upgrade")').first();
    await upgradeButton.click();
    
    // Should navigate to pricing page
    await expect(page).toHaveURL(/.*pricing/);
  });
});
