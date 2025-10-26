# KB Portal Integration Deployment Checklist

## Pre-Deployment Checklist

### 1. Database Setup

- [ ] Supabase project created
- [ ] PostgreSQL 15+ with pgvector extension enabled
- [ ] All migrations applied in correct order:
  - [ ] `001_auth_tier_system.sql` (KB Portal)
  - [ ] `002_tier_system.sql` (MCP Server)
  - [ ] `003_search_system.sql` (KB Portal)
  - [ ] `004_advanced_filters.sql` (KB Portal)
  - [ ] `005_quota_management.sql` (KB Portal)
  - [ ] Additional feature migrations as needed
- [ ] Sample documents loaded (optional)
- [ ] Indexes created and optimized
- [ ] RLS policies enabled and tested
- [ ] Database backup configured

### 2. EmbeddingGemma Service

- [ ] Service deployed to Railway
- [ ] Environment variables configured
- [ ] Health endpoint responding
- [ ] Embedding generation tested (768-dim)
- [ ] Performance benchmarked (<100ms per embedding)
- [ ] Auto-scaling configured
- [ ] Monitoring enabled
- [ ] Logs accessible

### 3. KB MCP Server

- [ ] Service deployed to Railway
- [ ] Environment variables configured:
  - [ ] `SUPABASE_URL` (matches KB Portal)
  - [ ] `SUPABASE_SERVICE_KEY` (matches KB Portal)
  - [ ] `EMBEDDING_SERVICE_URL` (matches KB Portal)
  - [ ] `API_KEYS` configured
  - [ ] `CLAUDE_API_KEY` (for AI tiers)
- [ ] Health endpoint responding
- [ ] API endpoints tested
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Logs accessible

### 4. KB Portal

- [ ] Project deployed to Vercel
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (matches MCP Server)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (matches MCP Server)
  - [ ] `EMBEDDING_SERVICE_URL` (matches MCP Server)
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] Stripe keys (if using subscriptions)
- [ ] Custom domain configured (kb.nabla.ai)
- [ ] SSL certificate active
- [ ] Build successful
- [ ] Health checks passing
- [ ] Monitoring enabled

### 5. Admin Portal (if applicable)

- [ ] Project deployed to Vercel (separate project)
- [ ] Environment variables configured (same Supabase as KB Portal)
- [ ] Custom domain configured (admin.nabla.ai)
- [ ] SSL certificate active
- [ ] IP whitelisting configured
- [ ] 2FA enforced
- [ ] Build successful
- [ ] Health checks passing

## Integration Verification

### 1. Shared Database Access

- [ ] KB Portal can read from `documents` table
- [ ] MCP Server can read from `documents` table
- [ ] Admin Portal can write to `documents` table
- [ ] All systems see same document count
- [ ] Embeddings are 768-dimensional in all systems
- [ ] No data duplication detected

### 2. Authentication Integration

- [ ] User can sign up in KB Portal
- [ ] User profile created in `user_profiles` table
- [ ] User can log in to KB Portal
- [ ] User can log in to Admin Portal (if authorized)
- [ ] API key generated for MCP Server
- [ ] API key linked to correct user ID
- [ ] Session tokens valid across portals
- [ ] 2FA works across portals (if enabled)

### 3. Embedding Consistency

- [ ] Same query generates same embedding in KB Portal
- [ ] Same query generates same embedding in MCP Server
- [ ] Embedding dimensions are 768 in all systems
- [ ] Cosine similarity = 1.0 for identical queries
- [ ] Search results match across systems
- [ ] Relevance scores identical

### 4. Search Integration

- [ ] Search in KB Portal returns results
- [ ] Search in MCP Server returns same results
- [ ] Relevance scores match exactly
- [ ] Filters work consistently
- [ ] Performance similar (<100ms difference)
- [ ] Cache shared or invalidated correctly

### 5. Quota Management

- [ ] Usage tracked from KB Portal
- [ ] Usage tracked from MCP Server
- [ ] Total usage count accurate
- [ ] Quota limits enforced in KB Portal
- [ ] Quota limits enforced in MCP Server
- [ ] Quota resets at midnight UTC
- [ ] Upgrade reflects immediately in both systems

