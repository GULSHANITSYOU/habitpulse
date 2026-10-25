import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
import type { SubscriptionPlan } from '../types/auth';

const DEFAULT_SUPABASE_URL = 'https://qumpqsbmvgcvfwzpgtvz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bXBxc2JtdmdjdmZ3enBndHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjczODcsImV4cCI6MjEwNzY0MzM4N30.Il_4Xniq4rjcTyQMNSG3FdqUHQLRhbd66vnl_rsZKcQ';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
};

// ==========================================
// Cloud Sync Helpers (For Premium Users)
// ==========================================

export interface CloudPayload {
  habits: Habit[];
  logs: HabitLog[];
  todos: TodoItem[];
  ideas?: IdeaItem[];
  focus_sessions?: FocusSession[];
  team_tasks?: TeamTask[];
  team_members?: TeamMember[];
  user: UserProfile;
  updatedAt: string;
}

/**
 * Uploads full state snapshot to Supabase for premium users
 */
export async function uploadToSupabaseCloud(
  userId: string,
  payload: Omit<CloudPayload, 'updatedAt'>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const dataToSave = {
      user_id: userId,
      habits: payload.habits,
      logs: payload.logs,
      todos: payload.todos,
      ideas: payload.ideas || [],
      focus_sessions: payload.focus_sessions || [],
      team_tasks: payload.team_tasks || [],
      team_members: payload.team_members || [],
      user_profile: payload.user,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('user_cloud_sync')
      .upsert(dataToSave, { onConflict: 'user_id' });

    if (error) {
      console.warn('Upsert to user_cloud_sync error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('uploadToSupabaseCloud exception:', err);
    return { success: false, error: err?.message || 'Unknown network error' };
  }
}

/**
 * Downloads full state snapshot from Supabase for premium users
 */
export async function downloadFromSupabaseCloud(
  userId: string
): Promise<{ success: boolean; data?: CloudPayload; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await client
      .from('user_cloud_sync')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: undefined };
    }

    const payload: CloudPayload = {
      habits: Array.isArray(data.habits) ? data.habits : [],
      logs: Array.isArray(data.logs) ? data.logs : [],
      todos: Array.isArray(data.todos) ? data.todos : [],
      ideas: Array.isArray(data.ideas) ? data.ideas : [],
      focus_sessions: Array.isArray(data.focus_sessions) ? data.focus_sessions : [],
      team_tasks: Array.isArray(data.team_tasks) ? data.team_tasks : [],
      team_members: Array.isArray(data.team_members) ? data.team_members : [],
      user: data.user_profile || {},
      updatedAt: data.updated_at || new Date().toISOString(),
    };

    return { success: true, data: payload };
  } catch (err: any) {
    console.error('downloadFromSupabaseCloud exception:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Updates subscription details in Supabase profiles table
 */
export async function saveSubscriptionToCloud(
  userId: string,
  plan: 'monthly' | 'yearly' | 'lifetime',
  profileMeta?: { email?: string; fullName?: string; avatarUrl?: string }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const isLifetime = plan === 'lifetime';
    const expiresAt = isLifetime
      ? undefined
      : plan === 'monthly'
      ? new Date(Date.now() + 30 * 86400000).toISOString()
      : new Date(Date.now() + 365 * 86400000).toISOString();

    await client
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: profileMeta?.email || null,
          full_name: profileMeta?.fullName || null,
          avatar_url: profileMeta?.avatarUrl || null,
          is_premium: true,
          subscription_plan: plan,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
  } catch (e) {
    console.warn('saveSubscriptionToCloud error', e);
  }
}

/**
 * Fetches subscription details for a user from Supabase
 */
export async function fetchSubscriptionFromCloud(
  userId: string
): Promise<{ isPremium: boolean; plan: SubscriptionPlan } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('is_premium, subscription_plan, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    // Check if subscription has expired (for monthly / yearly)
    if (data.subscription_plan === 'lifetime') {
      return { isPremium: true, plan: 'lifetime' };
    }

    if (data.is_premium && data.subscription_expires_at) {
      const isExpired = new Date(data.subscription_expires_at).getTime() < Date.now();
      if (isExpired) {
        return { isPremium: false, plan: 'free' };
      }
    }

    return {
      isPremium: Boolean(data.is_premium),
      plan: (data.subscription_plan as SubscriptionPlan) || 'free',
    };
  } catch (e) {
    console.warn('fetchSubscriptionFromCloud error', e);
    return null;
  }
}
