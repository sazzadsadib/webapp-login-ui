import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isConnected = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project") && 
  !supabaseAnonKey.includes("your-anon-key")
);

export const isDatabaseConnected = isConnected;

// If disconnected, creates a safe mock client that warns gently in console
export const supabase = isConnected
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  : ({
      auth: {
        signInWithPassword: async ({ email, password }: any) => {
          console.warn("[secure-auth-kit] Database disconnected. Simulating successful demo login.");
          return { data: { user: { id: "demo-user-123", email } }, error: null };
        },
        signUp: async ({ email, password }: any) => {
          console.warn("[secure-auth-kit] Database disconnected. Simulating successful demo signup.");
          return { data: { user: { id: "demo-user-123", email } }, error: null };
        },
        signInWithOAuth: async ({ provider }: any) => {
          console.warn(`[secure-auth-kit] Database disconnected. Simulating OAuth popup for ${provider}.`);
          alert(`[Demo Mode] Database is disconnected. In production, this opens ${provider} OAuth. Run 'npx secure-auth-kit init' to connect your Supabase project.`);
          return { data: null, error: null };
        },
        resetPasswordForEmail: async (email: string) => {
          console.warn("[secure-auth-kit] Database disconnected. Simulating reset link sent.");
          return { data: {}, error: null };
        },
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    } as any);
