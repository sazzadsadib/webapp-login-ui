'use client';
import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import SocialAuthRow from './SocialAuthRow';
import ForgotPasswordModal from './ForgotPasswordModal';
import { supabase, isDatabaseConnected } from '../lib/authClient';
import { validateAndSanitizeEmail } from '../lib/emailValidator';

export interface AuthCardProps {
  title?: string;
  subtitle?: string;
  onSuccess?: (user: any) => void;
}

export default function AuthCard({
  title = "Sign in with email",
  subtitle = "Make a new doc to bring your words, data, and teams together. For free",
  onSuccess
}: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Mandatory Email Validation & Gmail Canonicalization
    const validation = validateAndSanitizeEmail(email);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Invalid email address');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validation.canonicalEmail,
          password,
        });
        if (error) throw error;
        setSuccessMsg("Signed in successfully!");
        onSuccess?.(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: validation.canonicalEmail,
          password,
          options: {
            data: { full_name: fullName, original_input: validation.sanitizedEmail }
          }
        });
        if (error) throw error;
        setSuccessMsg("Account created successfully!");
        onSuccess?.(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-7 sm:p-9 shadow-2xl shadow-sky-500/10 space-y-6 text-center select-none relative">
        
        {/* Top Badge Icon (Pinterest Ebolt pill badge) */}
        <div className="flex justify-center -mt-2">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-xs">
            <LogIn className="h-5 w-5 ml-0.5" />
          </div>
        </div>

        {/* Header Typography */}
        <div className="space-y-1.5 px-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#0B2146] tracking-tight">
            {mode === 'signin' ? title : "Create an account"}
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2 text-left animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2 text-left animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs outline-none focus:border-slate-800 focus:bg-white text-slate-900 font-medium transition-all"
              />
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs outline-none focus:border-slate-800 focus:bg-white text-slate-900 font-medium transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs outline-none focus:border-slate-800 focus:bg-white text-slate-900 font-medium transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          {mode === 'signin' && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Primary Action Button (Sleek Dark Pill) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{mode === 'signin' ? "Get Started" : "Create Account"}</span>
          </button>
        </form>

        {/* Divider: Or sign in with */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-[11px] font-medium text-slate-400">Or sign in with</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        {/* 3-Button Social Auth Row (Google, Facebook, Apple) */}
        <SocialAuthRow 
          onSuccess={(provider) => setSuccessMsg(`Signed in with ${provider}!`)}
          onError={(err) => setErrorMsg(err)}
        />

        {/* Toggle Mode Link */}
        <div className="pt-2 text-center text-xs text-slate-400 font-medium">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                className="font-bold text-[#0B2146] hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(null); }}
                className="font-bold text-[#0B2146] hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

      </div>

      {/* Forgot Password Popup Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </>
  );
}
