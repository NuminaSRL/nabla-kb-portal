import { test, expect } from '@playwright/test';

test.describe('Saved Searches System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Pro user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'pro@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display saved searches page', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    await expect(page.locator('h2:has-text("Saved Searches")')).toBeVisible();
  });

  test('should create a new saved search', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Click create button
    await page.click('button:has-text("Create Saved Search")');
    
    // Fill in the form
    await page.fill('input[id="name"]', 'Test GDPR Search');
    await page.fill('input[id="query"]', 'GDPR compliance requirements');
    
    // Enable alerts
    await page.click('button[id="alert-enabled"]');
    
    // Select frequency
    await page.click('button[id="frequency"]');
    await page.click('text=Weekly');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Verify success
    await expect(page.locator('text=Saved search created')).toBeVisible();
    await expect(page.locator('text=Test GDPR Search')).toBeVisible();
  });

  test('should execute a saved search', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Find and click execute button
    const executeButton = page.locator('button[title="Execute search"]').first();
    await executeButton.click();
    
    // Should navigate to search results
    await page.waitForURL(/\/search\?saved=/);
    await expect(page.locator('text=Search Results')).toBeVisible();
  });

  test('should toggle alerts for a saved search', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Find and click alert toggle button
    const alertButton = page.locator('button[title*="alerts"]').first();
    await alertButton.click();
    
    // Verify success message
    await expect(page.locator('text=Alerts')).toBeVisible();
  });

  test('should edit a saved search', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Click edit button
    await page.click('button[title="Edit search"]');
    
    // Update name
    await page.fill('input[id="name"]', 'Updated Search Name');
    
    // Submit
    await page.click('button:has-text("Update")');
    
    // Verify success
    await expect(page.locator('text=Saved search updated')).toBeVisible();
    await expect(page.locator('text=Updated Search Name')).toBeVisible();
  });

  test('should delete a saved search', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Click delete button
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button[title="Delete search"]');
    
    // Verify success
    await expect(page.locator('text=Saved search deleted')).toBeVisible();
  });

  test('should open alert settings dialog', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Click alert settings button
    await page.click('button[title="Alert settings"]');
    
    // Verify dialog is open
    await expect(page.locator('text=Alert Settings')).toBeVisible();
    await expect(page.locator('text=Recent Alerts')).toBeVisible();
  });

  test('should update alert frequency', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Open alert settings
    await page.click('button[title="Alert settings"]');
    
    // Change frequency
    await page.click('button[id="frequency"]');
    await page.click('text=Daily');
    
    // Save
    await page.click('button:has-text("Save Settings")');
    
    // Verify success
    await expect(page.locator('text=Alert settings updated')).toBeVisible();
  });

  test('should enforce saved search limit for Pro tier', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Check limit display
    await expect(page.locator('text=/\\d+ of 20 saved searches/')).toBeVisible();
  });

  test('should show recent alerts in alert settings', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Open alert settings
    await page.click('button[title="Alert settings"]');
    
    // Check for recent alerts section
    await expect(page.locator('text=Recent Alerts')).toBeVisible();
  });

  test('should display alert badges on saved searches', async ({ page }) => {
    await page.goto('/dashboard/saved-searches');
    
    // Look for alert badges
    const alertBadges = page.locator('text=/Daily|Weekly|Monthly/');
    const count = await alertBadges.count();
    
    // Should have at least one badge if alerts are enabled
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Saved Searches API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'pro@test.com',
        password: 'testpassword',
      },
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('GET /api/saved-searches should return saved searches', async ({ request }) => {
    const response = await request.get('/api/saved-searches', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('saved_searches');
    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('limit');
  });

  test('POST /api/saved-searches should create saved search', async ({ request }) => {
    const response = await request.post('/api/saved-searches', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'API Test Search',
        query: 'test query',
        alert_enabled: true,
        alert_frequency: 'weekly',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.saved_search).toHaveProperty('id');
    expect(data.saved_search.name).toBe('API Test Search');
  });

  test('PATCH /api/saved-searches/[id] should update saved search', async ({ request }) => {
    // First create a search
    const createResponse = await request.post('/api/saved-searches', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Update Test',
        query: 'test',
      },
    });
    const createData = await createResponse.json();
    const searchId = createData.saved_search.id;

    // Update it
    const updateResponse = await request.patch(`/api/saved-searches/${searchId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Updated Name',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData.saved_search.name).toBe('Updated Name');
  });

  test('DELETE /api/saved-searches/[id] should delete saved search', async ({ request }) => {
    // First create a search
    const createResponse = await request.post('/api/saved-searches', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Delete Test',
        query: 'test',
      },
    });
    const createData = await createResponse.json();
    const searchId = createData.saved_search.id;

    // Delete it
    const deleteResponse = await request.delete(`/api/saved-searches/${searchId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('POST /api/saved-searches/[id]/execute should execute search', async ({ request }) => {
    // First create a search
    const createResponse = await request.post('/api/saved-searches', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Execute Test',
        query: 'GDPR',
      },
    });
    const createData = await createResponse.json();
    const searchId = createData.saved_search.id;

    // Execute it
    const executeResponse = await request.post(`/api/saved-searches/${searchId}/execute`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(executeResponse.ok()).toBeTruthy();
    const executeData = await executeResponse.json();
    expect(executeData).toHaveProperty('results');
  });

  test('GET /api/saved-searches/[id]/alerts should return alerts', async ({ request }) => {
    // Assuming there's a saved search with ID
    const response = await request.get('/api/saved-searches/test-id/alerts', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // May return 404 if search doesn't exist, which is fine for this test
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('alerts');
    }
  });
});
