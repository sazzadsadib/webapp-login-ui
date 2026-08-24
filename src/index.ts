export { default as AuthCard } from './components/AuthCard';
export { default as SocialAuthRow } from './components/SocialAuthRow';
export { default as ForgotPasswordModal } from './components/ForgotPasswordModal';
export { validateAndSanitizeEmail } from './lib/emailValidator';
export { supabase, isDatabaseConnected } from './lib/authClient';
