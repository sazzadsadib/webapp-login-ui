export { createSupabaseAuthAdapter } from './lib/supabaseAdapter';
export {
  AuthConfigurationError,
  createSecureAuthClient,
  getDefaultSupabaseClient,
  isDatabaseConnected,
  resolveSupabaseClient,
  validateSupabaseConfiguration,
  type SecureAuthClientOptions,
} from './lib/authClient';
