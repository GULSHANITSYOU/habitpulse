import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');

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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center animate-in fade-in duration-150"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
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
                  ? 'Access your rituals and account'
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

        {/* Clerk Auth Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 flex flex-col items-center justify-center">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-bold mb-4">
            <button
              type="button"
              onClick={() => setMode('signin')}
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
              onClick={() => setMode('signup')}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="w-full flex justify-center">
            {mode === 'signin' ? (
              <SignIn routing="hash" />
            ) : (
              <SignUp routing="hash" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
