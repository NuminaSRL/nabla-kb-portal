# KB Portal Testing - Quick Reference

## Quick Start

```bash
# Run all tests with comprehensive reporting
./scripts/run-e2e-tests.sh

# Run all tests (simple)
npm test

# View test report
npm run test:report
```

## Common Test Commands

### Run Specific Test Suites

```bash
# E2E comprehensive tests (all tiers)
npm run test:e2e

# Quota enforcement tests
npm run test:quota

# Performance tests
npm run test:performance

# Document viewer tests
npm run test:document-viewer

# Saved searches tests
npm run test:saved-searches
```

### Run Tier-Specific Tests

```bash
# Free tier tests
npm run test:free-tier

# Pro tier tests
npm run test:pro-tier

# Enterprise tier tests
npm run test:enterprise-tier
```

### Debug Tests

```bash
# Run with browser visible
npm run test:headed

# Run with Playwright Inspector
npx playwright test --debug

# Run with UI mode
npm run test:ui

# Run specific test file
npx playwright test tests/search.spec.ts
```

## Test Files Overview

| File | Purpose | Test Count |
|------|---------|------------|
| `e2e-comprehensive.spec.ts` | Complete user flows for all tiers | 20+ |
| `quota-enforcement.spec.ts` | Quota limit verification | 15+ |
| `search-performance.spec.ts` | Performance benchmarking | 10+ |
| `document-viewer-comprehensive.spec.ts` | Document viewer features | 25+ |
| `auth.spec.ts` | Authentication & authorization | 15+ |
| `search.spec.ts` | Search functionality | 15+ |
| `saved-searches.spec.ts` | Saved searches & alerts | 10+ |
| `citations.spec.ts` | Citation generation | 8+ |
| `export.spec.ts` | Export features | 10+ |
| `recommendations.spec.ts` | Personalized recommendations | 8+ |

## Performance Targets

| Metric | Target | Test |
|--------|--------|------|
| Cached search | < 300ms | ✅ |
| First search | < 5s | ✅ |
| Filter application | < 1s | ✅ |
| Pagination | < 1s | ✅ |
| Document load | < 2s | ✅ |

## Tier Limitations

### Free Tier
- 20 searches per day
- 5 results per search
- Basic filters only
- No saved searches
- No export features

### Pro Tier
- 500 searches per day
- 50 results per search
- Advanced filters
- Saved searches
- Export to PDF/CSV
- Citations

### Enterprise Tier
- Unlimited searches
- 100 results per search
- All features
- Search alerts
- Bulk export
- API keys

## Test Environment Setup

1. Copy environment file:
```bash
cp .env.test .env.local
```

2. Update with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

3. Install dependencies:
```bash
npm install
npx playwright install
```

## CI/CD Pipeline

Tests run automatically on:
- Push to main/develop
- Pull requests
- Daily at 2 AM UTC

View results:
- GitHub Actions tab
- Artifacts section for reports

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  // 60 seconds
```

### Element Not Found
```bash
# Add explicit wait
await page.waitForSelector('selector', { timeout: 5000 })
```

### Authentication Issues
```bash
# Check test user credentials in .env.test
# Verify users exist in Supabase
```

### Performance Tests Fail
```bash
# Run on dedicated machine
# Close other applications
# Check network connectivity
```

## Useful Playwright Commands

```bash
# Generate test code
npx playwright codegen localhost:3000

# Show trace viewer
npx playwright show-trace trace.zip

# Update snapshots
npx playwright test --update-snapshots

# Run tests in parallel
npx playwright test --workers=4

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Data

### Test Users

```typescript
FREE_USER = {
  email: 'free-tier@example.com',
  password: 'FreeUser123!'
}

PRO_USER = {
  email: 'pro-tier@example.com',
  password: 'ProUser123!'
}

ENTERPRISE_USER = {
  email: 'enterprise-tier@example.com',
  password: 'EnterpriseUser123!'
}
```

## Documentation

- **Full Guide**: `TASK_048_E2E_TESTING_GUIDE.md`
- **Completion Report**: `TASK_048_COMPLETION_REPORT.md`
- **Verification Checklist**: `TASK_048_VERIFICATION_CHECKLIST.md`
- **Summary**: `TASK_048_SUMMARY.md`

## Support

For issues or questions:
1. Check documentation files
2. Review test output and screenshots
3. Check CI/CD logs
4. Review Playwright documentation

## Quick Checks

```bash
# Check test count
find tests -name "*.spec.ts" | wc -l

# Check if tests pass
npm test -- --reporter=list

# Check coverage
npm test -- --coverage

# Check for flaky tests
npm test -- --repeat-each=3
```

---

**Last Updated**: 2025-01-16
**Test Suite Version**: 1.0.0
**Playwright Version**: 1.40.0
