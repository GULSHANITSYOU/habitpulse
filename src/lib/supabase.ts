import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Habit, HabitLog, TodoItem, UserProfile } from '../types/habit';

// Default / fallback keys from Vite environment
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const CONFIG_STORAGE_KEY_URL = 'habitpulse_supabase_url';
const CONFIG_STORAGE_KEY_KEY = 'habitpulse_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const customUrl = localStorage.getItem(CONFIG_STORAGE_KEY_URL);
  const customKey = localStorage.getItem(CONFIG_STORAGE_KEY_KEY);

  const url = customUrl || ENV_SUPABASE_URL;
  const anonKey = customKey || ENV_SUPABASE_ANON_KEY;

  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  if (url.trim()) {
    localStorage.setItem(CONFIG_STORAGE_KEY_URL, url.trim());
  } else {
    localStorage.removeItem(CONFIG_STORAGE_KEY_URL);
  }

  if (anonKey.trim()) {
    localStorage.setItem(CONFIG_STORAGE_KEY_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(CONFIG_STORAGE_KEY_KEY);
  }
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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
      user_profile: payload.user,
      updated_at: new Date().toISOString(),
    };

    // Upsert into user_cloud_sync table
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
 * Updates subscription details in Supabase profiles & sync tables
 */
export async function saveSubscriptionToCloud(
  userId: string,
  plan: 'monthly' | 'yearly' | 'lifetime'
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
