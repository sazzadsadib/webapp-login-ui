'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import SocialAuthRow, { type OAuthProvider } from './SocialAuthRow';
import type { AuthAdapter, AuthSession, AuthUser } from '../lib/authAdapter';
import { AuthConfigurationError } from '../lib/authClient';
import { resolveAuthAdapter } from '../lib/authResolver';
import { validateAndSanitizeEmail, type EmailValidationOptions } from '../lib/emailValidator';

export interface AuthCardProps {
  client?: SupabaseClient;
  adapter?: AuthAdapter;
  title?: string;
  subtitle?: string;
  allowSignUp?: boolean;
  oauthProviders?: OAuthProvider[];
  oauthRedirectTo?: string;
  passwordResetRedirectTo?: string;
  emailValidation?: EmailValidationOptions;
  onSuccess?: (user: AuthUser, session: AuthSession) => void;
  onSignUpConfirmationRequired?: (user: AuthUser | null) => void;
}

function safeConfigurationMessage(error: unknown): string {
  if (error instanceof AuthConfigurationError) return error.message;
  return 'Authentication is not configured correctly. Contact the site owner.';
}

export default function AuthCard({
  client: providedClient,
  adapter: providedAdapter,
  title = 'Sign in with email',
  subtitle = 'Use your account to continue.',
  allowSignUp = true,
  oauthProviders = ['google', 'facebook', 'apple'],
  oauthRedirectTo,
  passwordResetRedirectTo,
  emailValidation,
  onSuccess,
  onSignUpConfirmationRequired,
}: AuthCardProps) {
  const fieldId = useId();
  const clientResult = useMemo(() => {
    try {
      return { adapter: resolveAuthAdapter(providedAdapter, providedClient), error: null };
    } catch (error) {
      return { adapter: null, error: safeConfigurationMessage(error) };
    }
  }, [providedAdapter, providedClient]);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(clientResult.error);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const lastNotifiedToken = useRef<string | null>(null);

  const notifyAuthenticated = useCallback((session: AuthSession) => {
    if (session.access_token && lastNotifiedToken.current === session.access_token) return;
    if (session.access_token) lastNotifiedToken.current = session.access_token;
    onSuccess?.(session.user, session);
  }, [onSuccess]);

  useEffect(() => {
    if (!clientResult.adapter?.subscribeToAuthStateChange) return;

    return clientResult.adapter.subscribeToAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) notifyAuthenticated(session);
    });
  }, [clientResult.adapter, notifyAuthenticated]);

  useEffect(() => {
    if (clientResult.error) setErrorMsg(clientResult.error);
  }, [clientResult.error]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!clientResult.adapter) {
      setErrorMsg(clientResult.error);
      return;
    }

    const validation = validateAndSanitizeEmail(email, emailValidation);
    if (!validation.isValid) {
      setErrorMsg(validation.error ?? 'Invalid email address.');
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setErrorMsg('Use at least 8 characters for your password.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const result = await clientResult.adapter.signInWithPassword({
          email: validation.canonicalEmail,
          password,
        });
        if (!result.session) throw new Error('No authenticated session was created.');
        setSuccessMsg('Signed in successfully.');
        setPassword('');
        notifyAuthenticated(result.session);
      } else {
        const result = await clientResult.adapter.signUp({
          email: validation.canonicalEmail,
          password,
          data: {
            full_name: fullName.trim(),
            original_input: validation.sanitizedEmail,
          },
        });
        setPassword('');

        if (result.session) {
          setSuccessMsg('Account created and signed in successfully.');
          notifyAuthenticated(result.session);
        } else {
          setSuccessMsg('Account created. Check your email to confirm the account before signing in.');
          onSignUpConfirmationRequired?.(result.user);
        }
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setPassword('');
    setErrorMsg(clientResult.error);
    setSuccessMsg(null);
  };

  return (
    <>
      <div className="wlu-card">
        <div className="wlu-icon-badge" aria-hidden="true">
          <LogIn className="wlu-icon" />
        </div>

        <div className="wlu-heading">
          <h2>{mode === 'signin' ? title : 'Create an account'}</h2>
          <p>{subtitle}</p>
        </div>

        {errorMsg && (
          <div className="wlu-notice wlu-notice-error" role="alert">
            <AlertCircle aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="wlu-notice wlu-notice-success" role="status" aria-live="polite">
            <CheckCircle2 aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="wlu-form">
          {mode === 'signup' && (
            <div className="wlu-field">
              <label htmlFor={`${fieldId}-full-name`}>Full name</label>
              <input
                id={`${fieldId}-full-name`}
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
          )}

          <div className="wlu-input-wrap">
            <Mail aria-hidden="true" />
            <label className="wlu-visually-hidden" htmlFor={`${fieldId}-email`}>Email</label>
            <input
              id={`${fieldId}-email`}
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="wlu-input-wrap">
            <Lock aria-hidden="true" />
            <label className="wlu-visually-hidden" htmlFor={`${fieldId}-password`}>Password</label>
            <input
              id={`${fieldId}-password`}
              type={showPassword ? 'text' : 'password'}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              maxLength={128}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="wlu-icon-button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>

          {mode === 'signin' && (
            <button type="button" className="wlu-link wlu-align-right" onClick={() => setIsForgotOpen(true)}>
              Forgot password?
            </button>
          )}

          <button type="submit" className="wlu-primary-button" disabled={isLoading || !clientResult.adapter}>
            {isLoading && <Loader2 className="wlu-spin" aria-hidden="true" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {oauthProviders.length > 0 && clientResult.adapter?.signInWithOAuth && (
          <>
            <div className="wlu-divider"><span>Or continue with</span></div>
            <SocialAuthRow
              adapter={clientResult.adapter}
              providers={oauthProviders}
              redirectTo={oauthRedirectTo}
              onError={setErrorMsg}
            />
          </>
        )}

        {allowSignUp && (
          <div className="wlu-mode-switch">
            {mode === 'signin' ? 'Don’t have an account? ' : 'Already have an account? '}
            <button type="button" className="wlu-link" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}
      </div>

      {clientResult.adapter && (
        <ForgotPasswordModal
          adapter={clientResult.adapter}
          isOpen={isForgotOpen}
          onClose={() => setIsForgotOpen(false)}
          redirectTo={passwordResetRedirectTo}
          emailValidation={emailValidation}
        />
      )}
    </>
  );
}
