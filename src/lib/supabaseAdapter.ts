import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthAdapter, AuthResult, AuthSession, OAuthProvider, PasswordAuthInput, SignUpInput } from './authAdapter';

function toResult(user: AuthResult['user'], session: AuthResult['session']): AuthResult {
  return { user, session };
}

export function createSupabaseAuthAdapter(client: SupabaseClient): AuthAdapter {
  return {
    async signInWithPassword(input: PasswordAuthInput) {
      const { data, error } = await client.auth.signInWithPassword(input);
      if (error) throw error;
      return toResult(data.user, data.session as AuthSession | null);
    },
    async signUp(input: SignUpInput) {
      const { data, error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: input.data },
      });
      if (error) throw error;
      return toResult(data.user, data.session as AuthSession | null);
    },
    async signInWithOAuth(provider: OAuthProvider, redirectTo?: string) {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    },
    async requestPasswordReset(email: string, redirectTo?: string) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
    },
    async updatePassword(password: string) {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    },
    subscribeToAuthStateChange(listener) {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        listener(event, session as AuthSession | null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
