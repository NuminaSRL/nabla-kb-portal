import { test, expect, Page } from '@playwright/test';

/**
 * Document Viewer Comprehensive Tests
 * Verifies document viewer handles all formats and features
 * Requirement 26.9: Document viewer with highlighting, annotations, and export
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

async function openDocument(page: Page, documentId: string = 'test-doc-1') {
  await page.goto(`${BASE_URL}/documents/${documentId}`);
  await page.waitForTimeout(1000);
}

test.describe('Document Viewer: Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pro-tier@example.com', 'ProUser123!');
  });

  test('should display document viewer', async ({ page }) => {
    await openDocument(page);
    
    // Should show document viewer
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
  });

  test('should display document metadata', async ({ page }) => {
    await openDocument(page);
    
    // Should show metadata panel
    await expect(page.locator('text=/Document Information/i')).toBeVisible();
    await expect(page.locator('text=/Title/i')).toBeVisible();
    await expect(page.locator('text=/Source/i')).toBeVisible();
    await expect(page.locator('text=/Date/i')).toBeVisible();
  });

  test('should display table of contents', async ({ page }) => {
    await openDocument(page);
    
    // Should show TOC
    const tocButton = page.locator('button:has-text("Contents")');
    await tocButton.click();
    
    await expect(page.locator('text=/Table of Contents/i')).toBeVisible();
  });

  test('should navigate using table of contents', async ({ page }) => {
    await openDocument(page);
    
    // Open TOC
    await page.click('button:has-text("Contents")');
    
    // Click on a section
    const firstSection = page.locator('[data-testid="toc-item"]').first();
    await firstSection.click();
    
    // Should scroll to section
    await page.waitForTimeout(500);
    
    // Verify navigation occurred (URL or scroll position changed)
    const url = page.url();
    expect(url).toContain('#');
  });

  test('should zoom in and out', async ({ page }) => {
    await openDocument(page);
    
    // Click zoom in
    const zoomInButton = page.locator('button[aria-label="Zoom in"]');
    await zoomInButton.click();
    
    // Should increase zoom level
    await expect(page.locator('text=/150%/i')).toBeVisible();
    
    // Click zoom out
    const zoomOutButton = page.locator('button[aria-label="Zoom out"]');
    await zoomOutButton.click();
    await zoomOutButton.click();
    
    // Should decrease zoom level
    await expect(page.locator('text=/100%/i')).toBeVisible();
  });

  test('should toggle fullscreen mode', async ({ page }) => {
    await openDocument(page);
    
    // Click fullscreen button
    const fullscreenButton = page.locator('button[aria-label="Fullscreen"]');
    await fullscreenButton.click();
    
    // Should enter fullscreen (check for fullscreen class or attribute)
    await page.waitForTimeout(500);
    
    // Exit fullscreen
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should search within document', async ({ page }) => {
    await openDocument(page);
    
    // Open search
    await page.keyboard.press('Control+F');
    
    // Type search query
    const searchInput = page.locator('input[placeholder*="Search in document"]');
    await searchInput.fill('compliance');
    
    // Should highlight matches
    await page.waitForTimeout(500);
    const highlights = page.locator('.highlight');
    const count = await highlights.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Document Viewer: Annotations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pro-tier@example.com', 'ProUser123!');
    await openDocument(page);
  });

  test('should create text highlight annotation', async ({ page }) => {
    // Select text
    await page.locator('p').first().dblclick();
    
    // Click highlight button
    const highlightButton = page.locator('button[aria-label="Highlight"]');
    await highlightButton.click();
    
    // Should create highlight
    await expect(page.locator('.annotation-highlight')).toBeVisible();
  });

  test('should add note annotation', async ({ page }) => {
    // Click add note button
    const noteButton = page.locator('button:has-text("Add Note")');
    await noteButton.click();
    
    // Fill note
    await page.fill('textarea[placeholder*="note"]', 'This is my annotation');
    await page.click('button:has-text("Save")');
    
    // Should show note indicator
    await expect(page.locator('[data-testid="note-indicator"]')).toBeVisible();
  });

  test('should edit existing annotation', async ({ page }) => {
    // Create annotation first
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[placeholder*="note"]', 'Original note');
    await page.click('button:has-text("Save")');
    
    // Click on annotation to edit
    await page.locator('[data-testid="note-indicator"]').click();
    
    // Edit note
    await page.fill('textarea', 'Updated note');
    await page.click('button:has-text("Save")');
    
    // Should show updated note
    await expect(page.locator('text=/Updated note/i')).toBeVisible();
  });

  test('should delete annotation', async ({ page }) => {
    // Create annotation
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[placeholder*="note"]', 'Note to delete');
    await page.click('button:has-text("Save")');
    
    // Click on annotation
    await page.locator('[data-testid="note-indicator"]').click();
    
    // Delete annotation
    await page.click('button[aria-label="Delete"]');
    await page.click('button:has-text("Confirm")');
    
    // Should be removed
    const noteCount = await page.locator('[data-testid="note-indicator"]').count();
    expect(noteCount).toBe(0);
  });

  test('should export annotations', async ({ page }) => {
    // Create some annotations
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[placeholder*="note"]', 'Test annotation');
    await page.click('button:has-text("Save")');
    
    // Click export annotations
    await page.click('button:has-text("Export Annotations")');
    
    // Select format
    await page.click('text=/JSON/i');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should share annotation', async ({ page }) => {
    // Create annotation
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[placeholder*="note"]', 'Shared note');
    await page.click('button:has-text("Save")');
    
    // Click on annotation
    await page.locator('[data-testid="note-indicator"]').click();
    
    // Click share button
    await page.click('button[aria-label="Share"]');
    
    // Should show share dialog
    await expect(page.locator('text=/Share Annotation/i')).toBeVisible();
    
    // Generate share link
    await page.click('button:has-text("Generate Link")');
    
    // Should show link
    await expect(page.locator('input[readonly]')).toBeVisible();
  });
});

test.describe('Document Viewer: Bookmarks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pro-tier@example.com', 'ProUser123!');
    await openDocument(page);
  });

  test('should add bookmark', async ({ page }) => {
    // Click bookmark button
    const bookmarkButton = page.locator('button[aria-label="Bookmark"]');
    await bookmarkButton.click();
    
    // Should show bookmarked state
    await expect(bookmarkButton).toHaveClass(/bookmarked/);
  });

  test('should remove bookmark', async ({ page }) => {
    // Add bookmark
    const bookmarkButton = page.locator('button[aria-label="Bookmark"]');
    await bookmarkButton.click();
    
    // Remove bookmark
    await bookmarkButton.click();
    
    // Should show unbookmarked state
    await expect(bookmarkButton).not.toHaveClass(/bookmarked/);
  });

  test('should view all bookmarks', async ({ page }) => {
    // Add bookmark
    await page.click('button[aria-label="Bookmark"]');
    
    // Go to bookmarks page
    await page.goto(`${BASE_URL}/dashboard/bookmarks`);
    
    // Should show bookmarked document
    await expect(page.locator('[data-testid="bookmark-item"]')).toBeVisible();
  });
});

test.describe('Document Viewer: Export Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pro-tier@example.com', 'ProUser123!');
    await openDocument(page);
  });

  test('should export document as PDF', async ({ page }) => {
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Select PDF format
    await page.click('text=/PDF/i');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should export document with annotations', async ({ page }) => {
    // Add annotation
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[placeholder*="note"]', 'Export test');
    await page.click('button:has-text("Save")');
    
    // Export with annotations
    await page.click('button:has-text("Export")');
    await page.check('input[type="checkbox"]'); // Include annotations
    await page.click('text=/PDF/i');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Document Viewer: Format Support', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'pro-tier@example.com', 'ProUser123!');
  });

  test('should display PDF documents', async ({ page }) => {
    await openDocument(page, 'pdf-doc-1');
    
    // Should show PDF viewer
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();
  });

  test('should display HTML documents', async ({ page }) => {
    await openDocument(page, 'html-doc-1');
    
    // Should show HTML content
    await expect(page.locator('[data-testid="html-viewer"]')).toBeVisible();
  });

  test('should display Markdown documents', async ({ page }) => {
    await openDocument(page, 'md-doc-1');
    
    // Should show rendered markdown
    await expect(page.locator('[data-testid="markdown-viewer"]')).toBeVisible();
  });

  test('should handle unsupported formats gracefully', async ({ page }) => {
    await openDocument(page, 'unsupported-doc-1');
    
    // Should show download option
    await expect(page.locator('text=/Download to view/i')).toBeVisible();
  });
});
