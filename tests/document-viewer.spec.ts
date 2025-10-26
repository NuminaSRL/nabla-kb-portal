import { test, expect } from '@playwright/test';

test.describe('Document Viewer', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should load and display PDF document', async ({ page }) => {
    // Navigate to a test document
    await page.goto('/documents/test-pdf-doc-id');

    // Wait for document to load
    await page.waitForSelector('.react-pdf__Document', { timeout: 10000 });

    // Check that PDF page is rendered
    const pdfPage = page.locator('.react-pdf__Page');
    await expect(pdfPage).toBeVisible();

    // Check that controls are visible
    await expect(page.locator('button[title="Previous page"]')).toBeVisible();
    await expect(page.locator('button[title="Next page"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom in"]')).toBeVisible();
    await expect(page.locator('button[title="Zoom out"]')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Check initial page
    const pageInput = page.locator('input[type="number"]').first();
    await expect(pageInput).toHaveValue('1');

    // Click next page
    await page.click('button[title="Next page"]');
    await page.waitForTimeout(500);
    await expect(pageInput).toHaveValue('2');

    // Click previous page
    await page.click('button[title="Previous page"]');
    await page.waitForTimeout(500);
    await expect(pageInput).toHaveValue('1');

    // Type page number directly
    await pageInput.fill('3');
    await page.waitForTimeout(500);
    await expect(pageInput).toHaveValue('3');
  });

  test('should zoom in and out', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Check initial zoom
    const zoomDisplay = page.locator('text=/\\d+%/');
    await expect(zoomDisplay).toContainText('100%');

    // Zoom in
    await page.click('button[title="Zoom in"]');
    await page.waitForTimeout(300);
    await expect(zoomDisplay).toContainText('110%');

    // Zoom out
    await page.click('button[title="Zoom out"]');
    await page.waitForTimeout(300);
    await expect(zoomDisplay).toContainText('100%');
  });

  test('should search within document', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Open search
    await page.click('button[title="Search in document"]');
    
    // Type search query
    const searchInput = page.locator('input[placeholder="Search..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('compliance');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Check that search results are displayed
    const searchResults = page.locator('text=/\\d+ \\/ \\d+/');
    await expect(searchResults).toBeVisible();

    // Navigate through results
    await page.click('button[title="Next result"]');
    await page.waitForTimeout(300);
    await page.click('button[title="Previous result"]');
    await page.waitForTimeout(300);

    // Clear search
    await page.click('button[title="Clear search"]');
    await expect(searchInput).not.toBeVisible();
  });

  test('should display table of contents', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Check TOC is visible
    const toc = page.locator('text=Table of Contents');
    await expect(toc).toBeVisible();

    // Click on a TOC item
    const tocItem = page.locator('nav button').first();
    await tocItem.click();
    await page.waitForTimeout(500);

    // Verify page changed
    const pageInput = page.locator('input[type="number"]').first();
    const pageValue = await pageInput.inputValue();
    expect(parseInt(pageValue)).toBeGreaterThan(0);
  });

  test('should toggle TOC visibility', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // TOC should be visible initially
    await expect(page.locator('text=Table of Contents')).toBeVisible();

    // Click toggle button
    const toggleButton = page.locator('button').filter({ hasText: /Hide table of contents/ }).first();
    await toggleButton.click();

    // TOC should be hidden
    await expect(page.locator('text=Table of Contents')).not.toBeVisible();

    // Click toggle again
    await page.locator('button[title="Show table of contents"]').click();

    // TOC should be visible again
    await expect(page.locator('text=Table of Contents')).toBeVisible();
  });

  test('should display document metadata', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Metadata panel should be visible
    await expect(page.locator('text=Document Information')).toBeVisible();

    // Check metadata fields
    await expect(page.locator('text=Title')).toBeVisible();
    await expect(page.locator('text=File Details')).toBeVisible();
  });

  test('should toggle metadata panel', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Metadata should be visible initially
    await expect(page.locator('text=Document Information')).toBeVisible();

    // Click toggle button
    await page.click('button[title="Hide metadata"]');

    // Metadata should be hidden
    await expect(page.locator('text=Document Information')).not.toBeVisible();

    // Click toggle again
    await page.click('button[title="Show metadata"]');

    // Metadata should be visible again
    await expect(page.locator('text=Document Information')).toBeVisible();
  });

  test('should add bookmark', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Navigate to page 2
    await page.click('button[title="Next page"]');
    await page.waitForTimeout(500);

    // Click bookmark button
    page.on('dialog', dialog => dialog.accept('Test bookmark note'));
    await page.click('button[title="Add bookmark"]');

    // Wait for confirmation
    await page.waitForTimeout(500);
  });

  test('should download document', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await page.click('button[title="Download document"]');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should render HTML document', async ({ page }) => {
    await page.goto('/documents/test-html-doc-id');

    // Wait for HTML content to load
    await page.waitForSelector('.html-content', { timeout: 5000 });

    // Check that content is visible
    const htmlContent = page.locator('.html-content');
    await expect(htmlContent).toBeVisible();

    // Check zoom controls work
    await page.click('button[title="Zoom in"]');
    await page.waitForTimeout(300);
    
    const zoomDisplay = page.locator('text=/\\d+%/');
    await expect(zoomDisplay).toContainText('110%');
  });

  test('should render Markdown document', async ({ page }) => {
    await page.goto('/documents/test-markdown-doc-id');

    // Wait for markdown content to load
    await page.waitForSelector('.prose', { timeout: 5000 });

    // Check that content is visible
    const markdownContent = page.locator('.prose');
    await expect(markdownContent).toBeVisible();

    // Check that markdown is properly formatted
    await expect(page.locator('.prose h1, .prose h2, .prose h3')).toHaveCount({ min: 1 });
  });

  test('should search in HTML document', async ({ page }) => {
    await page.goto('/documents/test-html-doc-id');
    await page.waitForSelector('.html-content');

    // Open search
    await page.click('button[title="Search in document"]');
    
    // Type search query
    const searchInput = page.locator('input[placeholder="Search..."]');
    await searchInput.fill('regulation');
    await searchInput.press('Enter');

    // Wait for highlighting
    await page.waitForTimeout(500);

    // Check that search terms are highlighted
    const highlights = page.locator('mark');
    await expect(highlights.first()).toBeVisible();
  });

  test('should handle document not found', async ({ page }) => {
    await page.goto('/documents/non-existent-doc-id');

    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible();
    await expect(page.locator('text=/Document not found|Failed to load document/')).toBeVisible();
  });

  test('should track document view', async ({ page }) => {
    await page.goto('/documents/test-pdf-doc-id');
    await page.waitForSelector('.react-pdf__Document');

    // Navigate through pages
    await page.click('button[title="Next page"]');
    await page.waitForTimeout(500);
    await page.click('button[title="Next page"]');
    await page.waitForTimeout(500);

    // Perform search
    await page.click('button[title="Search in document"]');
    const searchInput = page.locator('input[placeholder="Search..."]');
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    // Navigate away (this should trigger view tracking)
    await page.goto('/dashboard');

    // View should be tracked in database
    // (This would need to be verified with a database query in a real test)
  });
});
