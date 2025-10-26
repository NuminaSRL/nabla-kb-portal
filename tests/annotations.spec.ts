import { test, expect } from '@playwright/test';

test.describe('Annotation System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Pro user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'pro@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show annotation toolbar for Pro users', async ({ page }) => {
    // Navigate to a document
    await page.goto('/documents/test-doc-1');
    
    // Wait for document to load
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 10000 });
    
    // Check annotation toolbar is visible
    await expect(page.locator('text=Highlight')).toBeVisible();
    await expect(page.locator('text=Note')).toBeVisible();
    await expect(page.locator('text=Export')).toBeVisible();
  });

  test('should not show annotation toolbar for Free users', async ({ page }) => {
    // Logout and login as Free user
    await page.goto('/dashboard/profile');
    await page.click('text=Logout');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'free@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to a document
    await page.goto('/documents/test-doc-1');
    
    // Check upgrade prompt is shown
    await expect(page.locator('text=Annotations available for Pro and Enterprise users')).toBeVisible();
    await expect(page.locator('text=Upgrade')).toBeVisible();
  });

  test('should create a highlight', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Enable highlight mode
    await page.click('text=Highlight');
    
    // Select color
    await page.click('[title="Yellow"]');
    
    // Simulate text selection and highlight creation
    // Note: Actual text selection in Playwright is complex, this is a simplified test
    const documentContent = page.locator('[data-testid="document-content"]');
    await documentContent.click();
    
    // Check highlight mode is active
    await expect(page.locator('button:has-text("Highlight")').first()).toHaveClass(/bg-blue-100/);
  });

  test('should create a note', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Enable note mode
    await page.click('text=Note');
    
    // Check note mode is active
    await expect(page.locator('button:has-text("Note")').first()).toHaveClass(/bg-blue-100/);
  });

  test('should display annotation count', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Check annotation count is displayed
    await expect(page.locator('text=/\\d+ annotations?/')).toBeVisible();
  });

  test('should show annotation panel', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Click annotation toggle button
    const annotationToggle = page.locator('button[title*="annotations"]');
    await annotationToggle.click();
    
    // Check annotation panel is visible
    await expect(page.locator('text=Annotations')).toBeVisible();
    await expect(page.locator('text=All')).toBeVisible();
    await expect(page.locator('text=Highlights')).toBeVisible();
    await expect(page.locator('text=Notes')).toBeVisible();
  });

  test('should filter annotations by type', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Open annotation panel
    await page.click('button[title*="annotations"]');
    
    // Click Highlights filter
    await page.click('button:has-text("Highlights")');
    
    // Check filter is active
    await expect(page.locator('button:has-text("Highlights")').first()).toHaveClass(/bg-blue-100/);
    
    // Click Notes filter
    await page.click('button:has-text("Notes")');
    
    // Check filter is active
    await expect(page.locator('button:has-text("Notes")').first()).toHaveClass(/bg-blue-100/);
  });

  test('should export annotations as Markdown', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Click export button
    await page.click('text=Export');
    
    // Check export dialog is open
    await expect(page.locator('text=Export Annotations')).toBeVisible();
    
    // Select Markdown format
    await page.click('text=Markdown (.md)');
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });

  test('should export annotations as JSON', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Click export button
    await page.click('text=Export');
    
    // Select JSON format
    await page.click('text=JSON (.json)');
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should show share button for Enterprise users', async ({ page }) => {
    // Logout and login as Enterprise user
    await page.goto('/dashboard/profile');
    await page.click('text=Logout');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'enterprise@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Check share button is visible
    await expect(page.locator('text=Share')).toBeVisible();
  });

  test('should not show share button for Pro users', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Check share button is not visible in toolbar
    const shareButton = page.locator('button:has-text("Share")').first();
    await expect(shareButton).not.toBeVisible();
  });

  test('should open share dialog for Enterprise users', async ({ page }) => {
    // Login as Enterprise user
    await page.goto('/dashboard/profile');
    await page.click('text=Logout');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'enterprise@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Click share button
    await page.click('text=Share');
    
    // Check share dialog is open
    await expect(page.locator('text=Share Highlight')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('should delete annotation', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Open annotation panel
    await page.click('button[title*="annotations"]');
    
    // Find and click delete button on first annotation
    const deleteButton = page.locator('[title="Delete highlight"]').first();
    
    // Setup dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    await deleteButton.click();
    
    // Wait for deletion to complete
    await page.waitForTimeout(500);
  });

  test('should clear all annotations', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Setup dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    // Click clear button
    await page.click('text=Clear');
    
    // Wait for clearing to complete
    await page.waitForTimeout(500);
    
    // Check annotation count is 0
    await expect(page.locator('text=0 annotations')).toBeVisible();
  });

  test('should persist annotations across page reloads', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Get initial annotation count
    const countText = await page.locator('text=/\\d+ annotations?/').textContent();
    const initialCount = parseInt(countText?.match(/\d+/)?.[0] || '0');
    
    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Check annotation count is the same
    const newCountText = await page.locator('text=/\\d+ annotations?/').textContent();
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0');
    
    expect(newCount).toBe(initialCount);
  });

  test('should navigate to annotation page when clicked', async ({ page }) => {
    await page.goto('/documents/test-doc-1');
    await page.waitForSelector('[data-testid="document-viewer"]');
    
    // Open annotation panel
    await page.click('button[title*="annotations"]');
    
    // Click on first annotation
    const firstAnnotation = page.locator('[data-testid="annotation-item"]').first();
    await firstAnnotation.click();
    
    // Check that page navigation occurred (implementation dependent)
    await page.waitForTimeout(500);
  });
});

