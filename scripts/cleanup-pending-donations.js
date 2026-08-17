#!/usr/bin/env node

/**
 * Standalone script to clean up pending payment/donation records older than a month (30 days).
 * Suitable for running via GitHub Actions, crontab, or manual CLI execution.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCleanup() {
  const days = parseInt(process.env.CLEANUP_RETENTION_DAYS || '30', 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  console.log(`Starting cleanup of pending donations older than ${days} days (created before ${cutoffDate.toISOString()})...`);

  const { data, error } = await supabase
    .from('donations')
    .delete()
    .eq('status', 'pending')
    .lt('createdAt', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Failed to delete pending records:', error.message);
    process.exit(1);
  }

  const count = data ? data.length : 0;
  console.log(`Successfully deleted ${count} pending donation record(s).`);
}

runCleanup().catch(err => {
  console.error('Unexpected error during cleanup:', err);
  process.exit(1);
});
