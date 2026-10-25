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
  order?: number;      // Custom user display order
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
  id?: string;
  email?: string;
  name: string;
  xp: number;
  level: number;
  soundEnabled: boolean;
  darkMode: boolean;
  skipDeleteConfirm?: boolean;
  isPremium?: boolean;
  subscriptionPlan?: 'free' | 'monthly' | 'yearly' | 'lifetime';
  subscriptionExpiresAt?: string;
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

export interface IdeaItem {
  id: string;
  title: string;
  description: string;
  resources: string;
  category?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FocusSession {
  id: string;
  topic: string;
  mode: 'timer' | 'stopwatch';
  durationSeconds: number;
  durationMinutes: number;
  targetMinutes?: number;
  completed: boolean;
  notes?: string;
  startedAt: string;
  completedAt: string;
}

// ==========================================
// Team Workspace & Collaborative Delegation
// ==========================================

export type TeamTaskStatus = 
  | 'pending_acceptance'  // Assigner gave task, waiting for Assignee to accept
  | 'in_progress'         // Assignee accepted, currently working & updating progress
  | 'in_review'           // Assignee finished work, waiting for Assigner review & approval
  | 'completed';          // Assigner approved and marked completed

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TaskUpdateLog {
  id: string;
  authorId: string;
  authorName: string;
  message: string;
  progressPercent?: number;
  timestamp: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;           // e.g. 'Lead Dev', 'Designer', 'Product Manager', 'Backend Dev', 'QA'
  avatarColor: string;    // e.g. '#6366f1', '#06b6d4', etc.
  email?: string;
  isCurrentUser?: boolean;
}

export interface TeamTask {
  id: string;
  title: string;
  description?: string;
  category: string;        // 'Frontend' | 'Backend' | 'Design' | 'Product' | 'Bug' | 'DevOps' | 'Growth'
  priority: TaskPriority;
  status: TeamTaskStatus;
  progress: number;        // 0 to 100%
  
  // Two-way accountability
  assignedById: string;    // Who gave the task
  assignedByName: string;
  assignedToId: string;    // Who is responsible to do the task
  assignedToName: string;
  
  dueDate?: string;
  createdAt: string;
  acceptedAt?: string;
  submittedForReviewAt?: string;
  completedAt?: string;
  
  updates: TaskUpdateLog[]; // Progress updates and discussion checkpoints
}



