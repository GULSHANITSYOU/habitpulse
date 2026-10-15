import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    isSupabaseReady,
    openConfigModal,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const res = await loginWithEmail(email.trim(), password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          closeAuthModal();
        }
      } else {
        const res = await signupWithEmail(email.trim(), password, fullName.trim() || undefined);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          closeAuthModal();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center animate-in fade-in duration-150"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Always visible */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-black z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-black dark:text-white tracking-tight">
                {mode === 'signin' ? 'Sign In to HabitPulse' : 'Create an Account'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {mode === 'signin'
                  ? 'Access your routines and account'
                  : 'Start tracking consistency with HabitPulse'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 -mr-1 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 pt-4 space-y-5">
          {/* Mode Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-700 text-xs text-black dark:text-white font-medium flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs underline font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white text-xs font-bold flex items-center justify-center gap-2.5 transition active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <p className="text-[10px] text-zinc-400 text-center -mt-2">
            💡 <strong>Email & Password</strong> sign-in below works immediately!
          </p>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            <span className="bg-white dark:bg-black px-3 text-[10px] uppercase font-bold text-zinc-400 absolute">
              or with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Alex Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <span>{mode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {!isSupabaseReady && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  openConfigModal();
                }}
                className="text-[11px] text-zinc-500 hover:text-black dark:hover:text-white underline"
              >
                Configure Supabase Connection Credentials
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Free users store data safely in browser storage.
              <br />
              Upgrade to <strong className="text-black dark:text-white">Pro</strong> for real-time cloud multi-device sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
