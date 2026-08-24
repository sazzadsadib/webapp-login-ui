export {
  DEFAULT_DISPOSABLE_DOMAINS,
  validateAndSanitizeEmail,
  type EmailValidationOptions,
  type EmailValidationResult,
} from './lib/emailValidator';
export type {
  AuthAdapter,
  AuthResult,
  AuthSession,
  AuthUser,
  OAuthProvider,
  PasswordAuthInput,
  SignUpInput,
} from './lib/authAdapter';
export { AuthAdapterError } from './lib/authAdapter';
