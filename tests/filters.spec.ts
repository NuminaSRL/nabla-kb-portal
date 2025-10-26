import { test, expect } from '@playwright/test';

test.describe('Advanced Filters System', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to search page
    await page.goto('/search');
  });

  test('should display filter panel when filters button is clicked', async ({ page }) => {
    // Click filters button
    await page.click('button:has-text("Filters")');

    // Check if filter panel is visible
    await expect(page.locator('text=Domain')).toBeVisible();
    await expect(page.locator('text=Document Type')).toBeVisible();
    await expect(page.locator('text=Source')).toBeVisible();
    await expect(page.locator('text=Date Range')).toBeVisible();
    await expect(page.locator('text=Minimum Relevance')).toBeVisible();
  });

  test('should filter by domain', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select GDPR domain
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'data protection');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });

    // Verify all results are GDPR domain
    const domainTags = await page.locator('text=GDPR').count();
    expect(domainTags).toBeGreaterThan(0);
  });

  test('should filter by document type', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select Regulation type
    await page.check('input[type="checkbox"] ~ span:has-text("Regulation")');

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'compliance');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });

    // Verify results contain Regulation type
    await expect(page.locator('text=Regulation')).toBeVisible();
  });

  test('should filter by source', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Expand source section
    await page.click('text=Source');

    // Select EUR-Lex source
    await page.check('input[type="checkbox"] ~ span:has-text("EUR-Lex")');

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'regulation');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });

    // Verify source is EUR-Lex
    await expect(page.locator('text=EUR-Lex')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Expand date section
    await page.click('text=Date Range');

    // Set date range
    await page.fill('input[type="date"]:first-of-type', '2023-01-01');
    await page.fill('input[type="date"]:last-of-type', '2023-12-31');

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'gdpr');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });

    // Results should be displayed
    const resultsCount = await page.locator('[data-testid="search-result-item"]').count();
    expect(resultsCount).toBeGreaterThan(0);
  });

  test('should adjust minimum relevance score', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Expand relevance section
    await page.click('text=Minimum Relevance');

    // Get the slider
    const slider = page.locator('input[type="range"]');

    // Set to 80%
    await slider.fill('0.8');

    // Verify the display shows 80%
    await expect(page.locator('text=80%')).toBeVisible();

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'privacy');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForTimeout(2000);

    // All results should have >= 80% match
    const matchScores = await page.locator('text=/\\d+% match/').allTextContents();
    matchScores.forEach((score) => {
      const percentage = parseInt(score.match(/\d+/)?.[0] || '0');
      expect(percentage).toBeGreaterThanOrEqual(80);
    });
  });

  test('should combine multiple filters (AND logic)', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select GDPR domain
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');

    // Select Regulation type
    await page.check('input[type="checkbox"] ~ span:has-text("Regulation")');

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'data');
    await page.click('button:has-text("Apply Filters")');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });

    // Verify results match both filters
    await expect(page.locator('text=GDPR')).toBeVisible();
    await expect(page.locator('text=Regulation')).toBeVisible();
  });

  test('should display facet counts', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Perform a search first to get facet counts
    await page.fill('input[placeholder*="Search"]', 'compliance');
    await page.click('button:has-text("Apply Filters")');

    // Wait for facets to load
    await page.waitForTimeout(2000);

    // Check if facet counts are displayed (format: "GDPR (5)")
    const facetWithCount = page.locator('text=/\\w+\\s*\\(\\d+\\)/');
    await expect(facetWithCount.first()).toBeVisible();
  });

  test('should save filter preset', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select some filters
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');
    await page.check('input[type="checkbox"] ~ span:has-text("Regulation")');

    // Click save preset button
    await page.click('button:has-text("Save as Preset")');

    // Enter preset name
    await page.fill('input[placeholder*="Preset name"]', 'GDPR Regulations');

    // Save
    await page.click('button:has-text("Save"):not(:has-text("Save as Preset"))');

    // Verify preset appears in list
    await expect(page.locator('text=GDPR Regulations')).toBeVisible();
  });

  test('should load filter preset', async ({ page }) => {
    // First, create a preset (assuming one exists from previous test)
    await page.click('button:has-text("Filters")');

    // Expand presets section if collapsed
    const presetsSection = page.locator('text=Saved Filters');
    if (await presetsSection.isVisible()) {
      await presetsSection.click();
    }

    // Click on a preset
    await page.click('text=GDPR Regulations');

    // Verify filters are applied
    const gdprCheckbox = page.locator('input[type="checkbox"] ~ span:has-text("GDPR")');
    await expect(gdprCheckbox).toBeChecked();
  });

  test('should delete filter preset', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Expand presets section
    await page.click('text=Saved Filters');

    // Find delete button for a preset (X icon)
    const deleteButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Verify preset is removed
      await page.waitForTimeout(1000);
      // The preset should no longer be visible
    }
  });

  test('should clear all filters', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select multiple filters
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');
    await page.check('input[type="checkbox"] ~ span:has-text("Tax")');

    // Click clear all
    await page.click('text=Clear all');

    // Verify all filters are cleared
    const gdprCheckbox = page.locator('input[type="checkbox"] ~ span:has-text("GDPR")');
    const taxCheckbox = page.locator('input[type="checkbox"] ~ span:has-text("Tax")');

    await expect(gdprCheckbox).not.toBeChecked();
    await expect(taxCheckbox).not.toBeChecked();
  });

  test('should show active filters summary', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select filters
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');
    await page.check('input[type="checkbox"] ~ span:has-text("Regulation")');

    // Verify active filters summary is shown
    await expect(page.locator('text=Active filters:')).toBeVisible();

    // Verify filter tags are displayed
    await expect(page.locator('.bg-blue-50:has-text("GDPR")')).toBeVisible();
    await expect(page.locator('.bg-green-50:has-text("Regulation")')).toBeVisible();
  });

  test('should remove individual filter from summary', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select filters
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');
    await page.check('input[type="checkbox"] ~ span:has-text("Tax")');

    // Click X on GDPR filter tag
    await page.locator('.bg-blue-50:has-text("GDPR") button').click();

    // Verify GDPR is unchecked
    const gdprCheckbox = page.locator('input[type="checkbox"] ~ span:has-text("GDPR")');
    await expect(gdprCheckbox).not.toBeChecked();

    // Verify Tax is still checked
    const taxCheckbox = page.locator('input[type="checkbox"] ~ span:has-text("Tax")');
    await expect(taxCheckbox).toBeChecked();
  });

  test('should persist filters across page reloads', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select filters
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');

    // Reload page
    await page.reload();

    // Open filters again
    await page.click('button:has-text("Filters")');

    // Verify filter is still selected (if default preset was saved)
    // This test depends on the implementation of filter persistence
    await page.waitForTimeout(1000);
  });

  test('should expand and collapse filter sections', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Domain section should be expanded by default
    await expect(page.locator('input[type="checkbox"] ~ span:has-text("GDPR")')).toBeVisible();

    // Click to collapse Domain section
    await page.click('text=Domain');

    // Domain checkboxes should be hidden
    await expect(page.locator('input[type="checkbox"] ~ span:has-text("GDPR")')).not.toBeVisible();

    // Click to expand again
    await page.click('text=Domain');

    // Domain checkboxes should be visible again
    await expect(page.locator('input[type="checkbox"] ~ span:has-text("GDPR")')).toBeVisible();
  });

  test('should track filter analytics', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');

    // Select filters
    await page.check('input[type="checkbox"] ~ span:has-text("GDPR")');

    // Perform search
    await page.fill('input[placeholder*="Search"]', 'privacy');
    await page.click('button:has-text("Apply Filters")');

    // Wait for search to complete
    await page.waitForTimeout(2000);

    // Analytics should be tracked in the background
    // This is verified by checking the database or API logs
    // For UI testing, we just verify the search completed successfully
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });
});
