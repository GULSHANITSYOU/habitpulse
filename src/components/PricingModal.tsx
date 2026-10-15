import React, { useState } from 'react';
import {
  X,
  Check,
  Cloud,
  HardDrive,
  ShieldCheck,
  Star,
  CreditCard,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { PREMIUM_PLANS, initiateRazorpayPayment, getRazorpayKey } from '../lib/razorpay';
import type { PremiumPlanInfo } from '../types/auth';

export const PricingModal: React.FC = () => {
  const {
    isPricingModalOpen,
    closePricingModal,
    subscriptionPlan,
    upgradeSubscription,
    currentUser,
    openAuthModal,
    openConfigModal,
  } = useAuth();

  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isPricingModalOpen) return null;

  const handleSelectPlan = async (plan: PremiumPlanInfo) => {
    // If not logged in, prompt to sign in or create account first so cloud sync associates with their account
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

  const hasRazorpayKey = Boolean(getRazorpayKey());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 my-8 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                HabitPulse Pro
              </span>
              <span className="text-xs font-semibold text-zinc-500">Multi-Device Cloud Sync</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight mt-1.5">
              Unlock Anywhere Access with Cloud Sync
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
              Free users store data strictly in the browser. Upgrade with Razorpay to store your habits securely in the Supabase cloud and access them across all your phones, tablets, and computers.
            </p>
          </div>

          <button
            onClick={closePricingModal}
            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback messages */}
        {successMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white text-xs font-bold text-black dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 text-xs font-semibold text-black dark:text-white flex items-center justify-between gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
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

          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border-2 border-black dark:border-white flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-extrabold text-black dark:text-white">Pro Plan (Supabase Cloud Sync)</h4>
                <Star className="w-3 h-3 fill-black text-black dark:fill-white dark:text-white" />
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                Encrypted database cloud backup. Syncs seamlessly across every device and laptop.
              </p>
            </div>
          </div>
        </div>

        {/* Plans Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {PREMIUM_PLANS.map((plan) => {
            const isCurrent = subscriptionPlan === plan.id;
            const isLoading = loadingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? 'border-2 border-black dark:border-white bg-zinc-50/50 dark:bg-zinc-900/60 shadow-lg'
                    : 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-xs'
                }`}
              >
                {/* Badge if Popular or Lifetime */}
                {plan.badge && (
                  <div className="absolute -top-3 right-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-xs">
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

                {/* Upgrade Button */}
                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {isCurrent ? (
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
        <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
            <span>Secured by 256-bit encrypted Razorpay Checkout & Supabase Database.</span>
          </div>

          {!hasRazorpayKey && (
            <button
              onClick={() => {
                closePricingModal();
                openConfigModal();
              }}
              className="text-[11px] underline font-semibold text-zinc-400 hover:text-black dark:hover:text-white"
            >
              Configure Custom Razorpay Key ID
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
