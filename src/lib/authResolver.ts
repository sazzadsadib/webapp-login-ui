import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthAdapter } from './authAdapter';
import { resolveSupabaseClient } from './authClient';
import { createSupabaseAuthAdapter } from './supabaseAdapter';

export function resolveAuthAdapter(adapter?: AuthAdapter, client?: SupabaseClient): AuthAdapter {
  return adapter ?? createSupabaseAuthAdapter(resolveSupabaseClient(client));
}
