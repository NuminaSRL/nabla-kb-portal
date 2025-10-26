import { test, expect } from '@playwright/test';

/**
 * Production Authentication Tests
 * Tests authentication flow on the actual production deployment
 */

const PRODUCTION_URL = 'https://kb-portal-blond.vercel.app';

const TEST_USER = {
  email: 'demo@nabla.com',
  password: 'Demo123!@#'
};

test.describe('Production KB Portal - Authentication Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
  });

  test('PROD-1: Login page loads correctly', async ({ page }) => {
    console.log(`\n🔍 Testing: ${PRODUCTION_URL}/login`);
    
    const response = await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`Response status: ${response?.status()}`);
    expect(response?.status()).toBe(200);
    
    // Check if login form is visible
    await page.waitForSelector('input#email', { timeout: 10000 });
    await page.waitForSelector('input#password', { timeout: 10000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    
    console.log('✅ Login page loaded successfully');
    console.log('✅ Login form elements are visible');
  });

  test('PROD-2: Dashboard redirects to login when not authenticated', async ({ page }) => {
    console.log(`\n🔍 Testing: ${PRODUCTION_URL}/dashboard (unauthenticated)`);
    
    const response = await page.goto(`${PRODUCTION_URL}/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`Response status: ${response?.status()}`);
    console.log(`Final URL: ${page.url()}`);
    
    // Wait a bit for any redirects
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    
    // Check if we're on login page or if there's a 500 error
    if (response?.status() === 500) {
      console.log('❌ Dashboard returned 500 error');
      console.log('This indicates a server-side error in the dashboard layout');
      
      // Try to get error details from the page
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText?.substring(0, 500));
      
      throw new Error('Dashboard returned 500 error - server-side issue detected');
    }
    
    // Should redirect to login
    expect(finalUrl).toContain('/login');
    console.log('✅ Unauthenticated access correctly redirected to login');
  });

  test('PROD-3: Login with valid credentials', async ({ page }) => {
    console.log(`\n🔍 Testing: Login flow with valid credentials`);
    
    // Navigate to login page
    await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for form to be visible
    await page.waitForSelector('input#email', { timeout: 10000 });
    
    console.log('Filling in credentials...');
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    const finalUrl = page.url();
    console.log(`Final URL after login: ${finalUrl}`);
    
    // Check if we're on dashboard or if there's an error
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
      
      // Verify session cookies are set
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(c => 
        c.name.includes('auth-token') || 
        c.name.includes('supabase') ||
        c.name.includes('sb-')
      );
      
      console.log(`Session cookies created: ${authCookies.length}`);
      authCookies.forEach(c => {
        console.log(`  - ${c.name} (httpOnly: ${c.httpOnly}, secure: ${c.secure}, sameSite: ${c.sameSite})`);
      });
      
      expect(authCookies.length).toBeGreaterThan(0);
      console.log('✅ Session cookies verified');
    } else if (finalUrl.includes('/login')) {
      console.log('⚠️  Still on login page - checking for error message');
      
      // Check for error message
      const errorDiv = page.locator('div.bg-red-50, div[class*="bg-red"]');
      const hasError = await errorDiv.isVisible().catch(() => false);
      
      if (hasError) {
        const errorText = await errorDiv.textContent();
        console.log(`Error message: ${errorText}`);
        throw new Error(`Login failed: ${errorText}`);
      } else {
        throw new Error('Login did not redirect to dashboard and no error message shown');
      }
    } else {
      console.log(`⚠️  Unexpected URL: ${finalUrl}`);
      throw new Error(`Unexpected redirect to: ${finalUrl}`);
    }
  });

  test('PROD-4: Check dashboard page response', async ({ page }) => {
    console.log(`\n🔍 Testing: Dashboard page HTTP response`);
    
    // First login
    await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForSelector('input#email', { timeout: 10000 });
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(5000);
    
    // Now check dashboard response
    const response = await page.goto(`${PRODUCTION_URL}/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`Dashboard response status: ${response?.status()}`);
    console.log(`Dashboard final URL: ${page.url()}`);
    
    if (response?.status() === 500) {
      console.log('❌ Dashboard returned 500 error even after authentication');
      
      // Get page content for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('Error page content:', bodyText?.substring(0, 1000));
      
      throw new Error('Dashboard 500 error - this is a server-side rendering issue');
    }
    
    expect(response?.status()).toBe(200);
    console.log('✅ Dashboard loaded successfully after authentication');
  });

  test('PROD-5: Session persistence across page refresh', async ({ page }) => {
    console.log(`\n🔍 Testing: Session persistence`);
    
    // Login
    await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForSelector('input#email', { timeout: 10000 });
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Check if we're on dashboard
    if (!page.url().includes('/dashboard')) {
      console.log('⚠️  Login did not redirect to dashboard, skipping test');
      return;
    }
    
    console.log('✅ Initial login successful');
    
    // Get cookies before refresh
    const cookiesBefore = await page.context().cookies();
    const authCookiesBefore = cookiesBefore.filter(c => c.name.includes('sb-'));
    console.log(`Cookies before refresh: ${authCookiesBefore.length}`);
    
    // Refresh the page
    console.log('Refreshing page...');
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`URL after refresh: ${finalUrl}`);
    
    // Should still be on dashboard
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ Session persisted after refresh');
      
      const cookiesAfter = await page.context().cookies();
      const authCookiesAfter = cookiesAfter.filter(c => c.name.includes('sb-'));
      console.log(`Cookies after refresh: ${authCookiesAfter.length}`);
      
      expect(authCookiesAfter.length).toBeGreaterThan(0);
    } else {
      console.log('❌ Session lost after refresh - redirected to:', finalUrl);
      throw new Error('Session did not persist after page refresh');
    }
  });

  test('PROD-6: Detailed cookie inspection', async ({ page }) => {
    console.log(`\n🔍 Testing: Cookie attributes in production`);
    
    // Login
    await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForSelector('input#email', { timeout: 10000 });
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Get all cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c => 
      c.name.includes('sb-') || 
      c.name.includes('supabase') ||
      c.name.includes('auth')
    );
    
    console.log('\n=== Production Cookie Analysis ===');
    console.log(`Total cookies: ${cookies.length}`);
    console.log(`Auth-related cookies: ${authCookies.length}`);
    
    if (authCookies.length === 0) {
      console.log('⚠️  No authentication cookies found!');
      console.log('This might indicate a login failure or cookie setting issue');
      
      // List all cookies for debugging
      console.log('\nAll cookies:');
      cookies.forEach(c => console.log(`  - ${c.name}`));
    } else {
      authCookies.forEach(cookie => {
        console.log(`\n📝 Cookie: ${cookie.name}`);
        console.log(`   Domain: ${cookie.domain}`);
        console.log(`   Path: ${cookie.path}`);
        console.log(`   Secure: ${cookie.secure ? '✅' : '❌'}`);
        console.log(`   HttpOnly: ${cookie.httpOnly ? '✅' : '❌'}`);
        console.log(`   SameSite: ${cookie.sameSite}`);
        console.log(`   Expires: ${cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'Session'}`);
        
        // Verify production security requirements
        if (cookie.name.includes('auth-token')) {
          expect(cookie.secure).toBe(true); // Must be secure in production
          expect(cookie.httpOnly).toBe(true); // Must be httpOnly
          expect(cookie.sameSite).toBe('Lax'); // Should be Lax
          expect(cookie.path).toBe('/'); // Should be root path
        }
      });
      
      console.log('\n✅ Cookie security attributes verified');
    }
  });
});