### 6. Audit Logging

- [ ] KB Portal actions logged
- [ ] MCP Server actions logged
- [ ] Admin Portal actions logged
- [ ] Timestamps accurate
- [ ] User IDs consistent
- [ ] Audit log accessible in Admin Portal

## Performance Verification

### 1. Response Times

- [ ] KB Portal search: <500ms (p95)
- [ ] MCP Server search: <500ms (p95)
- [ ] Embedding generation: <100ms per document
- [ ] Database queries: <200ms (p95)
- [ ] Authentication: <100ms
- [ ] Quota check: <50ms

### 2. Throughput

- [ ] KB Portal: 100 concurrent users
- [ ] MCP Server: 1000 requests/minute
- [ ] EmbeddingGemma: 10k embeddings/hour
- [ ] Database: 1000 queries/second
- [ ] No bottlenecks detected

### 3. Error Rates

- [ ] KB Portal: <0.1% error rate
- [ ] MCP Server: <0.1% error rate
- [ ] EmbeddingGemma: <0.1% error rate
- [ ] Database: <0.01% error rate
- [ ] No cascading failures

## Security Verification

### 1. Network Security

- [ ] All connections use TLS 1.3
- [ ] SSL certificates valid
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] DDoS protection enabled

### 2. Authentication Security

- [ ] Passwords hashed (bcrypt)
- [ ] JWT tokens signed correctly
- [ ] Session expiry enforced
- [ ] 2FA available
- [ ] OAuth providers configured
- [ ] API keys encrypted in database

### 3. Data Security

- [ ] RLS policies enforced
- [ ] User data isolated
- [ ] Sensitive data encrypted
- [ ] Audit log immutable
- [ ] Backups encrypted
- [ ] No data leakage detected

### 4. API Security

- [ ] API key validation working
- [ ] Rate limiting per key
- [ ] Invalid requests rejected
- [ ] SQL injection prevented
- [ ] XSS protection active
- [ ] CSRF protection enabled

## Monitoring Setup

### 1. Application Monitoring

- [ ] Vercel Analytics enabled (KB Portal)
- [ ] Railway Metrics enabled (MCP Server, EmbeddingGemma)
- [ ] Error tracking configured (Sentry/similar)
- [ ] Performance monitoring active
- [ ] Custom metrics tracked
- [ ] Dashboards created

### 2. Database Monitoring

- [ ] Supabase Dashboard accessible
- [ ] Query performance tracked
- [ ] Connection pool monitored
- [ ] Slow queries logged
- [ ] Disk usage tracked
- [ ] Backup status monitored

### 3. Alerting

- [ ] Critical alerts configured:
  - [ ] Service downtime
  - [ ] Database connection failures
  - [ ] High error rates (>1%)
  - [ ] Quota system failures
- [ ] Warning alerts configured:
  - [ ] High latency (>1s)
  - [ ] Elevated error rates (>0.5%)
  - [ ] Disk usage >80%
  - [ ] Memory usage >80%
- [ ] Alert channels configured:
  - [ ] Email notifications
  - [ ] Slack notifications
  - [ ] PagerDuty (if applicable)

## Documentation

- [ ] Integration architecture documented
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created
- [ ] User guides updated
- [ ] Admin guides updated
- [ ] Developer documentation updated

## Testing

### 1. Automated Tests

- [ ] Integration tests passing
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] Performance tests passing
- [ ] Security tests passing
- [ ] Load tests passing

### 2. Manual Tests

- [ ] User signup flow tested
- [ ] Login flow tested
- [ ] Search functionality tested
- [ ] Document access tested
- [ ] Quota management tested
- [ ] Admin workflows tested
- [ ] API endpoints tested
- [ ] Error handling tested

### 3. User Acceptance Testing

- [ ] Beta users invited
- [ ] Feedback collected
- [ ] Critical issues resolved
- [ ] User guides validated
- [ ] Training materials prepared
- [ ] Support team trained

