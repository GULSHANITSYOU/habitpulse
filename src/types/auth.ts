export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  isPremium: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: string;
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'local_only' | 'error';

export interface PremiumPlanInfo {
  id: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  priceINR: number;
  priceLabel: string;
  periodLabel: string;
  popular?: boolean;
  badge?: string;
  description: string;
  features: string[];
}
