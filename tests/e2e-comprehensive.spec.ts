import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite for KB Portal
 * Tests all user flows across Free, Pro, and Enterprise tiers
 * Requirement 26: Web SaaS Direct KB Query Interface
 */

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test user credentials for different tiers
const TEST_USERS = {
  free: {
    email: 'free-tier@example.com',
    password: 'FreeUser123!',
    tier: 'free'
  },
  pro: {
    email: 'pro-tier@example.com',
    password: 'ProUser123!',
    tier: 'pro'
  },
  enterprise: {
    email: 'enterprise-tier@example.com',
    password: 'EnterpriseUser123!',
    tier: 'enterprise'
  }
};

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

test.describe('E2E: Free Tier User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.free.email, TEST_USERS.free.password);
  });

  test('should enforce 20 searches per day limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Check quota display
    const quotaStatus = page.locator('text=/\\d+\\/20 searches today/i');
    await expect(quotaStatus).toBeVisible();
  });

  test('should limit results to 5 per search', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('GDPR compliance');
    await searchBar.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Count result cards
    const results = page.locator('.bg-white.border');
    const count = await results.count();
    expect(count).toBeLessThanOrEqual(5);
  });

  test('should show upgrade prompt when approaching limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should see upgrade prompt
    const upgradePrompt = page.locator('text=/Upgrade to Pro/i');
    await expect(upgradePrompt).toBeVisible();
  });

  test('should only have access to basic filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Should see basic filters only
    await expect(page.locator('text=/Domain/i')).toBeVisible();
    
    // Advanced filters should be locked
    const advancedFilters = page.locator('text=/Date Range/i');
    const isLocked = await advancedFilters.locator('..').locator('svg[class*="lock"]').count();
    expect(isLocked).toBeGreaterThan(0);
  });

  test('should not have access to saved searches', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Saved searches should show upgrade prompt
    const savedSearchesLink = page.locator('text=/Saved Searches/i');
    if (await savedSearchesLink.count() > 0) {
      await savedSearchesLink.click();
      await expect(page.locator('text=/Upgrade to Pro/i')).toBeVisible();
    }
  });

  test('should not have access to export features', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('GDPR');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Export button should be locked or show upgrade prompt
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      await expect(page.locator('text=/Upgrade to Pro/i')).toBeVisible();
    }
  });
});

test.describe('E2E: Pro Tier User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.pro.email, TEST_USERS.pro.password);
  });

  test('should enforce 500 searches per day limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Check quota display
    const quotaStatus = page.locator('text=/\\d+\\/500 searches today/i');
    await expect(quotaStatus).toBeVisible();
  });

  test('should allow up to 50 results per search', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('compliance regulations');
    await searchBar.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Should see pagination or "Load more" for more results
    const loadMore = page.locator('button:has-text("Load More")');
    const pagination = page.locator('nav[aria-label="pagination"]');
    
    const hasLoadMore = await loadMore.count() > 0;
    const hasPagination = await pagination.count() > 0;
    
    expect(hasLoadMore || hasPagination).toBeTruthy();
  });

  test('should have access to advanced filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Should see advanced filters
    await expect(page.locator('text=/Date Range/i')).toBeVisible();
    await expect(page.locator('text=/Document Type/i')).toBeVisible();
    await expect(page.locator('text=/Source/i')).toBeVisible();
  });

  test('should be able to save searches', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('GDPR Article 5');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Click save search button
    const saveButton = page.locator('button:has-text("Save Search")');
    await saveButton.click();
    
    // Fill save dialog
    await page.fill('input[placeholder*="name"]', 'My GDPR Search');
    await page.click('button:has-text("Save")');
    
    // Should see success message
    await expect(page.locator('text=/Search saved/i')).toBeVisible({ timeout: 5000 });
  });

  test('should be able to export search results to PDF', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('privacy compliance');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();
    
    // Select PDF format
    await page.click('text=/PDF/i');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should be able to export search results to CSV', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('compliance');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();
    
    // Select CSV format
    await page.click('text=/CSV/i');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should be able to generate citations', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('GDPR');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Click on first result
    const firstResult = page.locator('.bg-white.border').first();
    await firstResult.click();
    
    // Click citation button
    const citationButton = page.locator('button:has-text("Cite")');
    await citationButton.click();
    
    // Should see citation dialog with formats
    await expect(page.locator('text=/APA/i')).toBeVisible();
    await expect(page.locator('text=/MLA/i')).toBeVisible();
    await expect(page.locator('text=/Chicago/i')).toBeVisible();
  });

  test('should have access to search history', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/usage`);
    
    // Should see search history section
    await expect(page.locator('text=/Search History/i')).toBeVisible();
    
    // Should see recent searches
    const historyItems = page.locator('[data-testid="history-item"]');
    const count = await historyItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('E2E: Enterprise Tier User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.enterprise.email, TEST_USERS.enterprise.password);
  });

  test('should have unlimited searches', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Check quota display shows unlimited
    const quotaStatus = page.locator('text=/Unlimited searches/i');
    await expect(quotaStatus).toBeVisible();
  });

  test('should allow up to 100 results per search', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('regulatory compliance');
    await searchBar.press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Should have pagination or load more for many results
    const pagination = page.locator('nav[aria-label="pagination"]');
    await expect(pagination).toBeVisible();
  });

  test('should have access to all advanced features', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Should see all filters without locks
    await expect(page.locator('text=/Domain/i')).toBeVisible();
    await expect(page.locator('text=/Date Range/i')).toBeVisible();
    await expect(page.locator('text=/Document Type/i')).toBeVisible();
    await expect(page.locator('text=/Source/i')).toBeVisible();
    
    // No lock icons should be present
    const lockIcons = page.locator('svg[class*="lock"]');
    const lockCount = await lockIcons.count();
    expect(lockCount).toBe(0);
  });

  test('should be able to set up search alerts', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('AI Act updates');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Save search with alert
    const saveButton = page.locator('button:has-text("Save Search")');
    await saveButton.click();
    
    // Fill save dialog
    await page.fill('input[placeholder*="name"]', 'AI Act Monitoring');
    
    // Enable alert
    await page.check('input[type="checkbox"]');
    
    // Select frequency
    await page.selectOption('select', 'daily');
    
    await page.click('button:has-text("Save")');
    
    // Should see success message
    await expect(page.locator('text=/Alert created/i')).toBeVisible({ timeout: 5000 });
  });

  test('should have access to personalized recommendations', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/recommendations`);
    
    // Should see recommendations section
    await expect(page.locator('text=/Recommended for You/i')).toBeVisible();
    
    // Should see recommendation cards
    const recommendations = page.locator('[data-testid="recommendation-card"]');
    const count = await recommendations.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be able to bulk export documents', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('compliance');
    await searchBar.press('Enter');
    await page.waitForTimeout(1000);
    
    // Select multiple results
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();
    
    // Click bulk export
    const bulkExportButton = page.locator('button:has-text("Export Selected")');
    await bulkExportButton.click();
    
    // Select format
    await page.click('text=/PDF/i');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.zip');
  });

  test('should have access to API keys', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/profile`);
    
    // Should see API keys section
    await expect(page.locator('text=/API Keys/i')).toBeVisible();
    
    // Should be able to generate new key
    const generateButton = page.locator('button:has-text("Generate New Key")');
    await expect(generateButton).toBeVisible();
  });
});
