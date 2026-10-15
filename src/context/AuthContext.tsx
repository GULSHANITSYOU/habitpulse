import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  uploadToSupabaseCloud,
  downloadFromSupabaseCloud,
  saveSubscriptionToCloud,
  type CloudPayload,
} from '../lib/supabase';
import type { AuthUser, CloudSyncStatus, SubscriptionPlan } from '../types/auth';
import type { Habit, HabitLog, TodoItem, UserProfile } from '../types/habit';

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  cloudSyncStatus: CloudSyncStatus;
  isPremium: boolean;
  subscriptionPlan: SubscriptionPlan;
  isSupabaseReady: boolean;
  
  // Modals
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isPricingModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
  isConfigModalOpen: boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;

  // Auth Actions
  loginWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;

  // Subscription & Cloud Sync Actions
  upgradeSubscription: (plan: 'monthly' | 'yearly' | 'lifetime', paymentId?: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  syncCurrentDataToCloud: (data: { habits: Habit[]; logs: HabitLog[]; todos: TodoItem[]; user: UserProfile }) => Promise<void>;
  loadCloudDataIntoApp: () => Promise<CloudPayload | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SUB_KEY = 'habitpulse_subscription_tier_v1';
const LOCAL_STORAGE_MOCK_USER_KEY = 'habitpulse_offline_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('local_only');

  // Subscription Plan: stored in localStorage for fast instantaneous offline access
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

  // Modal open states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openPricingModal = () => setIsPricingModalOpen(true);
  const closePricingModal = () => setIsPricingModalOpen(false);
  const openConfigModal = () => setIsConfigModalOpen(true);
  const closeConfigModal = () => setIsConfigModalOpen(false);

  const isSupabaseReady = isSupabaseConfigured();

  // Initialize Auth state from Supabase
  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // Check offline / mock user
      try {
        const savedOffline = localStorage.getItem(LOCAL_STORAGE_MOCK_USER_KEY);
        if (savedOffline) {
          const parsed = JSON.parse(savedOffline);
          setCurrentUser(parsed);
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
      setCloudSyncStatus(isPremium ? 'error' : 'local_only');
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatarUrl: session.user.user_metadata?.avatar_url,
          isPremium,
          subscriptionPlan,
        };
        setCurrentUser(authUser);
        if (isPremium) {
          setCloudSyncStatus('synced');
        }
      }
      setIsLoading(false);
    });

    // Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatarUrl: session.user.user_metadata?.avatar_url,
            isPremium,
            subscriptionPlan,
          };
          setCurrentUser(authUser);

          // Check if user has subscription in cloud profiles table
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_premium, subscription_plan')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile?.is_premium && profile.subscription_plan) {
              setSubscriptionPlan(profile.subscription_plan as SubscriptionPlan);
              localStorage.setItem(LOCAL_STORAGE_SUB_KEY, profile.subscription_plan);
            }
          } catch (e) {
            console.warn('Could not fetch cloud profile:', e);
          }

          if (isPremium) {
            setCloudSyncStatus('synced');
          }
        } else {
          setCurrentUser(null);
          setCloudSyncStatus('local_only');
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isPremium, subscriptionPlan]);

  // Login with Email & Password
  const loginWithEmail = async (email: string, pass: string): Promise<{ error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Offline fallback login simulation
      const mockUser: AuthUser = {
        id: `offline-${Date.now()}`,
        email,
        fullName: email.split('@')[0],
        isPremium,
        subscriptionPlan,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_MOCK_USER_KEY, JSON.stringify(mockUser));
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name,
          isPremium,
          subscriptionPlan,
        });
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to login' };
    }
  };

  // Sign up with Email & Password
  const signupWithEmail = async (email: string, pass: string, name?: string): Promise<{ error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const mockUser: AuthUser = {
        id: `offline-${Date.now()}`,
        email,
        fullName: name || email.split('@')[0],
        isPremium,
        subscriptionPlan,
      };
      setCurrentUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_MOCK_USER_KEY, JSON.stringify(mockUser));
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        if (!data.session) {
          return {
            error: 'Account registered! Please check your email inbox to confirm, or turn OFF "Confirm email" in Supabase (Auth -> Providers -> Email) to sign in instantly.',
          };
        }
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: name || data.user.email?.split('@')[0],
          isPremium,
          subscriptionPlan,
        });
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign up' };
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async (): Promise<{ error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        error: 'Supabase credentials are required for Google OAuth. Please configure your Project URL and Anon Key.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to initialize Google login' };
    }
  };

  // Logout
  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout warning', e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_MOCK_USER_KEY);
    setCurrentUser(null);
    setCloudSyncStatus('local_only');
  };

  // Upgrade Subscription to Premium
  const upgradeSubscription = async (
    plan: 'monthly' | 'yearly' | 'lifetime',
    _paymentId?: string
  ) => {
    setSubscriptionPlan(plan);
    localStorage.setItem(LOCAL_STORAGE_SUB_KEY, plan);

    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, isPremium: true, subscriptionPlan: plan } : null));

      // Persist to Supabase if configured
      await saveSubscriptionToCloud(currentUser.id, plan);
      setCloudSyncStatus('synced');
    }
  };

  // Cancel / downgrade subscription
  const cancelSubscription = async () => {
    setSubscriptionPlan('free');
    localStorage.setItem(LOCAL_STORAGE_SUB_KEY, 'free');
    if (currentUser) {
      setCurrentUser((prev) => (prev ? { ...prev, isPremium: false, subscriptionPlan: 'free' } : null));
    }
    setCloudSyncStatus('local_only');
  };

  // Debounce ref for cloud upload
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync current data to cloud (Only if user is Premium and logged in!)
  const syncCurrentDataToCloud = useCallback(
    async (data: { habits: Habit[]; logs: HabitLog[]; todos: TodoItem[]; user: UserProfile }) => {
      // Free users store data strictly in browser localStorage
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
        subscriptionPlan,
        isSupabaseReady,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isPricingModalOpen,
        openPricingModal,
        closePricingModal,
        isConfigModalOpen,
        openConfigModal,
        closeConfigModal,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
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
