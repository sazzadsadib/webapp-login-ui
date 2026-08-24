'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, Loader2, Mail, X } from 'lucide-react';
import type { AuthAdapter } from '../lib/authAdapter';
import { resolveAuthAdapter } from '../lib/authResolver';
import { validateAndSanitizeEmail, type EmailValidationOptions } from '../lib/emailValidator';

export interface ForgotPasswordModalProps {
  client?: SupabaseClient;
  adapter?: AuthAdapter;
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  emailValidation?: EmailValidationOptions;
}

export default function ForgotPasswordModal({
  client: providedClient,
  adapter: providedAdapter,
  isOpen,
  onClose,
  redirectTo,
  emailValidation,
}: ForgotPasswordModalProps) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const closeAndReset = useCallback(() => {
    setEmail('');
    setIsSent(false);
    setErrorMsg(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setIsSent(false);
      setErrorMsg(null);
      setIsLoading(false);
      return;
    }
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    emailInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAndReset();
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [closeAndReset, isOpen]);

  if (!isOpen) return null;

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    const validation = validateAndSanitizeEmail(email, emailValidation);
    if (!validation.isValid) {
      setErrorMsg(validation.error ?? 'Invalid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const adapter = resolveAuthAdapter(providedAdapter, providedClient);
      await adapter.requestPasswordReset(
        validation.canonicalEmail,
        redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined),
      );
    } catch {
      // Deliberately return the same result to prevent account enumeration.
    } finally {
      setIsSent(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="wlu-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeAndReset()}>
      <div ref={modalRef} className="wlu-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="wlu-modal-close" onClick={closeAndReset} aria-label="Close password reset dialog">
          <X aria-hidden="true" />
        </button>

        {isSent ? (
          <div className="wlu-modal-success" role="status" aria-live="polite">
            <CheckCircle2 aria-hidden="true" />
            <h3 id={titleId}>Check your email</h3>
            <p>If an account matches that address, a password-reset link has been sent.</p>
            <button type="button" className="wlu-primary-button" onClick={closeAndReset}>Back to sign in</button>
          </div>
        ) : (
          <>
            <div className="wlu-modal-heading">
              <Mail aria-hidden="true" />
              <h3 id={titleId}>Reset your password</h3>
              <p>Enter your account email and we will send a recovery link.</p>
            </div>

            <form onSubmit={handleReset} className="wlu-form">
              <div className="wlu-field">
                <label htmlFor="wlu-reset-email">Account email</label>
                <input
                  ref={emailInputRef}
                  id="wlu-reset-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="wlu-notice wlu-notice-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button type="submit" className="wlu-primary-button" disabled={isLoading}>
                {isLoading && <Loader2 className="wlu-spin" aria-hidden="true" />}
                Send recovery link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
