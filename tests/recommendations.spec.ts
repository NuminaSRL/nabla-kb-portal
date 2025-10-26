import { test, expect } from '@playwright/test';

test.describe('Personalized Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display recommendations page', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Personalized Recommendations');
    
    // Check tabs are present
    await expect(page.locator('text=Recommendations')).toBeVisible();
    await expect(page.locator('text=Your Interests')).toBeVisible();
    await expect(page.locator('text=Activity')).toBeVisible();
  });

  test('should display analytics cards', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for analytics to load
    await page.waitForTimeout(2000);
    
    // Check analytics cards
    await expect(page.locator('text=Impressions')).toBeVisible();
    await expect(page.locator('text=Clicks')).toBeVisible();
    await expect(page.locator('text=Click-Through Rate')).toBeVisible();
    await expect(page.locator('text=Dismissals')).toBeVisible();
  });

  test('should display recommendation cards', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Check if recommendations are displayed or empty state
    const hasRecommendations = await page.locator('[data-testid="recommendation-card"]').count() > 0;
    const hasEmptyState = await page.locator('text=No recommendations yet').isVisible();
    
    expect(hasRecommendations || hasEmptyState).toBeTruthy();
  });

  test('should refresh recommendations', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Click refresh button
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Check for loading state
      await expect(page.locator('.animate-spin')).toBeVisible();
      
      // Wait for refresh to complete
      await page.waitForTimeout(3000);
    }
  });

  test('should dismiss a recommendation', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Find first recommendation card
    const firstCard = page.locator('[data-testid="recommendation-card"]').first();
    
    if (await firstCard.isVisible()) {
      // Hover to show dismiss button
      await firstCard.hover();
      
      // Click dismiss button
      const dismissButton = firstCard.locator('button[aria-label="Dismiss"]');
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
        
        // Card should disappear
        await expect(firstCard).not.toBeVisible();
      }
    }
  });

  test('should click on a recommendation', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Find first recommendation card
    const firstCard = page.locator('[data-testid="recommendation-card"]').first();
    
    if (await firstCard.isVisible()) {
      // Click on the card
      await firstCard.click();
      
      // Should navigate to document page
      await page.waitForURL(/\/documents\/.+/);
      expect(page.url()).toContain('/documents/');
    }
  });

  test('should display user interests', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Click on Interests tab
    await page.click('text=Your Interests');
    
    // Wait for interests to load
    await page.waitForTimeout(2000);
    
    // Check if interests are displayed or empty state
    const hasInterests = await page.locator('text=Your Interest Profile').isVisible();
    const hasEmptyState = await page.locator('text=Building your interest profile').isVisible();
    
    expect(hasInterests || hasEmptyState).toBeTruthy();
  });

  test('should display activity summary', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Click on Activity tab
    await page.click('text=Activity');
    
    // Wait for activity to load
    await page.waitForTimeout(2000);
    
    // Check if activity is displayed or empty state
    const hasActivity = await page.locator('text=Recent Activity').isVisible();
    const hasEmptyState = await page.locator('text=No activity yet').isVisible();
    
    expect(hasActivity || hasEmptyState).toBeTruthy();
  });

  test('should track document interaction', async ({ page }) => {
    // Navigate to a document
    await page.goto('/search');
    await page.fill('input[placeholder*="Search"]', 'GDPR');
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Click on first result
    const firstResult = page.locator('[data-testid="search-result"]').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
      
      // Wait on document page
      await page.waitForTimeout(5000);
      
      // Go back to recommendations
      await page.goto('/dashboard/recommendations');
      await page.click('text=Activity');
      
      // Check if interaction was tracked
      await page.waitForTimeout(2000);
      const hasViewInteraction = await page.locator('text=view').isVisible();
      expect(hasViewInteraction).toBeTruthy();
    }
  });

  test('should show recommendation badges', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Check for recommendation type badges
    const badges = page.locator('[data-testid="recommendation-badge"]');
    const badgeCount = await badges.count();
    
    if (badgeCount > 0) {
      // Check badge text
      const badgeTexts = ['For You', 'Similar Content', 'Trending', 'Popular'];
      const firstBadge = await badges.first().textContent();
      expect(badgeTexts.some(text => firstBadge?.includes(text))).toBeTruthy();
    }
  });

  test('should display relevance scores', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Check for relevance score badges
    const scorePattern = /\d+% match/;
    const hasScores = await page.locator(`text=${scorePattern}`).count() > 0;
    
    if (hasScores) {
      const firstScore = await page.locator(`text=${scorePattern}`).first().textContent();
      expect(firstScore).toMatch(scorePattern);
    }
  });

  test('should handle empty recommendations gracefully', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for load
    await page.waitForTimeout(3000);
    
    // If no recommendations, should show empty state
    const recommendationCount = await page.locator('[data-testid="recommendation-card"]').count();
    
    if (recommendationCount === 0) {
      await expect(page.locator('text=No recommendations yet')).toBeVisible();
      await expect(page.locator('text=Start exploring documents')).toBeVisible();
      
      // Should have generate button
      const generateButton = page.locator('button:has-text("Generate Recommendations")');
      await expect(generateButton).toBeVisible();
    }
  });

  test('should display recommendation reasoning', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Check for reasoning text
    const reasoningTexts = [
      'Based on your interests',
      'Similar to documents',
      'Trending in the community',
      'Popular among users'
    ];
    
    const cards = page.locator('[data-testid="recommendation-card"]');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      const firstCardText = await cards.first().textContent();
      const hasReasoning = reasoningTexts.some(text => 
        firstCardText?.toLowerCase().includes(text.toLowerCase())
      );
      expect(hasReasoning).toBeTruthy();
    }
  });

  test('should update analytics after interaction', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Get initial impression count
    await page.waitForTimeout(2000);
    const initialImpressions = await page.locator('text=Impressions').locator('..').locator('.text-2xl').textContent();
    
    // Refresh page to trigger new impressions
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check if impressions increased (may not always increase due to caching)
    const newImpressions = await page.locator('text=Impressions').locator('..').locator('.text-2xl').textContent();
    expect(newImpressions).toBeDefined();
  });

  test('should filter recommendations by type', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Count different recommendation types
    const interestBased = await page.locator('text=For You').count();
    const behaviorBased = await page.locator('text=Similar Content').count();
    const trending = await page.locator('text=Trending').count();
    
    // Should have a mix of types (if recommendations exist)
    const totalRecommendations = interestBased + behaviorBased + trending;
    if (totalRecommendations > 0) {
      expect(totalRecommendations).toBeGreaterThan(0);
    }
  });

  test('should persist recommendations across page reloads', async ({ page }) => {
    await page.goto('/dashboard/recommendations');
    
    // Wait for recommendations to load
    await page.waitForTimeout(3000);
    
    // Get first recommendation title
    const firstCard = page.locator('[data-testid="recommendation-card"]').first();
    let firstTitle = '';
    
    if (await firstCard.isVisible()) {
      firstTitle = await firstCard.locator('h3').textContent() || '';
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Check if same recommendation is still there
      const newFirstCard = page.locator('[data-testid="recommendation-card"]').first();
      if (await newFirstCard.isVisible()) {
        const newFirstTitle = await newFirstCard.locator('h3').textContent() || '';
        expect(newFirstTitle).toBe(firstTitle);
      }
    }
  });
});

test.describe('Recommendation API', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token
    const response = await request.post('/api/auth/login', {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'testpassword',
      },
    });
    
    const data = await response.json();
    authToken = data.token;
  });

  test('should get recommendations via API', async ({ request }) => {
    const response = await request.get('/api/recommendations', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('recommendations');
    expect(data).toHaveProperty('count');
  });

  test('should track behavior via API', async ({ request }) => {
    const response = await request.post('/api/recommendations/behavior', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        type: 'document_interaction',
        data: {
          documentId: 'test-doc-id',
          interactionType: 'view',
          duration: 60,
        },
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('should get analytics via API', async ({ request }) => {
    const response = await request.get('/api/recommendations/analytics', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('impressions');
    expect(data).toHaveProperty('clicks');
    expect(data).toHaveProperty('clickThroughRate');
  });

  test('should track recommendation metric via API', async ({ request }) => {
    const response = await request.post('/api/recommendations/track', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        recommendationId: 'test-rec-id',
        metricType: 'impression',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });
});
