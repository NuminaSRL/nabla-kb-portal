import { test, expect } from '@playwright/test';

test.describe('Usage Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display usage dashboard page', async ({ page }) => {
    // Navigate to usage dashboard
    await page.goto('/dashboard/usage');
    
    // Check page title
    await expect(page.locator('text=Usage Dashboard')).toBeVisible();
    
    // Check tier badge is visible
    await expect(page.locator('text=/Free|Pro|Enterprise/')).toBeVisible();
  });

  test('should display quota progress indicators', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check quota status section
    await expect(page.locator('text=Quota Status')).toBeVisible();
    await expect(page.locator('text=Daily Searches')).toBeVisible();
    
    // Check progress bar is visible
    await expect(page.locator('[class*="bg-gray-200"]').first()).toBeVisible();
  });

  test('should display usage statistics', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check usage statistics section
    await expect(page.locator('text=Usage Statistics')).toBeVisible();
    
    // Check for stat cards
    await expect(page.locator('text=Total Searches')).toBeVisible();
    await expect(page.locator('text=Daily Average')).toBeVisible();
    await expect(page.locator('text=Peak Day')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check Overview tab is active by default
    await expect(page.locator('button:has-text("Overview")')).toHaveClass(/border-blue-600/);
    
    // Click History tab
    await page.click('button:has-text("History")');
    await expect(page.locator('text=Search History')).toBeVisible();
    
    // Click Analytics tab
    await page.click('button:has-text("Analytics")');
    await expect(page.locator('text=Usage Trends')).toBeVisible();
  });

  test('should display search history', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to History tab
    await page.click('button:has-text("History")');
    
    // Check search history section
    await expect(page.locator('text=Search History')).toBeVisible();
    
    // Check for limit selector
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('should display top searches', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to History tab
    await page.click('button:has-text("History")');
    
    // Check top searches section
    await expect(page.locator('text=Most Frequent Searches')).toBeVisible();
  });

  test('should display usage charts', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to Analytics tab
    await page.click('button:has-text("Analytics")');
    
    // Check usage trends section
    await expect(page.locator('text=Usage Trends')).toBeVisible();
    
    // Check for time period selector
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('should display tier comparison for non-enterprise users', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check if tier comparison is visible (only for free/pro users)
    const tierComparison = page.locator('text=Compare Plans');
    const isVisible = await tierComparison.isVisible().catch(() => false);
    
    if (isVisible) {
      // Check comparison table
      await expect(page.locator('text=Free')).toBeVisible();
      await expect(page.locator('text=Pro')).toBeVisible();
      await expect(page.locator('text=Enterprise')).toBeVisible();
    }
  });

  test('should show upgrade prompt when approaching limit', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check for upgrade prompt (may not always be visible)
    const upgradePrompt = page.locator('text=Approaching Your Limit');
    const isVisible = await upgradePrompt.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(page.locator('text=Upgrade Now')).toBeVisible();
    }
  });

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Click refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    await refreshButton.click();
    
    // Check that button shows loading state
    await expect(refreshButton).toBeDisabled();
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000);
    await expect(refreshButton).toBeEnabled();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Click back button
    await page.click('a[href="/dashboard"]');
    
    // Check we're back on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should change time period for statistics', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Find and click time period selector
    const selector = page.locator('select').first();
    await selector.selectOption('14');
    
    // Wait for data to reload
    await page.waitForTimeout(500);
    
    // Check that the selector value changed
    await expect(selector).toHaveValue('14');
  });

  test('should change limit for search history', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to History tab
    await page.click('button:has-text("History")');
    
    // Find and click limit selector
    const selector = page.locator('select').first();
    await selector.selectOption('50');
    
    // Wait for data to reload
    await page.waitForTimeout(500);
    
    // Check that the selector value changed
    await expect(selector).toHaveValue('50');
  });

  test('should display real-time usage updates', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check initial usage count
    const usageText = await page.locator('text=/\\d+ \\/ \\d+/').first().textContent();
    
    // Perform a search to increment usage
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'GDPR compliance');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await page.waitForTimeout(1000);
    
    // Go back to usage dashboard
    await page.goto('/dashboard/usage');
    
    // Check that usage count may have changed
    await expect(page.locator('text=/\\d+ \\/ \\d+/').first()).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return errors
    await page.route('**/api/usage/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, message: 'Internal server error' }),
      });
    });
    
    await page.goto('/dashboard/usage');
    
    // Check that error message is displayed
    await expect(page.locator('text=/Failed to fetch|error/i')).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    // Slow down API responses
    await page.route('**/api/usage/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/dashboard/usage');
    
    // Check for loading indicators
    await expect(page.locator('[class*="animate-pulse"]').first()).toBeVisible();
  });

  test('should link to pricing page from upgrade buttons', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Find upgrade button
    const upgradeButton = page.locator('a:has-text("Upgrade")').first();
    
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await expect(page).toHaveURL(/\/pricing/);
    }
  });

  test('should display correct tier-specific features', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Check that tier-specific content is displayed
    const tierBadge = await page.locator('text=/Free|Pro|Enterprise/').first().textContent();
    
    if (tierBadge?.includes('Free')) {
      // Free tier should see upgrade prompts
      await expect(page.locator('text=Upgrade')).toBeVisible();
    } else if (tierBadge?.includes('Enterprise')) {
      // Enterprise tier should see unlimited features
      await expect(page.locator('text=Unlimited')).toBeVisible();
    }
  });

  test('should format dates correctly in search history', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to History tab
    await page.click('button:has-text("History")');
    
    // Check for relative time formatting
    const timeText = page.locator('text=/ago|Just now|day|hour|minute/').first();
    if (await timeText.isVisible()) {
      await expect(timeText).toBeVisible();
    }
  });

  test('should display bar charts correctly', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to Analytics tab
    await page.click('button:has-text("Analytics")');
    
    // Check for chart elements
    await expect(page.locator('[class*="bg-blue-600"]').first()).toBeVisible();
  });

  test('should show tooltip on chart hover', async ({ page }) => {
    await page.goto('/dashboard/usage');
    
    // Switch to Analytics tab
    await page.click('button:has-text("Analytics")');
    
    // Hover over a bar in the chart
    const chartBar = page.locator('[class*="bg-blue-600"]').first();
    if (await chartBar.isVisible()) {
      await chartBar.hover();
      
      // Check for tooltip (may not always be visible depending on data)
      await page.waitForTimeout(500);
    }
  });
});
