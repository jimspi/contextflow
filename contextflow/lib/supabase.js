import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get the current user session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user
 */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign up with email and password
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Fetch all contexts for the current user
 */
export async function fetchContexts(userId) {
  const { data, error } = await supabase
    .from('contexts')
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false });

  return { data, error };
}

/**
 * Create a new context
 */
export async function createContext(userId, context) {
  const { data, error } = await supabase
    .from('contexts')
    .insert([
      {
        user_id: userId,
        type: context.type,
        title: context.title,
        summary: context.summary,
        connections: context.connections || [],
        priority: context.priority || 'medium',
        last_updated: new Date().toISOString(),
      }
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Update an existing context
 */
export async function updateContext(contextId, updates) {
  const { data, error } = await supabase
    .from('contexts')
    .update({
      ...updates,
      last_updated: new Date().toISOString(),
    })
    .eq('id', contextId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a context
 */
export async function deleteContext(contextId) {
  const { error } = await supabase
    .from('contexts')
    .delete()
    .eq('id', contextId);

  return { error };
}

/**
 * Search contexts by title or summary
 */
export async function searchContexts(userId, searchTerm) {
  const { data, error } = await supabase
    .from('contexts')
    .select('*')
    .eq('user_id', userId)
    .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`)
    .order('last_updated', { ascending: false });

  return { data, error };
}

/**
 * Fetch insights for a user
 */
export async function fetchInsights(userId) {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return { data, error };
}

/**
 * Create a new insight
 */
export async function createInsight(userId, insight) {
  const { data, error } = await supabase
    .from('insights')
    .insert([
      {
        user_id: userId,
        type: insight.type,
        title: insight.title,
        message: insight.message,
        actionable: insight.actionable || false,
        created_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();

  return { data, error };
}