## Rollback Plan

### 1. Rollback Triggers

- [ ] Error rate >5%
- [ ] Response time >5s (p95)
- [ ] Database corruption detected
- [ ] Security vulnerability discovered
- [ ] Critical bug affecting >10% users

### 2. Rollback Procedure

- [ ] Database rollback scripts prepared
- [ ] Previous deployment tagged in Git
- [ ] Vercel rollback tested
- [ ] Railway rollback tested
- [ ] Communication plan ready
- [ ] Rollback time estimated (<30 minutes)

### 3. Post-Rollback

- [ ] Incident report template ready
- [ ] Root cause analysis process defined
- [ ] Fix verification process defined
- [ ] Re-deployment checklist prepared

## Go-Live Checklist

### 1. Final Verification

- [ ] All pre-deployment checks passed
- [ ] All integration checks passed
- [ ] All performance checks passed
- [ ] All security checks passed
- [ ] All monitoring checks passed
- [ ] All documentation complete

### 2. Communication

- [ ] Stakeholders notified
- [ ] Users notified (if applicable)
- [ ] Support team briefed
- [ ] Marketing team briefed
- [ ] Social media posts scheduled
- [ ] Blog post published

### 3. Launch

- [ ] DNS updated (if needed)
- [ ] Traffic routing configured
- [ ] Monitoring dashboards open
- [ ] Support team on standby
- [ ] Incident response team ready
- [ ] Go-live time logged

### 4. Post-Launch

- [ ] Monitor for 1 hour
- [ ] Check error rates
- [ ] Check performance metrics
- [ ] Check user feedback
- [ ] Address any issues immediately
- [ ] Send launch confirmation

## Post-Deployment

### 1. First 24 Hours

- [ ] Monitor error rates continuously
- [ ] Check performance metrics hourly
- [ ] Review user feedback
- [ ] Address critical issues immediately
- [ ] Update documentation as needed
- [ ] Communicate status to stakeholders

### 2. First Week

- [ ] Daily performance reviews
- [ ] User feedback analysis
- [ ] Bug triage and fixes
- [ ] Documentation updates
- [ ] Training sessions (if needed)
- [ ] Weekly status report

### 3. First Month

- [ ] Weekly performance reviews
- [ ] Monthly usage analysis
- [ ] Feature requests prioritization
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Monthly status report

## Sign-Off

### Deployment Team

- [ ] Technical Lead: _________________ Date: _______
- [ ] DevOps Engineer: ________________ Date: _______
- [ ] QA Engineer: ___________________ Date: _______
- [ ] Security Engineer: ______________ Date: _______

### Stakeholders

- [ ] Product Manager: ________________ Date: _______
- [ ] Engineering Manager: ____________ Date: _______
- [ ] CTO: ___________________________ Date: _______

## Notes

Use this section to document any deviations from the checklist, known issues, or special considerations:

```
[Add notes here]
```

## Appendix

### A. Emergency Contacts

- **Technical Lead:** [Name] - [Email] - [Phone]
- **DevOps Engineer:** [Name] - [Email] - [Phone]
- **On-Call Engineer:** [Name] - [Email] - [Phone]
- **CTO:** [Name] - [Email] - [Phone]

### B. Service URLs

- **KB Portal:** https://kb.nabla.ai
- **Admin Portal:** https://admin.nabla.ai
- **MCP Server:** https://mcp.nabla.ai
- **EmbeddingGemma:** https://embedding.nabla.ai
- **Supabase:** https://[project].supabase.co

### C. Monitoring Dashboards

- **Vercel:** https://vercel.com/[org]/[project]
- **Railway:** https://railway.app/project/[id]
- **Supabase:** https://app.supabase.com/project/[id]
- **Custom Dashboard:** https://monitoring.nabla.ai

### D. Documentation Links

- **Integration Architecture:** [Link]
- **API Documentation:** [Link]
- **User Guide:** [Link]
- **Admin Guide:** [Link]
- **Troubleshooting:** [Link]

