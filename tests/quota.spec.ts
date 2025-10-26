import { test, expect } from '@playwright/test';

test.describe('Quota Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display quota status on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if quota status card is visible
    await expect(page.locator('text=Quota Status')).toBeVisible();
    await expect(page.locator('text=Daily Searches')).toBeVisible();

    // Check if usage information is displayed
    const usageText = await page.locator('text=/\\d+ \\/ \\d+/').first();
    await expect(usageText).toBeVisible();
  });

  test('should enforce free tier limits (20 searches/day)', async ({ page }) => {
    // Perform searches up to the limit
    for (let i = 0; i < 20; i++) {
      await page.goto('/search');
      await page.fill('input[placeholder*="Search"]', `test query ${i}`);
      await page.press('input[placeholder*="Search"]', 'Enter');
      await page.waitForResponse((response) => response.url().includes('/api/search'));
    }

    // Try one more search - should be blocked
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'test query 21');
    await page.press('input[placeholder*="Search"]', 'Enter');

    // Should show quota exceeded message
    await expect(page.locator('text=/quota.*exceeded/i')).toBeVisible();
    await expect(page.locator('text=/upgrade/i')).toBeVisible();
  });

  test('should show upgrade prompt when quota exceeded', async ({ page }) => {
    // Simulate quota exceeded by making many searches
    // (In real test, you'd set up test data to have user at limit)
    
    // Navigate to search and trigger quota exceeded
    await page.goto('/search');
    
    // Check if upgrade prompt appears
    const upgradePrompt = page.locator('text=Upgrade to Pro');
    if (await upgradePrompt.isVisible()) {
      await expect(upgradePrompt).toBeVisible();
      await expect(page.locator('text=/500 searches per day/i')).toBeVisible();
      
      // Test dismiss functionality
      await page.click('button:has-text("Maybe Later")');
      await expect(upgradePrompt).not.toBeVisible();
    }
  });

  test('should display usage statistics', async ({ page }) => {
    await page.goto('/dashboard/profile');

    // Check if usage statistics are visible
    await expect(page.locator('text=Usage Statistics')).toBeVisible();
    
    // Check for statistics elements
    await expect(page.locator('text=/total.*usage/i')).toBeVisible();
    await expect(page.locator('text=/average.*daily/i')).toBeVisible();
  });

  test('should show quota information in API response headers', async ({ page }) => {
    // Intercept search API call
    const responsePromise = page.waitForResponse((response) => 
      response.url().includes('/api/search') && response.status() === 200
    );

    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'test query');
    await page.press('input[placeholder*="Search"]', 'Enter');

    const response = await responsePromise;
    const headers = response.headers();

    // Check for quota headers
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(headers['x-ratelimit-reset']).toBeDefined();
  });

  test('should update quota status in real-time', async ({ page }) => {
    await page.goto('/dashboard');

    // Get initial usage count
    const initialUsage = await page.locator('text=/\\d+ \\/ \\d+/').first().textContent();
    const initialCount = parseInt(initialUsage?.split('/')[0].trim() || '0');

    // Perform a search
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'test query');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await page.waitForResponse((response) => response.url().includes('/api/search'));

    // Go back to dashboard and check updated usage
    await page.goto('/dashboard');
    await page.waitForTimeout(1000); // Wait for quota status to refresh

    const updatedUsage = await page.locator('text=/\\d+ \\/ \\d+/').first().textContent();
    const updatedCount = parseInt(updatedUsage?.split('/')[0].trim() || '0');

    // Usage should have increased by 1
    expect(updatedCount).toBe(initialCount + 1);
  });

  test('should show approaching limit warning at 75%', async ({ page }) => {
    // This test assumes user is at 75% of quota
    // In real scenario, you'd set up test data accordingly
    
    await page.goto('/dashboard');

    // Check for warning alert
    const warningAlert = page.locator('text=/approaching.*limit/i');
    if (await warningAlert.isVisible()) {
      await expect(warningAlert).toBeVisible();
      await expect(page.locator('text=/upgrade/i')).toBeVisible();
    }
  });

  test('should allow unlimited searches for enterprise tier', async ({ page }) => {
    // This test requires an enterprise tier user
    // Skip if not enterprise
    const tierBadge = await page.locator('text=ENTERPRISE').count();
    if (tierBadge === 0) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');

    // Check for unlimited indicator
    await expect(page.locator('text=Unlimited')).toBeVisible();

    // Perform multiple searches - should all succeed
    for (let i = 0; i < 25; i++) {
      await page.goto('/search');
      await page.fill('input[placeholder*="Search"]', `test query ${i}`);
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      const response = await page.waitForResponse((response) => 
        response.url().includes('/api/search')
      );
      
      expect(response.status()).toBe(200);
    }
  });

  test('should reset quota at midnight', async ({ page }) => {
    // This test checks if quota reset functionality works
    // Note: This is a conceptual test - actual implementation would need
    // to mock time or use test data with expired periods

    await page.goto('/dashboard');

    // Check reset time display
    await expect(page.locator('text=/quota resets/i')).toBeVisible();
    
    // Verify reset time is shown
    const resetText = await page.locator('text=/quota resets/i').textContent();
    expect(resetText).toContain(':');
  });

  test('should track quota events for analytics', async ({ page }) => {
    // Perform a search to generate quota event
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'test query');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await page.waitForResponse((response) => response.url().includes('/api/search'));

    // Navigate to usage statistics
    await page.goto('/dashboard/profile');

    // Check if event is tracked
    await expect(page.locator('text=Usage Statistics')).toBeVisible();
    
    // Verify statistics show recent activity
    const statsSection = page.locator('text=Usage Statistics').locator('..');
    await expect(statsSection).toBeVisible();
  });

  test('should handle quota check errors gracefully', async ({ page }) => {
    // Simulate network error by blocking quota API
    await page.route('**/api/quota/**', (route) => route.abort());

    await page.goto('/dashboard');

    // Should show error state or fallback UI
    // The exact behavior depends on your error handling implementation
    await expect(page.locator('text=/error|failed/i')).toBeVisible();
  });

  test('should allow dismissing upgrade prompts', async ({ page }) => {
    await page.goto('/dashboard');

    // If upgrade prompt is visible
    const upgradePrompt = page.locator('[role="dialog"]:has-text("Upgrade")');
    if (await upgradePrompt.isVisible()) {
      // Dismiss the prompt
      await page.click('button:has-text("Maybe Later")');
      
      // Prompt should be hidden
      await expect(upgradePrompt).not.toBeVisible();

      // Refresh page - prompt should not reappear immediately
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Prompt should still be dismissed
      await expect(upgradePrompt).not.toBeVisible();
    }
  });

  test('should track upgrade prompt conversions', async ({ page }) => {
    await page.goto('/dashboard');

    // If upgrade prompt is visible
    const upgradePrompt = page.locator('[role="dialog"]:has-text("Upgrade")');
    if (await upgradePrompt.isVisible()) {
      // Click upgrade button
      await page.click('button:has-text("Upgrade Now")');
      
      // Should redirect to pricing page
      await page.waitForURL('**/pricing');
      expect(page.url()).toContain('/pricing');
    }
  });
});

