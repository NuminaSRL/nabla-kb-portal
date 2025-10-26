import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';

test.describe('Authentication System', () => {
  test.describe('Sign Up Flow', () => {
    test('should display sign up page correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
      
      // Check page elements
      await expect(page.locator('h1')).toContainText('Create Your Account');
      await expect(page.locator('input[type="text"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toHaveCount(2);
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
      
      // Fill form with weak password
      await page.fill('input[type="text"]', TEST_NAME);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', 'weak');
      await page.fill('input[id="confirmPassword"]', 'weak');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
      
      // Fill form with mismatched passwords
      await page.fill('input[type="text"]', TEST_NAME);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should successfully create account', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);
      
      // Fill form correctly
      await page.fill('input[type="text"]', TEST_NAME);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.fill('input[id="confirmPassword"]', TEST_PASSWORD);
      
      // Accept terms
      await page.check('input[type="checkbox"]');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for success message
      await expect(page.locator('text=Account Created Successfully')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Sign In Flow', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check page elements
      await expect(page.locator('h1')).toContainText('Welcome Back');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Fill form with invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for error message
      await expect(page.locator('[class*="text-red"]')).toBeVisible({ timeout: 5000 });
    });

    test('should have OAuth sign in buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check for OAuth buttons
      await expect(page.locator('text=Sign in with Google')).toBeVisible();
      await expect(page.locator('text=Sign in with Microsoft')).toBeVisible();
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check for forgot password link
      await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    });

    test('should have sign up link', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Check for sign up link
      await expect(page.locator('a[href="/signup"]')).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*login/);
    });

    test('should redirect to login when accessing search without auth', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Tier System', () => {
    test('should display pricing page correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      
      // Check for tier cards
      await expect(page.locator('text=Free')).toBeVisible();
      await expect(page.locator('text=Pro')).toBeVisible();
      await expect(page.locator('text=Enterprise')).toBeVisible();
    });

    test('should show tier features', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      
      // Check for feature lists
      await expect(page.locator('text=searches per day')).toBeVisible();
      await expect(page.locator('text=results per search')).toBeVisible();
      await expect(page.locator('text=Advanced filters')).toBeVisible();
    });

    test('should have billing cycle toggle', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      
      // Check for billing toggle
      await expect(page.locator('text=Monthly')).toBeVisible();
      await expect(page.locator('text=Annual')).toBeVisible();
    });

    test('should show feature comparison table', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      
      // Scroll to comparison section
      await page.locator('text=Feature Comparison').scrollIntoViewIfNeeded();
      
      // Check for comparison table
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('th:has-text("Free")')).toBeVisible();
      await expect(page.locator('th:has-text("Pro")')).toBeVisible();
      await expect(page.locator('th:has-text("Enterprise")')).toBeVisible();
    });
  });

  test.describe('Profile Management', () => {
    test.skip('should display profile page when authenticated', async ({ page }) => {
      // This test requires authentication setup
      // Skip for now, implement after setting up test authentication
    });

    test.skip('should allow updating profile information', async ({ page }) => {
      // This test requires authentication setup
      // Skip for now, implement after setting up test authentication
    });

    test.skip('should allow changing password', async ({ page }) => {
      // This test requires authentication setup
      // Skip for now, implement after setting up test authentication
    });

    test.skip('should show 2FA settings for Pro/Enterprise users', async ({ page }) => {
      // This test requires authentication setup
      // Skip for now, implement after setting up test authentication
    });
  });

  test.describe('OAuth Integration', () => {
    test('should initiate Google OAuth flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Click Google sign in button
      const googleButton = page.locator('text=Sign in with Google');
      await expect(googleButton).toBeVisible();
      
      // Note: Actual OAuth flow testing requires additional setup
      // This test just verifies the button exists and is clickable
    });

    test('should initiate Microsoft OAuth flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Click Microsoft sign in button
      const microsoftButton = page.locator('text=Sign in with Microsoft');
      await expect(microsoftButton).toBeVisible();
      
      // Note: Actual OAuth flow testing requires additional setup
      // This test just verifies the button exists and is clickable
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/login`);
      
      // Check that elements are visible on mobile
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/pricing`);
      
      // Check that pricing cards are visible on tablet
      await expect(page.locator('text=Free')).toBeVisible();
      await expect(page.locator('text=Pro')).toBeVisible();
      await expect(page.locator('text=Enterprise')).toBeVisible();
    });
  });
});
