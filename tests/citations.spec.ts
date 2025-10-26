import { test, expect } from '@playwright/test';

test.describe('Citation System', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display citation button on document viewer', async ({ page }) => {
    // Navigate to a document
    await page.goto('/documents/test-document-id');
    
    // Check for citation button
    const citationButton = page.locator('button:has-text("Cite")');
    await expect(citationButton).toBeVisible();
  });

  test('should open citation dialog when cite button clicked', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    
    // Click citation button
    await page.click('button:has-text("Cite")');
    
    // Check dialog is open
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('text=Cite This Document')).toBeVisible();
  });

  test('should display all citation formats', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Check all tabs are present
    await expect(page.locator('button[role="tab"]:has-text("APA")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("MLA")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Chicago")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Bluebook")')).toBeVisible();
  });

  test('should generate APA citation correctly', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click APA tab
    await page.click('button[role="tab"]:has-text("APA")');
    
    // Check citation is displayed
    const citation = page.locator('.bg-muted.rounded-lg');
    await expect(citation).toBeVisible();
    
    // Check for key APA elements (year in parentheses, italicized title)
    const citationText = await citation.textContent();
    expect(citationText).toMatch(/\(\d{4}\)/); // Year in parentheses
  });

  test('should generate MLA citation correctly', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click MLA tab
    await page.click('button[role="tab"]:has-text("MLA")');
    
    // Check citation is displayed
    const citation = page.locator('.bg-muted.rounded-lg');
    await expect(citation).toBeVisible();
  });

  test('should generate Chicago citation correctly', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click Chicago tab
    await page.click('button[role="tab"]:has-text("Chicago")');
    
    // Check citation is displayed
    const citation = page.locator('.bg-muted.rounded-lg');
    await expect(citation).toBeVisible();
  });

  test('should generate Bluebook citation correctly', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click Bluebook tab
    await page.click('button[role="tab"]:has-text("Bluebook")');
    
    // Check citation is displayed
    const citation = page.locator('.bg-muted.rounded-lg');
    await expect(citation).toBeVisible();
  });

  test('should copy citation to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click copy button
    await page.click('button:has-text("Copy")');
    
    // Check for success feedback
    await expect(page.locator('text=Copied')).toBeVisible();
    
    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBeTruthy();
    expect(clipboardText.length).toBeGreaterThan(0);
  });

  test('should show copied state after copying', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click copy button
    const copyButton = page.locator('button:has-text("Copy")').first();
    await copyButton.click();
    
    // Check button changes to "Copied"
    await expect(page.locator('button:has-text("Copied")')).toBeVisible();
    
    // Wait for state to reset
    await page.waitForTimeout(2500);
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
  });

  test('should export all citation formats', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('button:has-text("Export All Formats")');
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/citations.*\.txt/);
  });

  test('should export BibTeX format', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click BibTeX export button
    await page.click('button:has-text("Export BibTeX")');
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/citation.*\.bib/);
  });

  test('should display plain text version of citation', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Check for plain text section
    await expect(page.locator('text=Plain text:')).toBeVisible();
    
    // Check pre element with citation
    const plainText = page.locator('pre.whitespace-pre-wrap');
    await expect(plainText).toBeVisible();
    
    const text = await plainText.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('should switch between citation styles', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Start with APA
    await page.click('button[role="tab"]:has-text("APA")');
    const apaCitation = await page.locator('.bg-muted.rounded-lg').textContent();
    
    // Switch to MLA
    await page.click('button[role="tab"]:has-text("MLA")');
    const mlaCitation = await page.locator('.bg-muted.rounded-lg').textContent();
    
    // Citations should be different
    expect(apaCitation).not.toBe(mlaCitation);
    
    // Switch to Chicago
    await page.click('button[role="tab"]:has-text("Chicago")');
    const chicagoCitation = await page.locator('.bg-muted.rounded-lg').textContent();
    
    expect(chicagoCitation).not.toBe(apaCitation);
    expect(chicagoCitation).not.toBe(mlaCitation);
  });

  test('should handle documents with multiple authors', async ({ page }) => {
    await page.goto('/documents/multi-author-document-id');
    await page.click('button:has-text("Cite")');
    
    // Check APA format handles multiple authors
    await page.click('button[role="tab"]:has-text("APA")');
    const citation = await page.locator('.bg-muted.rounded-lg').textContent();
    
    // Should contain "&" for multiple authors in APA
    expect(citation).toContain('&');
  });

  test('should handle documents without authors', async ({ page }) => {
    await page.goto('/documents/no-author-document-id');
    await page.click('button:has-text("Cite")');
    
    // Citation should still be generated
    const citation = page.locator('.bg-muted.rounded-lg');
    await expect(citation).toBeVisible();
    
    const text = await citation.textContent();
    expect(text).toBeTruthy();
  });

  test('should handle legal documents in Bluebook format', async ({ page }) => {
    await page.goto('/documents/legal-document-id');
    await page.click('button:has-text("Cite")');
    
    // Click Bluebook tab
    await page.click('button[role="tab"]:has-text("Bluebook")');
    
    // Check citation is displayed with legal formatting
    const citation = page.locator('.bg-muted.rounded-lg');
    await expect(citation).toBeVisible();
  });

  test('should close dialog when clicking outside', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Dialog should be visible
    await expect(page.locator('role=dialog')).toBeVisible();
    
    // Click outside dialog (on overlay)
    await page.click('body', { position: { x: 10, y: 10 } });
    
    // Dialog should close
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('should display document title in dialog', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Check document title is shown
    await expect(page.locator('text=Generate citations in multiple formats for:')).toBeVisible();
  });

  test('should show toast notification on successful copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    await page.click('button:has-text("Copy")');
    
    // Check for toast notification
    await expect(page.locator('text=Citation copied')).toBeVisible();
  });

  test('should show toast notification on successful export', async ({ page }) => {
    await page.goto('/documents/test-document-id');
    await page.click('button:has-text("Cite")');
    
    // Trigger export
    await page.click('button:has-text("Export All Formats")');
    
    // Check for toast notification
    await expect(page.locator('text=Citations exported')).toBeVisible();
  });
});

test.describe('Citation API', () => {
  test('should fetch citation metadata via API', async ({ request }) => {
    // Login first to get session
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123',
      },
    });
    expect(loginResponse.ok()).toBeTruthy();

    // Fetch citation metadata
    const response = await request.get('/api/citations?documentId=test-document-id');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.id).toBe('test-document-id');
    expect(data.metadata.title).toBeDefined();
  });

  test('should require authentication for citation API', async ({ request }) => {
    const response = await request.get('/api/citations?documentId=test-document-id');
    expect(response.status()).toBe(401);
  });

  test('should return 404 for non-existent document', async ({ request }) => {
    // Login first
    await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123',
      },
    });

    const response = await request.get('/api/citations?documentId=non-existent-id');
    expect(response.status()).toBe(404);
  });
});