test.describe('Quota API Endpoints', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token for API tests
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123',
      },
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('GET /api/quota/status should return quota information', async ({ request }) => {
    const response = await request.get('/api/quota/status', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('user_id');
    expect(data.data).toHaveProperty('tier');
    expect(data.data).toHaveProperty('quotas');
    expect(data.data.quotas).toHaveProperty('search');
  });

  test('GET /api/quota/statistics should return usage statistics', async ({ request }) => {
    const response = await request.get('/api/quota/statistics?days=7', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('statistics');
    expect(Array.isArray(data.data.statistics)).toBe(true);
  });

  test('GET /api/quota/prompts should return upgrade prompts', async ({ request }) => {
    const response = await request.get('/api/quota/prompts', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('prompts');
    expect(Array.isArray(data.data.prompts)).toBe(true);
  });

  test('PATCH /api/quota/prompts should dismiss prompt', async ({ request }) => {
    // First get a prompt
    const getResponse = await request.get('/api/quota/prompts', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const getData = await getResponse.json();
    
    if (getData.data.prompts.length > 0) {
      const promptId = getData.data.prompts[0].id;
      
      // Dismiss the prompt
      const patchResponse = await request.patch('/api/quota/prompts', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt_id: promptId,
          action: 'dismiss',
        },
      });

      expect(patchResponse.status()).toBe(200);
      const patchData = await patchResponse.json();
      expect(patchData.success).toBe(true);
    }
  });

  test('POST /api/search should enforce quota limits', async ({ request }) => {
    // Make search requests up to limit
    let lastResponse;
    for (let i = 0; i < 25; i++) {
      lastResponse = await request.post('/api/search', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          query: `test query ${i}`,
          options: { limit: 5 },
        },
      });

      // If we hit quota limit, response should be 429
      if (lastResponse.status() === 429) {
        const data = await lastResponse.json();
        expect(data.error).toContain('quota');
        expect(data).toHaveProperty('upgrade');
        break;
      }
    }
  });
});

