import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useClerk } from '@clerk/react';
import {
  isSupabaseConfigured,
  uploadToSupabaseCloud,
  downloadFromSupabaseCloud,
  saveSubscriptionToCloud,
  fetchSubscriptionFromCloud,
  type CloudPayload,
} from '../lib/supabase';
import type { AuthUser, CloudSyncStatus, SubscriptionPlan } from '../types/auth';
import type {
  Habit,
  HabitLog,
  TodoItem,
  UserProfile,
  IdeaItem,
  FocusSession,
  TeamMember,
  TeamTask,
} from '../types/habit';

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  cloudSyncStatus: CloudSyncStatus;
  isPremium: boolean;
  isLifetime: boolean;
  subscriptionPlan: SubscriptionPlan;
  isSupabaseReady: boolean;

  // Modals
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isPricingModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;

  // Actions
  logout: () => Promise<void>;
  upgradeSubscription: (plan: 'monthly' | 'yearly' | 'lifetime', paymentId?: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  syncCurrentDataToCloud: (data: {
    habits: Habit[];
    logs: HabitLog[];
    todos: TodoItem[];
    ideas?: IdeaItem[];
    focus_sessions?: FocusSession[];
    team_tasks?: TeamTask[];
    team_members?: TeamMember[];
    user: UserProfile;
  }) => Promise<void>;
  loadCloudDataIntoApp: () => Promise<CloudPayload | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SUB_KEY = 'habitpulse_subscription_tier_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local_only');

  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const { openSignIn, signOut: clerkSignOut } = useClerk();

  // Subscription Plan: cached in localStorage for immediate offline responsiveness
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SUB_KEY);
      if (saved === 'monthly' || saved === 'yearly' || saved === 'lifetime') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'free';
  });

  const isPremium = subscriptionPlan !== 'free';
  const isLifetime = subscriptionPlan === 'lifetime';

  // Modal open states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const openAuthModal = useCallback(() => {
    try {
      openSignIn();
    } catch {
      setIsAuthModalOpen(true);
    }
  }, [openSignIn]);

  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);
  const openPricingModal = useCallback(() => setIsPricingModalOpen(true), []);
  const closePricingModal = useCallback(() => setIsPricingModalOpen(false), []);

  const isSupabaseReady = isSupabaseConfigured();

  // Synchronize Clerk user state into AuthContext & check Supabase profile for subscription
  useEffect(() => {
    if (!isClerkLoaded) return;

    let isMounted = true;

    if (isClerkSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const fullName = clerkUser.fullName || clerkUser.username || email.split('@')[0] || 'User';
      const avatarUrl = clerkUser.imageUrl;

      // Check cloud database for verified subscription
      fetchSubscriptionFromCloud(clerkUser.id).then((cloudSub) => {
        if (!isMounted) return;

        let activePlan = subscriptionPlan;
        if (cloudSub?.isPremium && cloudSub.plan) {
          activePlan = cloudSub.plan;
          setSubscriptionPlan(activePlan);
          try {
            localStorage.setItem(LOCAL_STORAGE_SUB_KEY, activePlan);
          } catch {
            // ignore
          }
        }

        const isUserPremium = activePlan !== 'free';

        setCurrentUser({
          id: clerkUser.id,
          email,
          fullName,
          avatarUrl,
          isPremium: isUserPremium,
          subscriptionPlan: activePlan,
        });

        setCloudSyncStatus(isUserPremium ? 'synced' : 'local_only');
        setIsLoading(false);
      });
    } else {
      setCurrentUser(null);
      setCloudSyncStatus('local_only');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isClerkLoaded, isClerkSignedIn, clerkUser, subscriptionPlan]);

  // Logout
  const logout = async () => {
    try {
      await clerkSignOut();
    } catch (e) {
      console.warn('Clerk signOut warning:', e);
    }
    setCurrentUser(null);
    setCloudSyncStatus('local_only');
  };

  // Upgrade Subscription to Premium
  const upgradeSubscription = async (
    plan: 'monthly' | 'yearly' | 'lifetime',
    _paymentId?: string
  ) => {
    setSubscriptionPlan(plan);
    try {
      localStorage.setItem(LOCAL_STORAGE_SUB_KEY, plan);
    } catch {
      // ignore
    }

    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, isPremium: true, subscriptionPlan: plan } : null));

      // Persist to Supabase
      await saveSubscriptionToCloud(currentUser.id, plan, {
        email: currentUser.email,
        fullName: currentUser.fullName,
        avatarUrl: currentUser.avatarUrl,
      });

      setCloudSyncStatus('synced');
    }
  };

  // Cancel / downgrade subscription (Not allowed if lifetime)
  const cancelSubscription = async () => {
    if (isLifetime) return; // Lifetime is permanent

    setSubscriptionPlan('free');
    try {
      localStorage.setItem(LOCAL_STORAGE_SUB_KEY, 'free');
    } catch {
      // ignore
    }
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, isPremium: false, subscriptionPlan: 'free' } : null));
    }
    setCloudSyncStatus('local_only');
  };

  // Debounce ref for background cloud upload
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync current data to cloud (For Pro users with active Clerk login)
  const syncCurrentDataToCloud = useCallback(
    async (data: {
      habits: Habit[];
      logs: HabitLog[];
      todos: TodoItem[];
      ideas?: IdeaItem[];
      focus_sessions?: FocusSession[];
      team_tasks?: TeamTask[];
      team_members?: TeamMember[];
      user: UserProfile;
    }) => {
      if (!isPremium || !currentUser) {
        setCloudSyncStatus('local_only');
        return;
      }

      setCloudSyncStatus('syncing');

      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(async () => {
        const result = await uploadToSupabaseCloud(currentUser.id, {
          habits: data.habits,
          logs: data.logs,
          todos: data.todos,
          ideas: data.ideas || [],
          focus_sessions: data.focus_sessions || [],
          team_tasks: data.team_tasks || [],
          team_members: data.team_members || [],
          user: {
            ...data.user,
            isPremium: true,
            subscriptionPlan,
          },
        });

        if (result.success) {
          setCloudSyncStatus('synced');
        } else {
          console.warn('Cloud sync error:', result.error);
          setCloudSyncStatus('error');
        }
      }, 800);
    },
    [isPremium, currentUser, subscriptionPlan]
  );

  // Load cloud data into app
  const loadCloudDataIntoApp = useCallback(async (): Promise<CloudPayload | null> => {
    if (!isPremium || !currentUser) {
      return null;
    }

    setCloudSyncStatus('syncing');
    const result = await downloadFromSupabaseCloud(currentUser.id);

    if (result.success && result.data) {
      setCloudSyncStatus('synced');
      return result.data;
    }

    setCloudSyncStatus(result.success ? 'synced' : 'error');
    return null;
  }, [isPremium, currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        cloudSyncStatus,
        isPremium,
        isLifetime,
        subscriptionPlan,
        isSupabaseReady,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isPricingModalOpen,
        openPricingModal,
        closePricingModal,
        logout,
        upgradeSubscription,
        cancelSubscription,
        syncCurrentDataToCloud,
        loadCloudDataIntoApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
