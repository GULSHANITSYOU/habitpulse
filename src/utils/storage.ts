import type { Habit, HabitLog, UserProfile } from '../types/habit';
import { formatDateKey } from './dateUtils';

export const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits_v1',
  LOGS: 'habitpulse_logs_v1',
  USER: 'habitpulse_user_v1',
  INITIALIZED: 'habitpulse_initialized_v1',
};

// Initial default user profile
export const defaultUserProfile: UserProfile = {
  name: 'Alex',
  xp: 340,
  level: 3,
  soundEnabled: true,
  darkMode: false,
  skipDeleteConfirm: false,
};

// Reset fresh user profile (restart from Level 1, 0 XP)
export const freshRestartUserProfile: UserProfile = {
  name: 'Alex',
  xp: 0,
  level: 1,
  soundEnabled: true,
  darkMode: false,
  skipDeleteConfirm: false,
};

// Generate seed habits and historical logs for realistic immediate experience
export function getInitialSeedData(): { habits: Habit[]; logs: HabitLog[]; user: UserProfile } {
  const habits: Habit[] = [
    {
      id: 'h-water',
      title: 'Hydrate (Drink Water)',
      description: 'Stay properly hydrated throughout the day for mental clarity and energy',
      category: 'health',
      color: '#06b6d4', // cyan
      icon: 'Droplets',
      frequencyType: 'daily',
      habitType: 'numeric',
      targetValue: 2500,
      unit: 'ml',
      timeOfDay: 'anytime',
      archived: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'h-meditate',
      title: 'Morning Mindfulness',
      description: '10 minutes of box breathing or calm guided meditation',
      category: 'mindfulness',
      color: '#8b5cf6', // purple
      icon: 'Sparkles',
      frequencyType: 'daily',
      habitType: 'boolean',
      targetValue: 1,
      timeOfDay: 'morning',
      archived: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'h-read',
      title: 'Read Non-Fiction Book',
      description: 'Expand your perspective and knowledge daily',
      category: 'learning',
      color: '#f59e0b', // amber
      icon: 'BookOpen',
      frequencyType: 'weekdays',
      habitType: 'numeric',
      targetValue: 20,
      unit: 'pages',
      timeOfDay: 'evening',
      archived: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'h-workout',
      title: 'Strength Training / Cardio',
      description: 'Push your physical limits and build endurance',
      category: 'fitness',
      color: '#ef4444', // red
      icon: 'Dumbbell',
      frequencyType: 'custom_days',
      customDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
      habitType: 'boolean',
      targetValue: 1,
      timeOfDay: 'afternoon',
      archived: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'h-deepwork',
      title: 'Deep Focus Sprint',
      description: '90 minutes of zero-distraction flow work on primary project',
      category: 'productivity',
      color: '#3b82f6', // blue
      icon: 'Flame',
      frequencyType: 'weekdays',
      habitType: 'numeric',
      targetValue: 90,
      unit: 'mins',
      timeOfDay: 'morning',
      archived: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'h-noscreen',
      title: 'Digital Sunset (No Screens)',
      description: 'Turn off screens 45 minutes before sleep to optimize melatonin',
      category: 'lifestyle',
      color: '#10b981', // emerald
      icon: 'Moon',
      frequencyType: 'daily',
      habitType: 'boolean',
      targetValue: 1,
      timeOfDay: 'evening',
      archived: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  // Seed logs for the past 21 days to provide rich streak & heatmap visuals
  const logs: HabitLog[] = [];
  const now = new Date();

  for (let i = 21; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    const isToday = i === 0;

    habits.forEach((habit) => {
      // Create natural realistic completions
      let completed = false;
      let value = 0;

      if (isToday) {
        // Some habits partially done today for interaction demo
        if (habit.id === 'h-water') {
          completed = false;
          value = 1750;
        } else if (habit.id === 'h-meditate') {
          completed = true;
          value = 1;
        } else if (habit.id === 'h-deepwork') {
          completed = true;
          value = 90;
        }
      } else {
        // High consistency on water & meditate (85%), moderate on others (75%)
        const chance = (habit.id === 'h-water' || habit.id === 'h-meditate') ? 0.9 : 0.75;
        if (Math.random() < chance) {
          completed = true;
          value = habit.targetValue;
        }
      }

      if (value > 0 || completed) {
        logs.push({
          id: `log-${habit.id}-${dateStr}`,
          habitId: habit.id,
          date: dateStr,
          completed,
          value,
          completedAt: completed ? new Date(d.getTime() + 14 * 3600000).toISOString() : undefined,
        });
      }
    });
  }

  return { habits, logs, user: defaultUserProfile };
}

// LocalStorage helpers
export function loadHabitsFromStorage(): Habit[] {
  try {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!data && !isInitialized) {
      const initial = getInitialSeedData();
      saveHabitsToStorage(initial.habits);
      saveLogsToStorage(initial.logs);
      saveUserToStorage(initial.user);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return initial.habits;
    }
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load habits from storage', err);
    return [];
  }
}

// Reset full system in localStorage: delete all habits, logs and restart at Level 1 (0 XP)
export function resetSystemStorage(preserveTheme = true): { habits: Habit[]; logs: HabitLog[]; user: UserProfile } {
  try {
    const currentUser = loadUserFromStorage();
    const resetUser: UserProfile = {
      ...freshRestartUserProfile,
      soundEnabled: currentUser.soundEnabled,
      darkMode: preserveTheme ? currentUser.darkMode : false,
    };
    saveHabitsToStorage([]);
    saveLogsToStorage([]);
    saveUserToStorage(resetUser);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return {
      habits: [],
      logs: [],
      user: resetUser,
    };
  } catch (err) {
    console.error('Failed to reset storage', err);
    return {
      habits: [],
      logs: [],
      user: freshRestartUserProfile,
    };
  }
}

export function saveHabitsToStorage(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to storage', err);
  }
}

