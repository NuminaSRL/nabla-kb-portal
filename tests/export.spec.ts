import { test, expect } from '@playwright/test';

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Pro user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'pro@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show export dialog for single document', async ({ page }) => {
    // Navigate to search results
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Click export button on first result
    await page.click('[data-testid="export-button"]');

    // Verify export dialog appears
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Export Documents')).toBeVisible();
  });

  test('should export single document as PDF', async ({ page }) => {
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Open export dialog
    await page.click('[data-testid="export-button"]');

    // Select PDF format
    await page.click('input[value="pdf"]');

    // Include annotations
    await page.click('input#annotations');

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');

    // Wait for export to complete
    await page.waitForSelector('text=Exporting...', { state: 'hidden', timeout: 10000 });

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should export multiple documents as batch PDF', async ({ page }) => {
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Select multiple documents
    await page.click('[data-testid="select-document-0"]');
    await page.click('[data-testid="select-document-1"]');
    await page.click('[data-testid="select-document-2"]');

    // Click batch export button
    await page.click('[data-testid="batch-export-button"]');

    // Verify dialog shows correct count
    await expect(page.locator('text=Export 3 documents')).toBeVisible();

    // Select batch PDF
    await page.click('input[value="pdf"]');

    // Start export
    await page.click('button:has-text("Export")');

    // Wait for processing
    await page.waitForSelector('text=Exporting...', { state: 'hidden', timeout: 15000 });

    // Verify success
    await expect(page.locator('text=Export completed')).toBeVisible();
  });

  test('should export search results as CSV', async ({ page }) => {
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Select multiple documents
    await page.click('[data-testid="select-all"]');

    // Open export dialog
    await page.click('[data-testid="batch-export-button"]');

    // Select CSV format
    await page.click('input[value="csv"]');

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should show watermark option for Enterprise users', async ({ page }) => {
    // Login as Enterprise user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'enterprise@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to search
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Open export dialog
    await page.click('[data-testid="export-button"]');

    // Verify watermark option is visible
    await expect(page.locator('text=Add watermark (Enterprise only)')).toBeVisible();

    // Enable watermark
    await page.click('input#watermark');

    // Enter watermark text
    await page.fill('input#watermark-text', 'CONFIDENTIAL');

    // Verify watermark text is set
    await expect(page.locator('input#watermark-text')).toHaveValue('CONFIDENTIAL');
  });

  test('should enforce Pro tier batch limit', async ({ page }) => {
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Try to select more than 10 documents
    for (let i = 0; i < 12; i++) {
      await page.click(`[data-testid="select-document-${i}"]`);
    }

    // Open export dialog
    await page.click('[data-testid="batch-export-button"]');

    // Verify error message
    await expect(page.locator('text=Pro tier allows batch export of up to 10 documents')).toBeVisible();

    // Export button should be disabled
    await expect(page.locator('button:has-text("Export")')).toBeDisabled();
  });

  test('should show export history', async ({ page }) => {
    await page.goto('/dashboard/exports');

    // Verify export history page
    await expect(page.locator('h1:has-text("Exports")')).toBeVisible();
    await expect(page.locator('text=Export History')).toBeVisible();

    // Verify table headers
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Documents")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Size")')).toBeVisible();
  });

  test('should download completed export from history', async ({ page }) => {
    await page.goto('/dashboard/exports');

    // Wait for export history to load
    await page.waitForSelector('[data-testid="export-history"]');

    // Find a completed export
    const completedRow = page.locator('tr:has-text("Completed")').first();
    await expect(completedRow).toBeVisible();

    // Click download button
    const downloadPromise = page.waitForEvent('download');
    await completedRow.locator('button[aria-label="Download"]').click();

    // Verify download
    const download = await downloadPromise;
    expect(download).toBeTruthy();
  });

  test('should refresh export history', async ({ page }) => {
    await page.goto('/dashboard/exports');

    // Click refresh button
    await page.click('button:has-text("Refresh")');

    // Verify loading state
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();

    // Wait for data to load
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });

    // Verify table is visible
    await expect(page.locator('[data-testid="export-history"]')).toBeVisible();
  });

  test('should handle export failure gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/export/jobs', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Export service unavailable' }),
      });
    });

    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Try to export
    await page.click('[data-testid="export-button"]');
    await page.click('button:has-text("Export")');

    // Verify error message
    await expect(page.locator('text=Export service unavailable')).toBeVisible();
  });

  test('should prevent Free tier users from exporting', async ({ page }) => {
    // Login as Free user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'free@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Open export dialog
    await page.click('[data-testid="export-button"]');

    // Verify upgrade message
    await expect(page.locator('text=Export is not available in Free tier')).toBeVisible();

    // Export button should be disabled
    await expect(page.locator('button:has-text("Export")')).toBeDisabled();
  });

  test('should include annotations in PDF export', async ({ page }) => {
    await page.goto('/documents/test-doc-id');

    // Add some annotations
    await page.click('[data-testid="highlight-button"]');
    await page.selectText('Important text');
    await page.click('[data-testid="add-note-button"]');
    await page.fill('textarea', 'This is a test note');
    await page.click('button:has-text("Save")');

    // Export with annotations
    await page.click('[data-testid="export-button"]');
    await page.click('input#annotations');
    await page.click('button:has-text("Export")');

    // Wait for export
    await page.waitForSelector('text=Exporting...', { state: 'hidden', timeout: 10000 });

    // Verify export completed
    await expect(page.locator('text=Export completed')).toBeVisible();
  });

  test('should export as JSON format', async ({ page }) => {
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Select documents
    await page.click('[data-testid="select-document-0"]');
    await page.click('[data-testid="select-document-1"]');

    // Open export dialog
    await page.click('[data-testid="batch-export-button"]');

    // Select JSON format
    await page.click('input[value="json"]');

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');

    // Verify JSON download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should export as Markdown format', async ({ page }) => {
    await page.goto('/search?q=GDPR');
    await page.waitForSelector('[data-testid="search-results"]');

    // Select documents
    await page.click('[data-testid="select-document-0"]');

    // Open export dialog
    await page.click('[data-testid="batch-export-button"]');

    // Select Markdown format
    await page.click('input[value="markdown"]');

    // Include annotations
    await page.click('input#annotations');

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');

    // Verify Markdown download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.md');
  });
});
