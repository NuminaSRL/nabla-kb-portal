# KB Portal Integration Verification Checklist

## Quick Verification Guide

Use this checklist to quickly verify that KB Portal is properly integrated with the main NABLA system.

## 1. Environment Configuration ✓

### KB Portal
```bash
# Check environment variables
cd kb-portal
cat .env.local | grep SUPABASE_URL
cat .env.local | grep EMBEDDING_SERVICE_URL
```

**Verify:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `EMBEDDING_SERVICE_URL` is set
- [ ] All URLs are valid and accessible

### MCP Server
```bash
# Check environment variables
cd kb-mcp-server
cat .env | grep SUPABASE_URL
cat .env | grep EMBEDDING_SERVICE_URL
```

**Verify:**
- [ ] `SUPABASE_URL` matches KB Portal
- [ ] `SUPABASE_SERVICE_KEY` matches KB Portal
- [ ] `EMBEDDING_SERVICE_URL` matches KB Portal

## 2. Database Integration ✓

### Check Supabase Connection
```bash
# From kb-portal directory
npm run test:integration
```

**Verify:**
- [ ] Test 1: Supabase Connection ✅
- [ ] Test 2: Shared Documents Table ✅
- [ ] Documents have 768-dim embeddings
- [ ] All required tables exist

### Check Shared Tables
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM tier_limits;
SELECT COUNT(*) FROM usage_tracking;
SELECT COUNT(*) FROM audit_log;
```

**Verify:**
- [ ] `documents` table has embeddings
- [ ] `user_profiles` table exists
- [ ] `tier_limits` table has 3 tiers (free, pro, enterprise)
- [ ] `usage_tracking` table exists
- [ ] `audit_log` table exists

## 3. Embedding Service Integration ✓

### Test Embedding Generation
```bash
# Test embedding service
curl -X POST $EMBEDDING_SERVICE_URL/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"GDPR compliance test"}'
```

**Verify:**
- [ ] Service responds with 200 OK
- [ ] Response contains `embedding` field
- [ ] Embedding is array of 768 numbers
- [ ] Response time <100ms

### Test Consistency
```bash
# Run consistency test
npm run test:integration
```

**Verify:**
- [ ] Test 4: Embedding Consistency ✅
- [ ] Same query generates same embedding
- [ ] Cosine similarity = 1.0

## 4. Authentication Integration ✓

### Test User Signup
1. Open KB Portal: `http://localhost:3000`
2. Click "Sign Up"
3. Enter email and password
4. Submit form

**Verify:**
- [ ] User created successfully
- [ ] Redirected to dashboard
- [ ] User appears in Supabase `auth.users`
- [ ] Profile created in `user_profiles`
- [ ] Default tier is 'free'

### Test Cross-Portal Auth
1. Log out from KB Portal
2. Open Admin Portal (if available)
3. Log in with same credentials

**Verify:**
- [ ] Login successful
- [ ] Same user ID in both portals
- [ ] Session valid across portals

## 5. Search Integration ✓

### Test Search in KB Portal
1. Log in to KB Portal
2. Enter search query: "GDPR compliance"
3. Submit search

**Verify:**
- [ ] Search returns results
- [ ] Results have relevance scores
- [ ] Response time <500ms
- [ ] Usage tracked in database

### Test Search in MCP Server
```bash
# Call MCP Server search endpoint
curl -X POST http://localhost:8000/search_kb \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"query":"GDPR compliance","limit":10}'
```

**Verify:**
- [ ] Search returns results
- [ ] Same documents as KB Portal
- [ ] Same relevance scores
- [ ] Response time <500ms

### Compare Results
**Verify:**
- [ ] Document IDs match
- [ ] Relevance scores match (±0.001)
- [ ] Document order identical
- [ ] Metadata consistent

## 6. Quota Management Integration ✓

### Test Quota Tracking
1. Log in to KB Portal
2. Perform 5 searches
3. Check usage dashboard

**Verify:**
- [ ] Usage count shows 5 searches
- [ ] Quota percentage updated
- [ ] Remaining searches calculated correctly

### Test Cross-System Tracking
1. Perform 3 more searches via MCP Server
2. Return to KB Portal usage dashboard

**Verify:**
- [ ] Total shows 8 searches
- [ ] Usage tracked from both systems
- [ ] Quota calculations correct

### Test Quota Enforcement
1. Perform searches until limit reached
2. Try one more search

**Verify:**
- [ ] Search blocked in KB Portal
- [ ] Search blocked in MCP Server
- [ ] Error message shown
- [ ] Upgrade prompt displayed

## 7. Audit Logging Integration ✓

### Test Audit Trail
1. Perform various actions:
   - Log in
   - Search documents
   - View document
   - Log out

