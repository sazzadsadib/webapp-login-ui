export type OAuthProvider = 'google' | 'facebook' | 'apple' | 'github';

export interface AuthUser {
  id: string;
  email?: string | null;
}

export interface AuthSession {
  access_token?: string;
  user: AuthUser;
}

export interface PasswordAuthInput {
  email: string;
  password: string;
}

export interface SignUpInput extends PasswordAuthInput {
  data?: Record<string, unknown>;
}

export interface AuthResult {
  user: AuthUser | null;
  session: AuthSession | null;
}

export interface AuthAdapter {
  signInWithPassword(input: PasswordAuthInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  signInWithOAuth?(provider: OAuthProvider, redirectTo?: string): Promise<void>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  subscribeToAuthStateChange?(listener: (event: string, session: AuthSession | null) => void): () => void;
}

export class AuthAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthAdapterError';
  }
}
