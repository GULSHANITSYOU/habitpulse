import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Cloud,
  HardDrive,
  ShieldCheck,
  Star,
  CreditCard,
  Crown,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { PREMIUM_PLANS, initiateRazorpayPayment } from '../lib/razorpay';
import type { PremiumPlanInfo } from '../types/auth';

export const PricingModal: React.FC = () => {
  const {
    isPricingModalOpen,
    closePricingModal,
    subscriptionPlan,
    isLifetime,
    upgradeSubscription,
    currentUser,
    openAuthModal,
  } = useAuth();

  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isPricingModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePricingModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPricingModalOpen, closePricingModal]);

  if (!isPricingModalOpen) return null;

  const handleSelectPlan = async (plan: PremiumPlanInfo) => {
    // If user already owns the lifetime plan, disallow changing plans
    if (isLifetime) return;

    // If not logged in, prompt to sign in via Clerk
    if (!currentUser) {
      closePricingModal();
      openAuthModal();
      return;
    }

    setErrorMessage(null);
    setLoadingPlanId(plan.id);

    await initiateRazorpayPayment({
      plan,
      userEmail: currentUser.email,
      userName: currentUser.fullName,
      onSuccess: async (paymentId) => {
        setLoadingPlanId(null);
        await upgradeSubscription(plan.id, paymentId);
        setSuccessMessage(`Congratulations! You're now on the ${plan.name} plan with live Cloud Sync!`);

        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }

        setTimeout(() => {
          setSuccessMessage(null);
          closePricingModal();
        }, 3000);
      },
      onError: (err) => {
        setLoadingPlanId(null);
        setErrorMessage(err);
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center animate-in fade-in duration-150"
      onClick={closePricingModal}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close Button */}
        <div className="flex items-start justify-between p-5 sm:p-7 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-black z-10">
          <div className="pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                HabitPulse Pro
              </span>
              <span className="text-xs font-semibold text-zinc-500">Multi-Device Cloud Sync</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-black dark:text-white tracking-tight mt-1.5">
              {isLifetime ? 'Lifetime VIP Membership Active' : 'Unlock Anywhere Access with Cloud Sync'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
              {isLifetime
                ? 'Your account is permanently upgraded to Lifetime Pro. You have full access to real-time Supabase cloud sync across all your devices with no recurring fees.'
                : 'Free users store data strictly in the browser. Upgrade with Razorpay to store your habits securely in the Supabase cloud and access them across all your phones, tablets, and computers.'}
            </p>
          </div>

          <button
            onClick={closePricingModal}
            className="p-2 -mr-1 -mt-1 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition shrink-0"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 pt-4 space-y-6">
          {/* Lifetime Banner: If user has Lifetime, show locked status and celebratory banner */}
          {isLifetime && (
            <div className="p-6 rounded-2xl bg-black text-white dark:bg-white dark:text-black border border-zinc-800 dark:border-zinc-200 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                    <span>Lifetime Access Unlocked</span>
                    <Sparkles className="w-4 h-4" />
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">
                    You have lifetime unlimited cloud sync and VIP features forever. No plan changes or subscription renewals are ever required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white text-xs font-bold text-black dark:text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 text-xs font-semibold text-black dark:text-white flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs underline font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Comparison Highlight Pill */}
          {!isLifetime && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black dark:text-white">Free Plan (Browser Storage)</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Data stays on this single browser only. Clearing cache loses routine history.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-1.5">
                    <span>Pro Plan (Supabase Cloud Sync)</span>
                    <Star className="w-3 h-3 fill-current" />
                  </h4>
                  <p className="text-[11px] opacity-80">
                    Encrypted database cloud backup. Syncs seamlessly across every device and laptop.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PREMIUM_PLANS.map((plan) => {
              const isCurrent = subscriptionPlan === plan.id;
              const isLoading = loadingPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all ${
                    plan.popular
                      ? 'bg-white dark:bg-black border-2 border-black dark:border-white shadow-xl scale-[1.01]'
                      : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 right-6">
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-sm">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-base text-black dark:text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 min-h-[32px]">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mt-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight">
                          {plan.priceLabel}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          /{plan.periodLabel}
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="mt-4 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-black dark:text-white mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button Section */}
                  <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    {isLifetime ? (
                      <div className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs font-bold text-center border border-zinc-200 dark:border-zinc-800">
                        {plan.id === 'lifetime' ? 'Your Active Lifetime Plan' : 'Included in Lifetime'}
                      </div>
                    ) : isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold text-center border border-zinc-200 dark:border-zinc-700">
                        Current Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isLoading}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs ${
                          plan.popular
                            ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-85'
                            : 'bg-zinc-100 hover:bg-black hover:text-white dark:bg-zinc-900 dark:hover:bg-white dark:hover:text-black text-black dark:text-white border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Processing...' : `Upgrade (${plan.priceLabel})`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer info & Razorpay guarantee */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
              <span>Secured by 256-bit encrypted Razorpay Checkout & Supabase Database.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