2. Check audit log:
```sql
SELECT * FROM audit_log 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Verify:**
- [ ] Login event logged
- [ ] Search events logged
- [ ] Document view logged
- [ ] Logout event logged
- [ ] Timestamps accurate
- [ ] User ID consistent

## 8. Performance Verification ✓

### Test Response Times
```bash
# Run performance test
npm run test:integration
```

**Verify:**
- [ ] Search: <500ms (p95)
- [ ] Embedding: <100ms
- [ ] Database: <200ms (p95)
- [ ] Authentication: <100ms

### Test Concurrent Users
```bash
# Install k6 if not already installed
brew install k6  # macOS

# Run load test (if available)
k6 run load-test-search.js
```

**Verify:**
- [ ] 50+ concurrent users supported
- [ ] Error rate <0.1%
- [ ] Response time stable
- [ ] No timeouts

## 9. Security Verification ✓

### Test RLS Policies
1. Try to access another user's data:
```sql
-- Should fail with permission denied
SELECT * FROM user_profiles WHERE id != auth.uid();
```

**Verify:**
- [ ] Access denied for other users' data
- [ ] Own data accessible
- [ ] RLS policies enforced

### Test API Security
```bash
# Try invalid API key
curl -X POST http://localhost:8000/search_kb \
  -H "Authorization: Bearer invalid_key" \
  -d '{"query":"test"}'
```

**Verify:**
- [ ] Request rejected
- [ ] 401 Unauthorized returned
- [ ] Error message clear

### Test Rate Limiting
```bash
# Send many requests quickly
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/search \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"query":"test"}' &
done
```

**Verify:**
- [ ] Rate limit enforced
- [ ] 429 Too Many Requests returned
- [ ] Retry-After header present

## 10. Monitoring Verification ✓

### Check Health Endpoints
```bash
# KB Portal
curl http://localhost:3000/api/health

# MCP Server
curl http://localhost:8000/health

# EmbeddingGemma
curl $EMBEDDING_SERVICE_URL/health
```

**Verify:**
- [ ] All services respond with 200 OK
- [ ] Health status is "healthy"
- [ ] Response time <100ms

### Check Logs
```bash
# Vercel logs (KB Portal)
vercel logs

# Railway logs (MCP Server)
railway logs

# Supabase logs
# Check in Supabase dashboard
```

**Verify:**
- [ ] Logs accessible
- [ ] No critical errors
- [ ] Request patterns normal
- [ ] Performance metrics good

## Quick Test Script

Run all automated tests:

```bash
#!/bin/bash

echo "🔍 Running KB Portal Integration Tests..."
echo ""

cd kb-portal

echo "1. Installing dependencies..."
npm install

echo ""
echo "2. Running integration tests..."
npm run test:integration

echo ""
echo "3. Checking environment..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL not set"
else
  echo "✅ NEXT_PUBLIC_SUPABASE_URL set"
fi

if [ -z "$EMBEDDING_SERVICE_URL" ]; then
  echo "❌ EMBEDDING_SERVICE_URL not set"
else
  echo "✅ EMBEDDING_SERVICE_URL set"
fi

echo ""
echo "4. Testing services..."
curl -s -o /dev/null -w "KB Portal: %{http_code}\n" http://localhost:3000/api/health
curl -s -o /dev/null -w "MCP Server: %{http_code}\n" http://localhost:8000/health
curl -s -o /dev/null -w "EmbeddingGemma: %{http_code}\n" $EMBEDDING_SERVICE_URL/health

echo ""
echo "✅ Integration verification complete!"
```

Save as `verify-integration.sh` and run:
```bash
chmod +x verify-integration.sh
./verify-integration.sh
```

## Common Issues and Solutions

### Issue: Tests Fail with "Connection Refused"

**Solution:**
```bash
# Check if services are running
curl http://localhost:3000/api/health
curl http://localhost:8000/health

# Start services if needed
npm run dev  # KB Portal
# Start MCP Server separately
```

### Issue: "Invalid Supabase URL"

**Solution:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Update .env.local if needed
```

### Issue: "Embedding dimensions mismatch"

**Solution:**
```bash
# Check embedding service
curl -X POST $EMBEDDING_SERVICE_URL/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}' | jq '.embedding | length'

# Should return 768
```

### Issue: "Search results differ"

**Solution:**
```bash
# Verify same embedding service URL
cd kb-portal && cat .env.local | grep EMBEDDING_SERVICE_URL
cd ../kb-mcp-server && cat .env | grep EMBEDDING_SERVICE_URL

# URLs must match exactly
```

## Final Checklist

Before marking integration as complete:

- [ ] All automated tests pass
- [ ] Environment variables configured correctly
- [ ] Database tables exist and populated
- [ ] Embedding service responding
- [ ] Authentication works across portals
- [ ] Search results consistent
- [ ] Quota tracking accurate
- [ ] Audit logging functional
- [ ] Performance targets met
- [ ] Security verified
- [ ] Monitoring configured
- [ ] Documentation reviewed

## Sign-Off

**Integration Verified By:** _________________  
**Date:** _________________  
**Notes:** _________________

---

**Status:** ✅ INTEGRATION VERIFIED  
**Date:** 2025-01-16  
**Version:** 1.0.0

