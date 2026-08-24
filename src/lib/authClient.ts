import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SecureAuthClientOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function decodeJwtRole(key: string): string | undefined {
  const payload = key.split('.')[1];
  if (!payload || typeof globalThis.atob !== 'function') return undefined;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(globalThis.atob(padded))?.role;
  } catch {
    return undefined;
  }
}

export function validateSupabaseConfiguration({
  supabaseUrl,
  supabaseAnonKey,
}: SecureAuthClientOptions): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AuthConfigurationError(
      'Supabase is not configured. Pass a Supabase client to AuthCard or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new AuthConfigurationError('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.');
  }

  if (parsedUrl.protocol !== 'https:' && !isLocalHostname(parsedUrl.hostname)) {
    throw new AuthConfigurationError('Supabase must use HTTPS outside local development.');
  }

  if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
    throw new AuthConfigurationError('Replace the placeholder Supabase configuration before using authentication.');
  }

  if (supabaseAnonKey.startsWith('sb_secret_') || decodeJwtRole(supabaseAnonKey) === 'service_role') {
    throw new AuthConfigurationError(
      'A Supabase secret/service-role key must never be used in browser code. Use an anon or publishable key.',
    );
  }
}

export function createSecureAuthClient(options: SecureAuthClientOptions): SupabaseClient {
  validateSupabaseConfiguration(options);

  return createClient(options.supabaseUrl, options.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

const defaultOptions: SecureAuthClientOptions = {
  supabaseUrl: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '' : '',
  supabaseAnonKey: typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' : '',
};

export const isDatabaseConnected = (() => {
  try {
    validateSupabaseConfiguration(defaultOptions);
    return true;
  } catch {
    return false;
  }
})();

let defaultClient: SupabaseClient | undefined;

export function getDefaultSupabaseClient(): SupabaseClient {
  if (!defaultClient) defaultClient = createSecureAuthClient(defaultOptions);
  return defaultClient;
}

export function resolveSupabaseClient(client?: SupabaseClient): SupabaseClient {
  return client ?? getDefaultSupabaseClient();
}
