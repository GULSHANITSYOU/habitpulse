import type { PremiumPlanInfo } from '../types/auth';

export const PREMIUM_PLANS: PremiumPlanInfo[] = [
  {
    id: 'monthly',
    name: 'Pro Monthly',
    priceINR: 99,
    priceLabel: '₹99',
    periodLabel: 'per month',
    description: 'Perfect for active consistency tracking with multi-device cloud sync.',
    features: [
      'Multi-device real-time Cloud Sync',
      'Access from any browser, laptop & mobile',
      'Encrypted Supabase cloud backup',
      'Unlimited habits & to-dos',
      'Priority Heatmap & Matrix analytics',
    ],
  },
  {
    id: 'yearly',
    name: 'Pro Annual',
    priceINR: 999,
    priceLabel: '₹999',
    periodLabel: 'per year',
    popular: true,
    badge: 'Save 16%',
    description: 'Our most popular plan for committed habit builders.',
    features: [
      'Everything in Monthly plan',
      '12 months of seamless Cloud Sync',
      'Multi-device access anywhere',
      'Save ₹189 compared to monthly',
      'Priority customer support',
    ],
  },
  {
    id: 'lifetime',
    name: 'Pro Lifetime',
    priceINR: 2999,
    priceLabel: '₹2,999',
    periodLabel: 'one-time payment',
    badge: 'Best Value',
    description: 'Pay once, keep multi-device cloud sync and pro features forever.',
    features: [
      'Lifetime Cloud Sync access forever',
      'Never pay a monthly or yearly fee again',
      'All future Pro features included',
      'Unlimited devices & browsers',
      'VIP Supporter status badge',
    ],
  },
];

const CONFIG_STORAGE_KEY_RAZORPAY = 'habitpulse_razorpay_key_id';

export function getRazorpayKey(): string {
  const customKey = localStorage.getItem(CONFIG_STORAGE_KEY_RAZORPAY);
  return (customKey || import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
}

export function saveCustomRazorpayKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(CONFIG_STORAGE_KEY_RAZORPAY, key.trim());
  } else {
    localStorage.removeItem(CONFIG_STORAGE_KEY_RAZORPAY);
  }
}

/**
 * Loads the Razorpay checkout script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay SDK from checkout.razorpay.com');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  plan: PremiumPlanInfo;
  userEmail?: string;
  userName?: string;
  onSuccess: (paymentId: string) => void;
  onError: (err: string) => void;
  onSimulate?: () => void;
}

/**
 * Triggers Razorpay modal or falls back to test simulation if no merchant key
 */
export async function initiateRazorpayPayment(options: RazorpayCheckoutOptions): Promise<void> {
  const { plan, userEmail, userName, onSuccess, onError } = options;
  const razorpayKey = getRazorpayKey();

  // If Razorpay Key is not set, simulate payment approval for testing / immediate demo
  if (!razorpayKey) {
    console.info('[Razorpay Simulation Mode] No VITE_RAZORPAY_KEY_ID configured. Activating test transaction.');
    const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    onSuccess(mockPaymentId);
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError('Could not load Razorpay payment gateway. Please check your network connection.');
    return;
  }

  try {
    const amountInPaise = plan.priceINR * 100;

    const razorpayOptions = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: 'INR',
      name: 'HabitPulse',
      description: `Upgrade to ${plan.name} (${plan.priceLabel})`,
      image: '/favicon.svg',
      prefill: {
        name: userName || 'HabitPulse User',
        email: userEmail || '',
      },
      theme: {
        color: '#000000',
      },
      handler: function (response: any) {
        if (response.razorpay_payment_id) {
          onSuccess(response.razorpay_payment_id);
        } else {
          onSuccess(`pay_${Date.now()}`);
        }
      },
      modal: {
        ondismiss: function () {
          onError('Payment checkout closed');
        },
      },
    };

    const rzp = new (window as any).Razorpay(razorpayOptions);
    rzp.open();
  } catch (err: any) {
    console.error('Razorpay invocation error:', err);
    onError(err?.message || 'Error opening Razorpay payment');
  }
}
