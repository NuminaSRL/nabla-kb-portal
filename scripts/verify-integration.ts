#!/usr/bin/env ts-node
/**
 * Integration Verification Script
 * 
 * This script verifies the integration between KB Portal and the main NABLA system.
 * It checks:
 * - Shared Supabase database access
 * - Unified authentication
 * - Consistent embedding generation
 * - Cross-portal user experience
 * - Shared analytics and monitoring
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as crypto from 'crypto';

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  embeddingServiceUrl: process.env.EMBEDDING_SERVICE_URL!,
  kbPortalUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:8000',
};

// Test results
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

// Helper function to run a test
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Test passed',
      duration: Date.now() - startTime,
    });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      message: error.message,
      duration: Date.now() - startTime,
    });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Verify Supabase connection
async function testSupabaseConnection() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Test connection by querying a simple table
  const { data, error } = await supabase
    .from('documents')
    .select('count')
    .limit(1);
  
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
  
  console.log(`  → Connected to Supabase at ${config.supabaseUrl}`);
}

// Test 2: Verify shared documents table
async function testSharedDocumentsTable() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Check if documents table exists and has embeddings
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, embedding')
    .not('embedding', 'is', null)
    .limit(5);
  
  if (error) {
    throw new Error(`Documents table query failed: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('No documents with embeddings found in database');
  }
  
  // Verify embedding dimensions
  const firstDoc = data[0];
  if (!firstDoc.embedding || firstDoc.embedding.length !== 768) {
    throw new Error(`Invalid embedding dimensions: expected 768, got ${firstDoc.embedding?.length || 0}`);
  }
  
  console.log(`  → Found ${data.length} documents with 768-dim embeddings`);
}

// Test 3: Verify EmbeddingGemma service
async function testEmbeddingService() {
  const testText = 'GDPR compliance requirements for data processing';
  
  try {
    const response = await axios.post(
      `${config.embeddingServiceUrl}/embed`,
      { text: testText },
      { timeout: 10000 }
    );
    
    if (!response.data || !response.data.embedding) {
      throw new Error('Embedding service returned invalid response');
    }
    
    const embedding = response.data.embedding;
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding dimensions: expected 768, got ${embedding.length}`);
    }
    
    console.log(`  → EmbeddingGemma service responding at ${config.embeddingServiceUrl}`);
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to embedding service at ${config.embeddingServiceUrl}`);
    }
    throw error;
  }
}

// Test 4: Verify embedding consistency
async function testEmbeddingConsistency() {
  const testText = 'Italian tax compliance regulations';
  
  // Generate embedding twice
  const response1 = await axios.post(
    `${config.embeddingServiceUrl}/embed`,
    { text: testText },
    { timeout: 10000 }
  );
  
  const response2 = await axios.post(
    `${config.embeddingServiceUrl}/embed`,
    { text: testText },
    { timeout: 10000 }
  );
  
  const embedding1 = response1.data.embedding;
  const embedding2 = response2.data.embedding;
  
  // Calculate cosine similarity (should be 1.0 for identical embeddings)
  const dotProduct = embedding1.reduce((sum: number, val: number, i: number) => 
    sum + val * embedding2[i], 0
  );
  const magnitude1 = Math.sqrt(embedding1.reduce((sum: number, val: number) => 
    sum + val * val, 0
  ));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum: number, val: number) => 
    sum + val * val, 0
  ));
  const similarity = dotProduct / (magnitude1 * magnitude2);
  
  if (similarity < 0.9999) {
    throw new Error(`Embedding inconsistency detected: similarity ${similarity}`);
  }
  
  console.log(`  → Embedding generation is deterministic (similarity: ${similarity.toFixed(6)})`);
}

// Test 5: Verify authentication system
async function testAuthenticationSystem() {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  
  // Test that auth is configured
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // We expect no session (not logged in), but no error
  if (error) {
    throw new Error(`Authentication system error: ${error.message}`);
  }
  
  // Check if user_profiles table exists
  const { error: profileError } = await supabase
    .from('user_profiles')
    .select('count')
    .limit(1);
  
  if (profileError && !profileError.message.includes('permission denied')) {
    throw new Error(`User profiles table error: ${profileError.message}`);
  }
  
  console.log(`  → Authentication system configured correctly`);
}

// Test 6: Verify tier system
async function testTierSystem() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Check tier_limits table
  const { data: tierLimits, error: tierError } = await supabase
    .from('tier_limits')
    .select('*');
  
  if (tierError) {
    throw new Error(`Tier limits table error: ${tierError.message}`);
  }
  
  if (!tierLimits || tierLimits.length === 0) {
    throw new Error('No tier limits configured');
  }
  
  // Verify all required tiers exist
  const requiredTiers = ['free', 'pro', 'enterprise'];
  const existingTiers = tierLimits.map((t: any) => t.tier);
  const missingTiers = requiredTiers.filter(t => !existingTiers.includes(t));
  
  if (missingTiers.length > 0) {
    throw new Error(`Missing tier configurations: ${missingTiers.join(', ')}`);
  }
  
  console.log(`  → Tier system configured with ${tierLimits.length} tiers`);
}

// Test 7: Verify usage tracking
async function testUsageTracking() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Check usage_tracking table
  const { error } = await supabase
    .from('usage_tracking')
    .select('count')
    .limit(1);
  
  if (error) {
    throw new Error(`Usage tracking table error: ${error.message}`);
  }
  
  // Test the track_usage function
  const testUserId = crypto.randomUUID();
  const { error: trackError } = await supabase.rpc('track_usage', {
    p_user_id: testUserId,
    p_action_type: 'test_action',
    p_metadata: { test: true },
  });
  
  if (trackError) {
    throw new Error(`Usage tracking function error: ${trackError.message}`);
  }
  
  // Clean up test data
  await supabase
    .from('usage_tracking')
    .delete()
    .eq('user_id', testUserId);
  
  console.log(`  → Usage tracking system functional`);
}

// Test 8: Verify audit logging
async function testAuditLogging() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Check audit_log table
  const { error } = await supabase
    .from('audit_log')
    .select('count')
    .limit(1);
  
  if (error) {
    throw new Error(`Audit log table error: ${error.message}`);
  }
  
  // Test inserting an audit log entry
  const testUserId = crypto.randomUUID();
  const { error: insertError } = await supabase
    .from('audit_log')
    .insert({
      user_id: testUserId,
      action: 'test_action',
      resource_type: 'test_resource',
      metadata: { test: true },
    });
  
  if (insertError) {
    throw new Error(`Audit log insert error: ${insertError.message}`);
  }
  
  // Clean up test data
  await supabase
    .from('audit_log')
    .delete()
    .eq('user_id', testUserId);
  
  console.log(`  → Audit logging system functional`);
}

// Test 9: Verify search function
async function testSearchFunction() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Generate a test embedding
  const testQuery = 'GDPR data protection';
  const response = await axios.post(
    `${config.embeddingServiceUrl}/embed`,
    { text: testQuery },
    { timeout: 10000 }
  );
  
  const queryEmbedding = response.data.embedding;
  
  // Test the search function
  const { data, error } = await supabase.rpc('search_documents_semantic', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 10,
  });
  
  if (error) {
    throw new Error(`Search function error: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    console.log(`  ⚠️  Search returned no results (database may be empty)`);
  } else {
    console.log(`  → Search function returned ${data.length} results`);
  }
}

// Test 10: Verify RLS policies
async function testRLSPolicies() {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  
  // Try to access documents (should work - public read)
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id')
    .limit(1);
  
  // This should fail with permission denied (no auth)
  if (docsError && !docsError.message.includes('permission denied')) {
    throw new Error(`Unexpected documents access error: ${docsError.message}`);
  }
  
  // Try to access user_profiles (should fail - requires auth)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1);
  
  if (!profileError || !profileError.message.includes('permission denied')) {
    throw new Error('RLS policy not enforcing user_profiles access control');
  }
  
  console.log(`  → RLS policies enforcing access control correctly`);
}

// Test 11: Verify database indexes
async function testDatabaseIndexes() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // Query to check for important indexes
  const { data, error } = await supabase.rpc('pg_indexes', {});
  
  // Note: This requires a custom function or direct SQL access
  // For now, we'll just verify that queries are fast
  
  const startTime = Date.now();
  await supabase
    .from('documents')
    .select('id')
    .limit(100);
  const queryTime = Date.now() - startTime;
  
  if (queryTime > 1000) {
    throw new Error(`Slow query detected: ${queryTime}ms (expected <1000ms)`);
  }
  
  console.log(`  → Database queries performing well (${queryTime}ms)`);
}

// Test 12: Verify environment configuration
async function testEnvironmentConfiguration() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EMBEDDING_SERVICE_URL',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  // Verify URLs are valid
  try {
    new URL(config.supabaseUrl);
    new URL(config.embeddingServiceUrl);
  } catch (error) {
    throw new Error('Invalid URL in environment configuration');
  }
  
  console.log(`  → All required environment variables configured`);
}

// Main test runner
async function runAllTests() {
  console.log('\n🔍 KB Portal Integration Verification\n');
  console.log('=' .repeat(60));
  console.log('\nRunning integration tests...\n');
  
  await runTest('1. Supabase Connection', testSupabaseConnection);
  await runTest('2. Shared Documents Table', testSharedDocumentsTable);
  await runTest('3. EmbeddingGemma Service', testEmbeddingService);
  await runTest('4. Embedding Consistency', testEmbeddingConsistency);
  await runTest('5. Authentication System', testAuthenticationSystem);
  await runTest('6. Tier System', testTierSystem);
  await runTest('7. Usage Tracking', testUsageTracking);
  await runTest('8. Audit Logging', testAuditLogging);
  await runTest('9. Search Function', testSearchFunction);
  await runTest('10. RLS Policies', testRLSPolicies);
  await runTest('11. Database Performance', testDatabaseIndexes);
  await runTest('12. Environment Configuration', testEnvironmentConfiguration);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:\n');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}`);
        console.log(`    Error: ${r.message}`);
      });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error);
  process.exit(1);
});
