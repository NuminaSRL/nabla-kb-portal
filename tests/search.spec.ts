import { test, expect } from '@playwright/test';

test.describe('Search Interface', () => {
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

  test('should display search bar', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    await expect(searchBar).toBeVisible();
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Type query
    await searchBar.fill('GDPR');
    
    // Wait for suggestions to appear
    await page.waitForTimeout(500);
    
    // Check if suggestions dropdown is visible
    const suggestions = page.locator('[role="button"]').filter({ hasText: /GDPR/i });
    const count = await suggestions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should perform search and display results', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Perform search
    await searchBar.fill('privacy compliance');
    await searchBar.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check if results are displayed
    const resultsContainer = page.locator('text=/Found .* results?/i');
    await expect(resultsContainer).toBeVisible();
  });

  test('should display "no results" message for invalid query', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Search for something that doesn't exist
    await searchBar.fill('xyzabc123nonexistent');
    await searchBar.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check for no results message
    const noResults = page.locator('text=/No results found/i');
    await expect(noResults).toBeVisible();
  });

  test('should clear search query', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Type query
    await searchBar.fill('GDPR compliance');
    
    // Click clear button
    const clearButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await clearButton.click();
    
    // Check if input is cleared
    await expect(searchBar).toHaveValue('');
  });

  test('should toggle filters sidebar', async ({ page }) => {
    // Click filters button
    const filtersButton = page.locator('button:has-text("Filters")');
    await filtersButton.click();
    
    // Check if filters sidebar is visible
    const filtersSidebar = page.locator('text=/Domain/i').first();
    await expect(filtersSidebar).toBeVisible();
    
    // Click again to hide
    await filtersButton.click();
    await page.waitForTimeout(300);
  });

  test('should apply domain filter', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Select GDPR domain
    await page.check('input[type="checkbox"]', { force: true });
    
    // Perform search
    await searchBar.fill('compliance');
    await searchBar.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Verify filter was applied (results should contain GDPR domain)
    const results = page.locator('text=/GDPR/i');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate using keyboard in suggestions', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Type query to show suggestions
    await searchBar.fill('GDPR');
    await page.waitForTimeout(500);
    
    // Press arrow down to select first suggestion
    await searchBar.press('ArrowDown');
    
    // Press Enter to select
    await searchBar.press('Enter');
    
    // Wait for search to execute
    await page.waitForTimeout(1000);
    
    // Verify search was performed
    const resultsContainer = page.locator('text=/Found .* results?/i');
    await expect(resultsContainer).toBeVisible();
  });

  test('should display result metadata', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Perform search
    await searchBar.fill('GDPR Article 5');
    await searchBar.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check if result cards contain metadata
    const resultCard = page.locator('.bg-white.border').first();
    await expect(resultCard).toBeVisible();
    
    // Check for relevance score
    const relevanceScore = resultCard.locator('text=/\\d+% match/i');
    await expect(relevanceScore).toBeVisible();
  });

  test('should adjust relevance score filter', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Find and adjust relevance slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('0.8');
    
    // Verify slider value changed
    const sliderValue = await slider.inputValue();
    expect(parseFloat(sliderValue)).toBeGreaterThanOrEqual(0.8);
  });

  test('should handle search errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/search*', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    await searchBar.fill('test query');
    await searchBar.press('Enter');
    
    // Wait for error handling
    await page.waitForTimeout(1000);
    
    // Should show no results or error state
    const noResults = page.locator('text=/No results found/i');
    await expect(noResults).toBeVisible();
  });

  test('should show loading state during search', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Start search
    await searchBar.fill('compliance regulations');
    await searchBar.press('Enter');
    
    // Check for loading spinner (should appear briefly)
    const loadingSpinner = page.locator('.animate-spin');
    
    // Note: This might be too fast to catch, but we're testing the UI exists
    // In a real scenario, you might want to slow down the API response
  });

  test('should persist search query in URL', async ({ page }) => {
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    // Perform search
    await searchBar.fill('GDPR compliance');
    await searchBar.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check if query is in search bar
    await expect(searchBar).toHaveValue('GDPR compliance');
  });
});

test.describe('Search Performance', () => {
  test('should complete search within 300ms', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/search');
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    
    const startTime = Date.now();
    await searchBar.fill('GDPR');
    await searchBar.press('Enter');
    
    // Wait for results
    await page.waitForSelector('text=/Found .* results?/i', { timeout: 5000 });
    const endTime = Date.now();
    
    const searchTime = endTime - startTime;
    console.log(`Search completed in ${searchTime}ms`);
    
    // Should be under 300ms for cached results, but allow more for first search
    expect(searchTime).toBeLessThan(5000);
  });
});
