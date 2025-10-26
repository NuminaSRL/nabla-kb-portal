#!/usr/bin/env ts-node

/**
 * Alert Scheduler Script
 * Runs on Railway to process saved search alerts
 * 
 * Usage:
 *   npm run scheduler
 * 
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - RESEND_API_KEY
 *   - EMAIL_FROM
 */

import { alertScheduler } from '../src/lib/saved-searches/alert-scheduler';

console.log('='.repeat(60));
console.log('NABLA KB Portal - Alert Scheduler');
console.log('='.repeat(60));
console.log('Starting alert scheduler...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Email From:', process.env.EMAIL_FROM || 'alerts@kb.nabla.ai');
console.log('='.repeat(60));

// Start the scheduler
alertScheduler.startScheduler();

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nShutting down alert scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down alert scheduler...');
  process.exit(0);
});

console.log('Alert scheduler is running. Press Ctrl+C to stop.');