export function loadLogsFromStorage(): HabitLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load logs from storage', err);
    return [];
  }
}

export function saveLogsToStorage(logs: HabitLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save logs to storage', err);
  }
}

export function loadUserFromStorage(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return defaultUserProfile;
    const parsed = JSON.parse(data);
    // Transition to bright theme
    if (!parsed.themeBrightV2) {
      const updated = { ...defaultUserProfile, ...parsed, darkMode: false, themeBrightV2: true };
      saveUserToStorage(updated);
      return updated;
    }
    return { ...defaultUserProfile, ...parsed };
  } catch (err) {
    console.error('Failed to load user from storage', err);
    return defaultUserProfile;
  }
}

export function saveUserToStorage(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user to storage', err);
  }
}

// Preset habit packs for one-click add
export const HABIT_TEMPLATES: { category: string; name: string; habits: Partial<Habit>[] }[] = [
  {
    category: 'Morning Routine Mastery',
    name: 'Rise & Conquer',
    habits: [
      { title: 'Drink 500ml Water First Thing', category: 'health', icon: 'Droplets', color: '#06b6d4', frequencyType: 'daily', habitType: 'numeric', targetValue: 500, unit: 'ml', timeOfDay: 'morning' },
      { title: 'Cold Shower / Wim Hof Breathing', category: 'health', icon: 'Sparkles', color: '#3b82f6', frequencyType: 'daily', habitType: 'boolean', targetValue: 1, timeOfDay: 'morning' },
      { title: 'Make Your Bed & Tidy Room', category: 'lifestyle', icon: 'CheckCircle', color: '#10b981', frequencyType: 'daily', habitType: 'boolean', targetValue: 1, timeOfDay: 'morning' },
    ],
  },
  {
    category: 'Peak Fitness & Health',
    name: 'Athlete Protocol',
    habits: [
      { title: '10,000 Daily Steps', category: 'fitness', icon: 'Footprints', color: '#10b981', frequencyType: 'daily', habitType: 'numeric', targetValue: 10000, unit: 'steps', timeOfDay: 'anytime' },
      { title: 'Eat Clean Protein Meal', category: 'health', icon: 'Salad', color: '#22c55e', frequencyType: 'daily', habitType: 'boolean', targetValue: 1, timeOfDay: 'afternoon' },
      { title: 'Post-Workout Mobility & Stretching', category: 'fitness', icon: 'Activity', color: '#f97316', frequencyType: 'daily', habitType: 'numeric', targetValue: 15, unit: 'mins', timeOfDay: 'evening' },
    ],
  },
  {
    category: 'Mental Sharpness & Growth',
    name: 'Intellectual Mindset',
    habits: [
      { title: 'Write in Gratitude & Progress Journal', category: 'mindfulness', icon: 'Edit3', color: '#a855f7', frequencyType: 'daily', habitType: 'boolean', targetValue: 1, timeOfDay: 'evening' },
      { title: 'Practice Coding / Language Skill', category: 'learning', icon: 'Code', color: '#6366f1', frequencyType: 'weekdays', habitType: 'numeric', targetValue: 45, unit: 'mins', timeOfDay: 'anytime' },
      { title: 'Review Daily Budget / Expenses', category: 'finance', icon: 'DollarSign', color: '#10b981', frequencyType: 'daily', habitType: 'boolean', targetValue: 1, timeOfDay: 'evening' },
    ],
  },
];
