'use client';

import React, { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Apple, Loader2 } from 'lucide-react';
import type { AuthAdapter } from '../lib/authAdapter';
import { resolveAuthAdapter } from '../lib/authResolver';

export type OAuthProvider = 'google' | 'facebook' | 'apple' | 'github';

export interface SocialAuthRowProps {
  client?: SupabaseClient;
  adapter?: AuthAdapter;
  providers?: OAuthProvider[];
  redirectTo?: string;
  onRedirectStarted?: (provider: OAuthProvider) => void;
  onError?: (error: string) => void;
}

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'apple') return <Apple aria-hidden="true" />;
  if (provider === 'facebook') {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.39H7.08v-3.54h3.05V9.43c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.96h-1.52c-1.49 0-1.96.93-1.96 1.88v2.25h3.33l-.53 3.54h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" /></svg>;
  }
  if (provider === 'github') {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.24 3.22c0 4.6-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" /></svg>;
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="currentColor" d="M21.35 12.18c0-.64-.06-1.25-.16-1.84H12v3.48h5.26a4.5 4.5 0 0 1-1.95 2.95v2.26h3.17c1.85-1.71 2.87-4.22 2.87-6.85Z" />
      <path fill="currentColor" d="M12 21.72c2.64 0 4.86-.87 6.48-2.69l-3.17-2.26c-.88.59-2 .94-3.31.94-2.55 0-4.71-1.72-5.48-4.03H3.24V16A9.78 9.78 0 0 0 12 21.72Z" opacity=".8" />
      <path fill="currentColor" d="M6.52 13.68A5.9 5.9 0 0 1 6.2 12c0-.58.11-1.15.32-1.68V8H3.24A9.78 9.78 0 0 0 2.28 12c0 1.45.35 2.81.96 4l3.28-2.32Z" opacity=".55" />
      <path fill="currentColor" d="M12 6.29c1.44 0 2.73.49 3.75 1.46l2.8-2.81A9.38 9.38 0 0 0 12 2.28 9.78 9.78 0 0 0 3.24 8l3.28 2.32A5.85 5.85 0 0 1 12 6.29Z" opacity=".7" />
    </svg>
  );
}

export default function SocialAuthRow({
  client: providedClient,
  adapter: providedAdapter,
  providers = ['google', 'facebook', 'apple'],
  redirectTo,
  onRedirectStarted,
  onError,
}: SocialAuthRowProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    try {
      const adapter = resolveAuthAdapter(providedAdapter, providedClient);
      if (!adapter.signInWithOAuth) throw new Error('OAuth is not configured for this authentication adapter.');
      await adapter.signInWithOAuth(
        provider,
        redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined),
      );
      onRedirectStarted?.(provider);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : `Failed to continue with ${provider}.`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="wlu-social-row">
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleOAuth(provider)}
          disabled={loadingProvider !== null}
          aria-label={`Continue with ${provider}`}
          title={`Continue with ${provider}`}
        >
          {loadingProvider === provider ? <Loader2 className="wlu-spin" aria-hidden="true" /> : <ProviderIcon provider={provider} />}
        </button>
      ))}
    </div>
  );
}
