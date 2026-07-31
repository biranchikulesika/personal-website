/**
 * Save Build Log to Supabase
 * * Inserts generated log entry into PostgreSQL build_logs table
 * via Supabase service role
 */

import { createClient } from '@supabase/supabase-js';

async function saveBuildLog(logEntry) {
  // Initialize Supabase client with service role (full access)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check if an entry for today already exists with same title
  // (prevents duplicate inserts if workflow runs multiple times)
  const { data: existing, error: checkError } = await supabase
    .from('build_logs')
    .select('id')
    .eq('date', logEntry.date)
    .eq('title', logEntry.title)
    .limit(1);

  if (checkError) {
    console.error(`       ✗ Error checking existing entries:`, checkError.message);
    return null;
  }

  if (existing && existing.length > 0) {
    console.log(`       → Entry already exists in database. Skipping.`);
    return existing[0];
  }

  // Prepare database payload
  // Match your database column names (snake_case)
  const dbPayload = {
    title: logEntry.title,
    category: logEntry.category,
    short_summary: logEntry.short_summary,
    long_summary: logEntry.long_summary,
    description: logEntry.description,
    date: logEntry.date,
    source: logEntry.source || 'automated',
    ai_generated: logEntry.aiGenerated || false,
    generated_at: logEntry.generatedAt || new Date().toISOString(),
    generation_model: logEntry.generationModel || null,
    related_commits: logEntry.relatedCommits || [],
    related_repositories: logEntry.relatedRepositories || [],
    hidden: logEntry.hidden || false
  };

  // Insert into build_logs table
  const { data, error } = await supabase
    .from('build_logs')
    .insert([dbPayload])
    .select()
    .single();

  if (error) {
    console.error(`       ✗ Database insert error:`, error.message);
    if (error.details) console.error(`       Details:`, error.details);
    return null;
  }

  return data;
}

/**
 * Update an existing build log entry
 * (useful for manual overrides or corrections)
 */
async function updateBuildLog(id, updates) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const dbPayload = {};

  if (updates.title !== undefined) dbPayload.title = updates.title;
  if (updates.description !== undefined) dbPayload.description = updates.description;
  if (updates.hidden !== undefined) dbPayload.hidden = updates.hidden;
  if (updates.ai_generated !== undefined) dbPayload.ai_generated = updates.ai_generated;

  dbPayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('build_logs')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Failed to update build log:`, error.message);
    return null;
  }

  return data;
}

/**
 * Hide a build log entry (soft delete)
 */
async function hideBuildLog(id) {
  return updateBuildLog(id, { hidden: true });
}

/**
 * Delete a build log entry (hard delete)
 */
async function deleteBuildLog(id) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from('build_logs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Failed to delete build log:`, error.message);
    return false;
  }

  return true;
}

export {
  saveBuildLog,
  updateBuildLog,
  hideBuildLog,
  deleteBuildLog
};