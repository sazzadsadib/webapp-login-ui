'use client';

import React, { useId, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import type { AuthAdapter } from '../lib/authAdapter';
import { resolveAuthAdapter } from '../lib/authResolver';

export interface UpdatePasswordFormProps {
  client?: SupabaseClient;
  adapter?: AuthAdapter;
  minimumLength?: number;
  onSuccess?: () => void;
}

export default function UpdatePasswordForm({
  client: providedClient,
  adapter: providedAdapter,
  minimumLength = 8,
  onSuccess,
}: UpdatePasswordFormProps) {
  const fieldId = useId();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (password.length < minimumLength) {
      setErrorMsg(`Use at least ${minimumLength} characters for your password.`);
      return;
    }
    if (password !== confirmation) {
      setErrorMsg('The passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const adapter = resolveAuthAdapter(providedAdapter, providedClient);
      await adapter.updatePassword(password);

      setPassword('');
      setConfirmation('');
      setIsComplete(true);
      onSuccess?.();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Password update failed. Request a new recovery link.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="wlu-card wlu-update-password" role="status">
        <CheckCircle2 aria-hidden="true" />
        <h2>Password updated</h2>
        <p>You can now continue with your new password.</p>
      </div>
    );
  }

  return (
    <div className="wlu-card wlu-update-password">
      <div className="wlu-heading">
        <h2>Choose a new password</h2>
        <p>Use a unique password that you do not use on another service.</p>
      </div>

      {errorMsg && (
        <div className="wlu-notice wlu-notice-error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="wlu-form">
        <div className="wlu-input-wrap">
          <Lock aria-hidden="true" />
          <label className="wlu-visually-hidden" htmlFor={`${fieldId}-new-password`}>New password</label>
          <input
            id={`${fieldId}-new-password`}
            type={showPassword ? 'text' : 'password'}
            required
            minLength={minimumLength}
            maxLength={128}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="wlu-icon-button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>

        <div className="wlu-input-wrap">
          <Lock aria-hidden="true" />
          <label className="wlu-visually-hidden" htmlFor={`${fieldId}-confirm-password`}>Confirm new password</label>
          <input
            id={`${fieldId}-confirm-password`}
            type={showPassword ? 'text' : 'password'}
            required
            minLength={minimumLength}
            maxLength={128}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>

        <button type="submit" className="wlu-primary-button" disabled={isLoading}>
          {isLoading && <Loader2 className="wlu-spin" aria-hidden="true" />}
          Update password
        </button>
      </form>
    </div>
  );
}
