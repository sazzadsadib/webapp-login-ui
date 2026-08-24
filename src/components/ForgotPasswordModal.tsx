'use client';
import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/authClient';
import { validateAndSanitizeEmail } from '../lib/emailValidator';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // 1. Strict RFC 5322 & Header Injection & Temp-mail check
    const validation = validateAndSanitizeEmail(email);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Invalid email address');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(validation.canonicalEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });
      if (error) throw error;
      setIsSent(true);
    } catch (err: any) {
      // Don't leak user existence (prevents user enumeration)
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-sky-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-sky-500/10 space-y-5 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0B2146]">Reset Instructions Sent</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                If an account matches <strong className="text-slate-700">{email}</strong>, we have sent a secure password reset link to that inbox.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-blue-600 flex items-center justify-center mb-2">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#0B2146] tracking-tight">Reset your password</h3>
              <p className="text-xs text-slate-500">
                Enter your verified email address and we will send you a recovery link.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0B2146]">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Send Recovery Link</span>
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
