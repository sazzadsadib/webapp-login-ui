export { default as AuthCard } from './components/AuthCard';
export { default as SocialAuthRow } from './components/SocialAuthRow';
export { default as ForgotPasswordModal } from './components/ForgotPasswordModal';
export { default as UpdatePasswordForm } from './components/UpdatePasswordForm';
export type { AuthCardProps } from './components/AuthCard';
export type { ForgotPasswordModalProps } from './components/ForgotPasswordModal';
export type { OAuthProvider, SocialAuthRowProps } from './components/SocialAuthRow';
export type { UpdatePasswordFormProps } from './components/UpdatePasswordForm';
export {
  DEFAULT_DISPOSABLE_DOMAINS,
  validateAndSanitizeEmail,
  type EmailValidationOptions,
  type EmailValidationResult,
} from './lib/emailValidator';
export {
  AuthConfigurationError,
  createSecureAuthClient,
  getDefaultSupabaseClient,
  isDatabaseConnected,
  resolveSupabaseClient,
  validateSupabaseConfiguration,
  type SecureAuthClientOptions,
} from './lib/authClient';
export {
  createSupabaseAuthAdapter,
} from './lib/supabaseAdapter';
export type {
  AuthAdapter,
  AuthResult,
  AuthSession,
  AuthUser,
  PasswordAuthInput,
  SignUpInput,
} from './lib/authAdapter';
