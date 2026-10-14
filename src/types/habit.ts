export type HabitCategory = 
  | 'health' 
  | 'fitness' 
  | 'productivity' 
  | 'mindfulness' 
  | 'learning' 
  | 'finance' 
  | 'lifestyle';

export type HabitFrequencyType = 
  | 'daily' 
  | 'weekdays' 
  | 'weekends' 
  | 'custom_days' 
  | 'times_per_week';

export type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';

export type HabitType = 'boolean' | 'numeric';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  color: string; // e.g. '#6366f1' or hex color
  icon: string;  // lucide icon identifier
  frequencyType: HabitFrequencyType;
  customDays?: number[]; // 0: Sun, 1: Mon, ... 6: Sat
  timesPerWeekTarget?: number;
  habitType: HabitType;
  targetValue: number; // e.g., 1 for boolean or 2000 for ml
  unit?: string;       // 'pages', 'mins', 'ml', 'km', etc.
  timeOfDay: TimeOfDay;
  archived: boolean;
  createdAt: string;   // ISO format
  reminderTime?: string; // e.g. '08:00'
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;        // 'YYYY-MM-DD'
  completed: boolean;
  value: number;       // Current value achieved on this date
  notes?: string;
  completedAt?: string;
}

export interface UserProfile {
  name: string;
  xp: number;
  level: number;
  soundEnabled: boolean;
  darkMode: boolean;
  skipDeleteConfirm?: boolean;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate30d: number;
  weeklyRate: number;
  isCompletedToday: boolean;
  todayValue: number;
}

export interface TodoItem {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  important: boolean;
  order: number;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}
