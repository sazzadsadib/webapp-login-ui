import { AuthAdapterError, type AuthAdapter, type AuthResult, type OAuthProvider } from './lib/authAdapter';

export interface RestAuthAdapterOptions {
  baseUrl: string;
  endpoints?: Partial<{
    signIn: string;
    signUp: string;
    passwordReset: string;
    updatePassword: string;
    oauth: string;
  }>;
  fetch?: typeof globalThis.fetch;
  credentials?: RequestCredentials;
  exposeServerErrors?: boolean;
}

type RestResponse = Partial<AuthResult> & { error?: string; redirectUrl?: string };

function normalizedBaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new AuthAdapterError('Custom authentication API baseUrl must be a valid URL.');
  }
  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !local) {
    throw new AuthAdapterError('Custom authentication APIs must use HTTPS outside local development.');
  }
  return parsed.toString().replace(/\/$/, '');
}

export function createRestAuthAdapter(options: RestAuthAdapterOptions): AuthAdapter {
  const baseUrl = normalizedBaseUrl(options.baseUrl);
  const endpoints = {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    passwordReset: '/auth/password-reset',
    updatePassword: '/auth/update-password',
    oauth: '/auth/oauth',
    ...options.endpoints,
  };
  const request = options.fetch ?? globalThis.fetch;
  if (!request) throw new AuthAdapterError('A fetch implementation is required for the REST authentication adapter.');

  const post = async (endpoint: string, body: Record<string, unknown>): Promise<RestResponse> => {
    const response = await request(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: options.credentials ?? 'include',
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({})) as RestResponse;
    if (!response.ok) {
      throw new AuthAdapterError(options.exposeServerErrors && data.error ? data.error : 'Authentication request failed.');
    }
    return data;
  };
  const requiredResult = (data: RestResponse): AuthResult => {
    if (!data.user || !data.session) {
      throw new AuthAdapterError('Custom authentication API must return both user and session after sign-in.');
    }
    return { user: data.user, session: data.session };
  };

  return {
    async signInWithPassword({ email, password }) {
      return requiredResult(await post(endpoints.signIn, { email, password }));
    },
    async signUp({ email, password, data }) {
      const result = await post(endpoints.signUp, { email, password, data });
      return { user: result.user ?? null, session: result.session ?? null };
    },
    async signInWithOAuth(provider: OAuthProvider, redirectTo?: string) {
      const result = await post(endpoints.oauth, { provider, redirectTo });
      if (!result.redirectUrl || typeof window === 'undefined') {
        throw new AuthAdapterError('Custom OAuth API must return redirectUrl in a browser context.');
      }
      window.location.assign(result.redirectUrl);
    },
    async requestPasswordReset(email: string, redirectTo?: string) {
      await post(endpoints.passwordReset, { email, redirectTo });
    },
    async updatePassword(password: string) {
      await post(endpoints.updatePassword, { password });
    },
  };
}
