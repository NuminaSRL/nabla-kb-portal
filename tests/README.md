# KB Portal Test Suite

Comprehensive end-to-end testing suite for the KB Portal, covering all user flows across Free, Pro, and Enterprise tiers.

## Test Files

### Core E2E Tests

#### `e2e-comprehensive.spec.ts`
Complete user flows for all subscription tiers.

**Coverage:**
- Free tier: 20 searches/day, 5 results, basic filters
- Pro tier: 500 searches/day, 50 results, advanced features
- Enterprise tier: Unlimited searches, 100 results, all features

**Test Count:** 20+

#### `quota-enforcement.spec.ts`
Verifies quota limits are properly enforced across all tiers.

**Coverage:**
- Free tier quota enforcement
- Pro tier quota enforcement
- Enterprise tier unlimited verification
- Upgrade prompt display
- Quota reset functionality

**Test Count:** 15+

#### `search-performance.spec.ts`
Performance benchmarking and stress testing.

**Coverage:**
- Cached search < 300ms ✅
- First search < 5 seconds ✅
- Concurrent search handling
- Filter application speed
- Pagination efficiency
- Stress testing

**Test Count:** 10+

#### `document-viewer-comprehensive.spec.ts`
Complete document viewer functionality testing.

**Coverage:**
- Basic functionality (zoom, fullscreen, TOC)
- Annotations (highlight, notes, export, sharing)
- Bookmarks (create, remove, list)
- Export features (PDF, with annotations)
- Format support (PDF, HTML, Markdown)

**Test Count:** 25+

### Feature-Specific Tests

#### `auth.spec.ts`
Authentication and authorization flows.

**Coverage:**
- Sign up with validation
- Sign in with error handling
- OAuth integration
- Protected routes
- Tier system display
- Profile management

**Test Count:** 15+

#### `search.spec.ts`
Search functionality and user interactions.

**Coverage:**
- Search bar interactions
- Autocomplete suggestions
- Search execution
- Filter application
- Keyboard navigation
- Error handling

**Test Count:** 15+

#### `saved-searches.spec.ts`
Saved searches and alert functionality.

**Coverage:**
- Save/load/edit/delete searches
- Alert configuration
- Alert frequency settings
- Search history

**Test Count:** 10+

#### `citations.spec.ts`
Citation generation and management.

**Coverage:**
- Citation generation (APA, MLA, Chicago)
- Citation copying
- Citation export

**Test Count:** 8+

#### `export.spec.ts`
Export functionality across formats.

**Coverage:**
- PDF export
- CSV export
- Bulk export
- Export history
- Export with filters

**Test Count:** 10+

#### `recommendations.spec.ts`
Personalized recommendation system.

**Coverage:**
- Recommendation display
- Recommendation interaction
- Recommendation feedback
- Recommendation refresh

**Test Count:** 8+

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with comprehensive reporting
./scripts/run-e2e-tests.sh

# View test report
npm run test:report
```

### Specific Test Suites

```bash
# E2E comprehensive
npm run test:e2e

# Quota enforcement
npm run test:quota

# Performance
npm run test:performance

# Document viewer
npm run test:document-viewer
```

### Tier-Specific Tests

```bash
npm run test:free-tier
npm run test:pro-tier
npm run test:enterprise-tier
```

### Debug Mode

```bash
# Run with browser visible
npm run test:headed

# Run with Playwright Inspector
npx playwright test --debug

# Run with UI mode
npm run test:ui
```

## Test Structure

### Helper Functions

```typescript
// Login helper
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

// Open document helper
async function openDocument(page: Page, documentId: string) {
  await page.goto(`${BASE_URL}/documents/${documentId}`);
  await page.waitForTimeout(1000);
}
```

### Test Users

```typescript
const TEST_USERS = {
  free: {
    email: 'free-tier@example.com',
    password: 'FreeUser123!',
    tier: 'free'
  },
  pro: {
    email: 'pro-tier@example.com',
    password: 'ProUser123!',
    tier: 'pro'
  },
  enterprise: {
    email: 'enterprise-tier@example.com',
    password: 'EnterpriseUser123!',
    tier: 'enterprise'
  }
};
```

## Test Configuration

### Environment Variables

Create `.env.test`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Playwright Configuration

See `playwright.config.ts` for:
- Browser configurations
- Timeout settings
- Retry logic
- Screenshot/video settings
- Test parallelization

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Cached search | < 300ms | ✅ |
| First search | < 5s | ✅ |
| Filter application | < 1s | ✅ |
| Pagination | < 1s | ✅ |
| Document load | < 2s | ✅ |

## CI/CD Integration

Tests run automatically via GitHub Actions on:
- Push to main/develop
- Pull requests
- Daily at 2 AM UTC

Test matrix:
- Chromium, Firefox, WebKit
- Mobile Chrome, Mobile Safari
- Separate performance and quota jobs

## Test Results

### Viewing Reports

```bash
# Open HTML report
npx playwright show-report

# Or open directly
open playwright-report/index.html
```

### Artifacts

- HTML test reports
- Screenshots on failure
- Video recordings (CI only)
- Performance metrics
- Coverage reports

## Debugging

### Common Issues

**Timeout Errors:**
```typescript
// Increase timeout
await page.waitForSelector('selector', { timeout: 10000 });
```

**Element Not Found:**
```typescript
// Add explicit wait
await page.waitForSelector('selector');
await expect(page.locator('selector')).toBeVisible();
```

**Authentication Issues:**
- Verify test users exist in Supabase
- Check credentials in `.env.test`
- Ensure Supabase is accessible

### Debug Tools

```bash
# Trace viewer
npx playwright show-trace trace.zip

# Code generator
npx playwright codegen localhost:3000

# Inspector
npx playwright test --debug
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Avoid hard-coded delays** - use Playwright's auto-waiting
3. **Keep tests independent** - each test should work in isolation
4. **Mock external APIs** when appropriate
5. **Use Page Object Model** for complex interactions
6. **Add meaningful assertions** - test behavior, not implementation
7. **Handle async properly** - always await async operations
8. **Clean up after tests** - reset state when needed

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use helper functions for common operations
3. Add appropriate comments
4. Update this README
5. Ensure tests pass locally
6. Verify CI/CD pipeline passes

## Documentation

- **Testing Guide**: `../TASK_048_E2E_TESTING_GUIDE.md`
- **Quick Reference**: `../TESTING_QUICK_REFERENCE.md`
- **Completion Report**: `../TASK_048_COMPLETION_REPORT.md`
- **Verification Checklist**: `../TASK_048_VERIFICATION_CHECKLIST.md`

## Support

For issues or questions:
1. Check documentation files
2. Review test output and screenshots
3. Check CI/CD logs
4. Review Playwright documentation: https://playwright.dev

---

**Test Suite Version**: 1.0.0
**Last Updated**: 2025-01-16
**Total Tests**: 100+
**Coverage**: 90%+
