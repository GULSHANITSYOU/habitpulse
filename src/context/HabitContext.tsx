import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type {
  Habit,
  HabitLog,
  UserProfile,
  HabitCategory,
  TimeOfDay,
  HabitStats,
  TodoItem,
  IdeaItem,
  FocusSession,
  TeamMember,
  TeamTask,
  TaskUpdateLog,
} from '../types/habit';
import {
  loadHabitsFromStorage,
  saveHabitsToStorage,
  loadLogsFromStorage,
  saveLogsToStorage,
  loadUserFromStorage,
  saveUserToStorage,
  loadTodosFromStorage,
  saveTodosToStorage,
  loadIdeasFromStorage,
  saveIdeasToStorage,
  loadFocusSessionsFromStorage,
  saveFocusSessionsToStorage,
  loadTeamMembersFromStorage,
  saveTeamMembersToStorage,
  loadTeamTasksFromStorage,
  saveTeamTasksToStorage,
  loadCurrentMemberIdFromStorage,
  saveCurrentMemberIdToStorage,
  defaultSeedTeamMembers,
  defaultSeedTeamTasks,
  getInitialSeedData,
  resetSystemStorage,
} from '../utils/storage';
import {
  getTodayKey,
  parseDateKey,
  isHabitScheduledForDate,
  calculateHabitStreaks,
  calculateCompletionRate,
} from '../utils/dateUtils';
import { soundFx } from '../utils/audio';
import { useAuth } from './AuthContext';

export type ActiveTabType =
  | 'today'
  | 'team'
  | 'weekly'
  | 'heatmap'
  | 'todos'
  | 'ideas'
  | 'locked_in'
  | 'analytics'
  | 'manage';

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  todos: TodoItem[];
  ideas: IdeaItem[];
  focusSessions: FocusSession[];
  user: UserProfile;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  filterCategory: HabitCategory | 'all';
  setFilterCategory: (cat: HabitCategory | 'all') => void;
  filterTimeOfDay: TimeOfDay | 'all';
  setFilterTimeOfDay: (time: TimeOfDay | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  requestDeleteHabit: (id: string, title: string) => void;
  deletePendingHabit: { id: string; title: string } | null;
  confirmDeleteHabit: (rememberChoice: boolean) => void;
  cancelDeleteHabit: () => void;
  resetDeleteConfirmPreference: () => void;
  toggleArchiveHabit: (id: string) => void;
  reorderHabits: (newHabits: Habit[]) => void;
  moveHabit: (sourceId: string, targetId: string) => void;
  moveHabitStep: (habitId: string, direction: 'up' | 'down') => void;
  toggleHabitCompletion: (habitId: string, dateStr?: string) => void;
  setHabitNumericValue: (habitId: string, value: number, dateStr?: string) => void;
  incrementHabitValue: (habitId: string, delta: number, dateStr?: string) => void;
  updateHabitNotes: (habitId: string, notes: string, dateStr?: string) => void;

  // To-Do Actions
  addTodo: (title: string, notes?: string, important?: boolean, dueDate?: string) => void;
  toggleTodo: (id: string) => void;
  toggleTodoImportant: (id: string) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  reorderTodos: (newTodos: TodoItem[]) => void;
  clearCompletedTodos: () => void;

  // Ideas Actions
  addIdea: (idea: Omit<IdeaItem, 'id' | 'createdAt'>) => void;
  updateIdea: (id: string, updates: Partial<IdeaItem>) => void;
  deleteIdea: (id: string) => void;
  togglePinIdea: (id: string) => void;

  // Locked In Focus Actions
  addFocusSession: (session: Omit<FocusSession, 'id'>) => void;
  deleteFocusSession: (id: string) => void;
  clearFocusSessions: () => void;

  // Team Collaboration Actions
  teamMembers: TeamMember[];
  teamTasks: TeamTask[];
  currentMemberId: string;
  setCurrentMemberId: (id: string) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  createTeamTask: (task: Omit<TeamTask, 'id' | 'createdAt' | 'status' | 'progress' | 'updates'>) => void;
  acceptTeamTask: (taskId: string, message?: string) => void;
  declineTeamTask: (taskId: string, reason: string) => void;
  updateTaskProgress: (taskId: string, progress: number, updateMessage?: string) => void;
  submitTaskForReview: (taskId: string, finalNotes?: string) => void;
  approveTeamTask: (taskId: string, feedback?: string) => void;
  reopenTeamTask: (taskId: string, feedback: string) => void;
  deleteTeamTask: (taskId: string) => void;
  updateTeamTask: (taskId: string, updates: Partial<TeamTask>) => void;
  
  // Settings & Storage
  resetToDefaults: () => void;
  resetFullSystem: () => void;
  importData: (jsonStr: string) => boolean;
  exportData: () => string;
  loadTemplate: (templates: Partial<Habit>[]) => void;
  toggleSound: () => void;
  toggleTheme: () => void;
  triggerConfetti: () => void;
  
  // Helpers & Stats
  getHabitStats: (habit: Habit) => HabitStats;
  getHabitLog: (habitId: string, dateStr?: string) => HabitLog | undefined;
  todaySummary: {
    scheduled: number;
    completed: number;
    rate: number;
  };
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabitsFromStorage());
  const [logs, setLogs] = useState<HabitLog[]>(() => loadLogsFromStorage());
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodosFromStorage());
  const [ideas, setIdeas] = useState<IdeaItem[]>(() => loadIdeasFromStorage());
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => loadFocusSessionsFromStorage());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadTeamMembersFromStorage());
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>(() => loadTeamTasksFromStorage());
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => loadCurrentMemberIdFromStorage());
  const [user, setUser] = useState<UserProfile>(() => loadUserFromStorage());

  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [activeTab, setActiveTab] = useState<ActiveTabType>('today');
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [filterTimeOfDay, setFilterTimeOfDay] = useState<TimeOfDay | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth & Cloud Sync
  const {
    currentUser,
    isPremium,
    syncCurrentDataToCloud,
    loadCloudDataIntoApp,
  } = useAuth();

  const isCloudInitialLoaded = React.useRef(false);

  // If user is premium and logged in, load cloud data on mount or when user changes
  useEffect(() => {
    let isMounted = true;
    if (currentUser && isPremium) {
      loadCloudDataIntoApp().then((cloudData) => {
        if (!isMounted) return;
        if (cloudData) {
          if (Array.isArray(cloudData.habits)) setHabits(cloudData.habits);
          if (Array.isArray(cloudData.logs)) setLogs(cloudData.logs);
          if (Array.isArray(cloudData.todos)) setTodos(cloudData.todos);
          if (Array.isArray(cloudData.ideas)) setIdeas(cloudData.ideas);
          if (Array.isArray(cloudData.focus_sessions)) setFocusSessions(cloudData.focus_sessions);
          if (Array.isArray(cloudData.team_tasks)) setTeamTasks(cloudData.team_tasks);
          if (Array.isArray(cloudData.team_members)) setTeamMembers(cloudData.team_members);
          if (cloudData.user) setUser((prev) => ({ ...prev, ...cloudData.user }));
        }
        isCloudInitialLoaded.current = true;
      });
    } else {
      isCloudInitialLoaded.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, isPremium, loadCloudDataIntoApp]);

  // Persist habits on change
  useEffect(() => {
    saveHabitsToStorage(habits);
  }, [habits]);

  // Persist logs on change
  useEffect(() => {
    saveLogsToStorage(logs);
  }, [logs]);

  // Persist todos on change
  useEffect(() => {
    saveTodosToStorage(todos);
  }, [todos]);

  // Persist ideas on change
  useEffect(() => {
    saveIdeasToStorage(ideas);
  }, [ideas]);

  // Persist focus sessions on change
  useEffect(() => {
    saveFocusSessionsToStorage(focusSessions);
  }, [focusSessions]);

  // Persist team members on change
  useEffect(() => {
    saveTeamMembersToStorage(teamMembers);
  }, [teamMembers]);

  // Persist team tasks on change
  useEffect(() => {
    saveTeamTasksToStorage(teamTasks);
  }, [teamTasks]);

  // Persist current member id
  useEffect(() => {
    saveCurrentMemberIdToStorage(currentMemberId);
  }, [currentMemberId]);

  // Persist user and apply dark/light class
  useEffect(() => {
    saveUserToStorage(user);
    if (user.darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [user]);

  // Whenever data changes, sync to Supabase Cloud if user is premium & logged in
  useEffect(() => {
    if (isPremium && currentUser && isCloudInitialLoaded.current) {
      syncCurrentDataToCloud({
        habits,
        logs,
        todos,
        ideas,
        focus_sessions: focusSessions,
        team_tasks: teamTasks,
        team_members: teamMembers,
        user,
      });
    }
  }, [habits, logs, todos, ideas, focusSessions, teamTasks, teamMembers, user, isPremium, currentUser, syncCurrentDataToCloud]);

  // Confetti helper
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
      });
    } catch {
      // Ignored
    }
  }, []);

  // Award XP and calculate levels (100 XP per level)
  const addXp = useCallback((amount: number) => {
    setUser((prev) => {
      const newXp = Math.max(0, prev.xp + amount);
      const newLevel = Math.floor(newXp / 150) + 1;
      const leveledUp = newLevel > prev.level;

      if (leveledUp) {
        soundFx.playLevelUp(prev.soundEnabled);
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  }, []);

  // Get log for specific habit and date
  const getHabitLog = useCallback((habitId: string, dateStr?: string): HabitLog | undefined => {
    const targetDate = dateStr || selectedDate;
    return logs.find((l) => l.habitId === habitId && l.date === targetDate);
  }, [logs, selectedDate]);

  // Toggle habit completion (checkbox style or marks full target)
  const toggleHabitCompletion = useCallback((habitId: string, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    soundFx.playTap(user.soundEnabled);

    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex((l) => l.habitId === habitId && l.date === targetDate);
      const wasCompleted = existingIndex >= 0 ? prevLogs[existingIndex].completed : false;
      const willBeCompleted = !wasCompleted;

      let updated: HabitLog[];

      if (existingIndex >= 0) {
        const existing = prevLogs[existingIndex];
        const newLog: HabitLog = {
          ...existing,
          completed: willBeCompleted,
          value: willBeCompleted ? (habit.habitType === 'numeric' ? habit.targetValue : 1) : 0,
          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        };
        updated = [...prevLogs];
        updated[existingIndex] = newLog;
      } else {
        const newLog: HabitLog = {
          id: `log-${habitId}-${targetDate}`,
          habitId,
          date: targetDate,
          completed: willBeCompleted,
          value: willBeCompleted ? (habit.habitType === 'numeric' ? habit.targetValue : 1) : 0,
          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        };
        updated = [...prevLogs, newLog];
      }

      if (willBeCompleted) {
        soundFx.playCompletion(user.soundEnabled);
        triggerConfetti();
        addXp(30);
      } else {
        addXp(-30);
      }

      return updated;
    });
  }, [habits, selectedDate, user.soundEnabled, triggerConfetti, addXp]);

  // Set numeric value directly (for counter / progress habits)
  const setHabitNumericValue = useCallback((habitId: string, val: number, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const clampedValue = Math.max(0, val);
    const isCompleted = clampedValue >= habit.targetValue;

    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex((l) => l.habitId === habitId && l.date === targetDate);
      const wasCompleted = existingIndex >= 0 ? prevLogs[existingIndex].completed : false;

      let updated: HabitLog[];

      if (existingIndex >= 0) {
        const existing = prevLogs[existingIndex];
        updated = [...prevLogs];
        updated[existingIndex] = {
          ...existing,
          value: clampedValue,
          completed: isCompleted,
          completedAt: isCompleted ? (existing.completedAt || new Date().toISOString()) : undefined,
        };
      } else {
        const newLog: HabitLog = {
          id: `log-${habitId}-${targetDate}`,
          habitId,
          date: targetDate,
          value: clampedValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
        updated = [...prevLogs, newLog];
      }

      if (isCompleted && !wasCompleted) {
        soundFx.playCompletion(user.soundEnabled);
        triggerConfetti();
        addXp(30);
      } else if (!isCompleted && wasCompleted) {
        addXp(-30);
      } else {
        soundFx.playTap(user.soundEnabled);
      }

      return updated;
    });
  }, [habits, selectedDate, user.soundEnabled, triggerConfetti, addXp]);

  // Increment or decrement habit numeric progress
  const incrementHabitValue = useCallback((habitId: string, delta: number, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    const currentLog = getHabitLog(habitId, targetDate);
    const currentValue = currentLog?.value || 0;
    setHabitNumericValue(habitId, currentValue + delta, targetDate);
  }, [selectedDate, getHabitLog, setHabitNumericValue]);

  // Update note on habit log
  const updateHabitNotes = useCallback((habitId: string, notes: string, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex((l) => l.habitId === habitId && l.date === targetDate);
      if (existingIndex >= 0) {
        const updated = [...prevLogs];
        updated[existingIndex] = { ...updated[existingIndex], notes };
        return updated;
      } else {
        const newLog: HabitLog = {
          id: `log-${habitId}-${targetDate}`,
          habitId,
          date: targetDate,
          completed: false,
          value: 0,
          notes,
        };
        return [...prevLogs, newLog];
      }
    });
  }, [selectedDate]);

  // Create habit
  const addHabit = useCallback((data: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    const newHabit: Habit = {
      ...data,
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setHabits((prev) => [newHabit, ...prev]);
    soundFx.playTap(user.soundEnabled);
    addXp(15);
  }, [user.soundEnabled, addXp]);

  // Update habit
  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Delete habit and associated logs
  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const [deletePendingHabit, setDeletePendingHabit] = useState<{ id: string; title: string } | null>(null);

  const requestDeleteHabit = useCallback((id: string, title: string) => {
    if (user.skipDeleteConfirm) {
      deleteHabit(id);
    } else {
      setDeletePendingHabit({ id, title });
    }
  }, [user.skipDeleteConfirm, deleteHabit]);

  const confirmDeleteHabit = useCallback((rememberChoice: boolean) => {
    if (!deletePendingHabit) return;
    if (rememberChoice) {
      setUser((prev) => ({ ...prev, skipDeleteConfirm: true }));
    }
    deleteHabit(deletePendingHabit.id);
    setDeletePendingHabit(null);
  }, [deletePendingHabit, deleteHabit]);

  const cancelDeleteHabit = useCallback(() => {
    setDeletePendingHabit(null);
  }, []);

  const resetDeleteConfirmPreference = useCallback(() => {
    setUser((prev) => ({ ...prev, skipDeleteConfirm: false }));
  }, []);

  // Toggle archive status
  const toggleArchiveHabit = useCallback((id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, archived: !h.archived } : h)));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Reorder habits directly
  const reorderHabits = useCallback((newHabits: Habit[]) => {
    const normalized = newHabits.map((h, index) => ({
      ...h,
      order: index,
    }));
    setHabits(normalized);
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Move habit from sourceId to targetId position
  const moveHabit = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setHabits((prev) => {
      const sourceIndex = prev.findIndex((h) => h.id === sourceId);
      const targetIndex = prev.findIndex((h) => h.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      return next.map((h, index) => ({ ...h, order: index }));
    });
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Move habit 1 step up or down
  const moveHabitStep = useCallback((habitId: string, direction: 'up' | 'down') => {
    setHabits((prev) => {
      const currentIndex = prev.findIndex((h) => h.id === habitId);
      if (currentIndex === -1) return prev;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);

      return next.map((h, index) => ({ ...h, order: index }));
    });
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Load preset templates
  const loadTemplate = useCallback((templates: Partial<Habit>[]) => {
    const newHabits: Habit[] = templates.map((tpl) => ({
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: tpl.title || 'New Habit',
      description: tpl.description || '',
      category: tpl.category || 'productivity',
      color: tpl.color || '#6366f1',
      icon: tpl.icon || 'Sparkles',
      frequencyType: tpl.frequencyType || 'daily',
      customDays: tpl.customDays,
      habitType: tpl.habitType || 'boolean',
      targetValue: tpl.targetValue || 1,
      unit: tpl.unit,
      timeOfDay: tpl.timeOfDay || 'anytime',
      archived: false,
      createdAt: new Date().toISOString(),
    }));

    setHabits((prev) => [...newHabits, ...prev]);
    soundFx.playLevelUp(user.soundEnabled);
    triggerConfetti();
  }, [user.soundEnabled, triggerConfetti]);

  // To-Do Actions
  const addTodo = useCallback((title: string, notes?: string, important = false, dueDate?: string) => {
    if (!title.trim()) return;
    const newTodo: TodoItem = {
      id: `td-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      notes: notes?.trim() || undefined,
      completed: false,
      important,
      order: 0,
      dueDate,
      createdAt: new Date().toISOString(),
    };

    setTodos((prev) => {
      const updated = prev.map((t) => ({ ...t, order: t.order + 1 }));
      return [newTodo, ...updated];
    });

    soundFx.playTap(user.soundEnabled);
    addXp(5);
  }, [user.soundEnabled, addXp]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const willBeDone = !t.completed;
        if (willBeDone) {
          soundFx.playCompletion(user.soundEnabled);
          triggerConfetti();
          addXp(15);
        } else {
          soundFx.playTap(user.soundEnabled);
          addXp(-15);
        }
        return {
          ...t,
          completed: willBeDone,
          completedAt: willBeDone ? new Date().toISOString() : undefined,
        };
      })
    );
  }, [user.soundEnabled, triggerConfetti, addXp]);

  const toggleTodoImportant = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        soundFx.playTap(user.soundEnabled);
        return {
          ...t,
          important: !t.important,
        };
      })
    );
  }, [user.soundEnabled]);

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const reorderTodos = useCallback((newTodos: TodoItem[]) => {
    const normalized = newTodos.map((t, index) => ({
      ...t,
      order: index,
    }));
    setTodos(normalized);
  }, []);

  const clearCompletedTodos = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Ideas Actions
  const addIdea = useCallback((data: Omit<IdeaItem, 'id' | 'createdAt'>) => {
    const newIdea: IdeaItem = {
      ...data,
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setIdeas((prev) => [newIdea, ...prev]);
    soundFx.playTap(user.soundEnabled);
    triggerConfetti();
    addXp(20);
  }, [user.soundEnabled, triggerConfetti, addXp]);

  const updateIdea = useCallback((id: string, updates: Partial<IdeaItem>) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, ...updates, updatedAt: new Date().toISOString() } : idea
      )
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const deleteIdea = useCallback((id: string) => {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const togglePinIdea = useCallback((id: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, pinned: !idea.pinned } : idea
      )
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Locked In Focus Session Actions
  const addFocusSession = useCallback((data: Omit<FocusSession, 'id'>) => {
    const newSession: FocusSession = {
      ...data,
      id: `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setFocusSessions((prev) => [newSession, ...prev]);
    soundFx.playCompletion(user.soundEnabled);
    triggerConfetti();
    // Award XP based on minutes focused (at least 15 XP + 1 XP per minute)
    const earnedXp = Math.max(15, Math.round(data.durationMinutes * 1.5));
    addXp(earnedXp);
  }, [user.soundEnabled, triggerConfetti, addXp]);

  const deleteFocusSession = useCallback((id: string) => {
    setFocusSessions((prev) => prev.filter((s) => s.id !== id));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const clearFocusSessions = useCallback(() => {
    setFocusSessions([]);
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Team Collaboration Actions
  const addTeamMember = useCallback((data: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...data,
      id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const deleteTeamMember = useCallback((id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const createTeamTask = useCallback((data: Omit<TeamTask, 'id' | 'createdAt' | 'status' | 'progress' | 'updates'>) => {
    const newTask: TeamTask = {
      ...data,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending_acceptance',
      progress: 0,
      createdAt: new Date().toISOString(),
      updates: [
        {
          id: `up-${Date.now()}`,
          authorId: data.assignedById,
          authorName: data.assignedByName,
          message: `Task assigned to ${data.assignedToName}. Waiting for acceptance.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setTeamTasks((prev) => [newTask, ...prev]);
    soundFx.playTap(user.soundEnabled);
    addXp(15);
  }, [user.soundEnabled, addXp]);

  const acceptTeamTask = useCallback((taskId: string, message?: string) => {
    const now = new Date().toISOString();
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newUpdate: TaskUpdateLog = {
          id: `up-${Date.now()}`,
          authorId: t.assignedToId,
          authorName: t.assignedToName,
          message: message?.trim() || `${t.assignedToName} accepted this task and started working.`,
          progressPercent: t.progress,
          timestamp: now,
        };
        return {
          ...t,
          status: 'in_progress',
          acceptedAt: now,
          updates: [...t.updates, newUpdate],
        };
      })
    );
    soundFx.playTap(user.soundEnabled);
    addXp(20);
  }, [user.soundEnabled, addXp]);

  const declineTeamTask = useCallback((taskId: string, reason: string) => {
    const now = new Date().toISOString();
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newUpdate: TaskUpdateLog = {
          id: `up-${Date.now()}`,
          authorId: t.assignedToId,
          authorName: t.assignedToName,
          message: `Task declined. Reason: ${reason}`,
          timestamp: now,
        };
        return {
          ...t,
          updates: [...t.updates, newUpdate],
        };
      })
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const updateTaskProgress = useCallback((taskId: string, progress: number, updateMessage?: string) => {
    const now = new Date().toISOString();
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newUpdates = [...t.updates];
        if (updateMessage?.trim()) {
          newUpdates.push({
            id: `up-${Date.now()}`,
            authorId: t.assignedToId,
            authorName: t.assignedToName,
            message: updateMessage.trim(),
            progressPercent: clampedProgress,
            timestamp: now,
          });
        }
        return {
          ...t,
          progress: clampedProgress,
          updates: newUpdates,
        };
      })
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const submitTaskForReview = useCallback((taskId: string, finalNotes?: string) => {
    const now = new Date().toISOString();
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newUpdate: TaskUpdateLog = {
          id: `up-${Date.now()}`,
          authorId: t.assignedToId,
          authorName: t.assignedToName,
          message: finalNotes?.trim()
            ? `Work finished (100%) and submitted for review: "${finalNotes.trim()}"`
            : `Work finished (100%) and submitted for review to ${t.assignedByName}.`,
          progressPercent: 100,
          timestamp: now,
        };
        return {
          ...t,
          status: 'in_review',
          progress: 100,
          submittedForReviewAt: now,
          updates: [...t.updates, newUpdate],
        };
      })
    );
    soundFx.playCompletion(user.soundEnabled);
    triggerConfetti();
    addXp(35);
  }, [user.soundEnabled, triggerConfetti, addXp]);

  const approveTeamTask = useCallback((taskId: string, feedback?: string) => {
    const now = new Date().toISOString();
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newUpdate: TaskUpdateLog = {
          id: `up-${Date.now()}`,
          authorId: t.assignedById,
          authorName: t.assignedByName,
          message: feedback?.trim()
            ? `Verified & Approved by ${t.assignedByName}: "${feedback.trim()}"`
            : `Verified & Approved by ${t.assignedByName}. Task marked Complete!`,
          progressPercent: 100,
          timestamp: now,
        };
        return {
          ...t,
          status: 'completed',
          progress: 100,
          completedAt: now,
          updates: [...t.updates, newUpdate],
        };
      })
    );
    soundFx.playLevelUp(user.soundEnabled);
    triggerConfetti();
    addXp(50);
  }, [user.soundEnabled, triggerConfetti, addXp]);

  const reopenTeamTask = useCallback((taskId: string, feedback: string) => {
    const now = new Date().toISOString();
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newUpdate: TaskUpdateLog = {
          id: `up-${Date.now()}`,
          authorId: t.assignedById,
          authorName: t.assignedByName,
          message: `Reopened for revisions: "${feedback.trim()}"`,
          timestamp: now,
        };
        return {
          ...t,
          status: 'in_progress',
          progress: Math.min(85, t.progress),
          updates: [...t.updates, newUpdate],
        };
      })
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const deleteTeamTask = useCallback((taskId: string) => {
    setTeamTasks((prev) => prev.filter((t) => t.id !== taskId));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  const updateTeamTask = useCallback((taskId: string, updates: Partial<TeamTask>) => {
    setTeamTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Reset all data to rich seed demo
  const resetToDefaults = useCallback(() => {
    const initial = getInitialSeedData();
    setHabits(initial.habits);
    setLogs(initial.logs);
    setUser(initial.user);
    setTodos(loadTodosFromStorage());
    setIdeas(loadIdeasFromStorage());
    setFocusSessions(loadFocusSessionsFromStorage());
    setTeamMembers(defaultSeedTeamMembers);
    setTeamTasks(defaultSeedTeamTasks);
    setCurrentMemberId('tm-alex');
    soundFx.playTap(true);
  }, []);

  // Reset full system: wipe all habits, all logs, all todos, all ideas, all focus sessions, reset user to Level 1 (0 XP)
  const resetFullSystem = useCallback(() => {
    const resetResult = resetSystemStorage(true);
    setHabits(resetResult.habits);
    setLogs(resetResult.logs);
    setUser(resetResult.user);
    setTodos([]);
    setIdeas([]);
    setFocusSessions([]);
    setTeamTasks([]);
    setSelectedDate(getTodayKey());
    setActiveTab('today');
    soundFx.playTap(true);
  }, []);

  // Export JSON
  const exportData = useCallback((): string => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      logs,
      todos,
      ideas,
      focusSessions,
      teamMembers,
      teamTasks,
      user,
    };
    return JSON.stringify(data, null, 2);
  }, [habits, logs, todos, ideas, focusSessions, teamMembers, teamTasks, user]);

  // Import JSON
  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.habits)) {
        setHabits(parsed.habits);
      }
      if (Array.isArray(parsed.logs)) {
        setLogs(parsed.logs);
      }
      if (Array.isArray(parsed.todos)) {
        setTodos(parsed.todos);
      }
      if (Array.isArray(parsed.ideas)) {
        setIdeas(parsed.ideas);
      }
      if (Array.isArray(parsed.focusSessions)) {
        setFocusSessions(parsed.focusSessions);
      }
      if (Array.isArray(parsed.teamMembers)) {
        setTeamMembers(parsed.teamMembers);
      }
      if (Array.isArray(parsed.teamTasks)) {
        setTeamTasks(parsed.teamTasks);
      }
      if (parsed.user) {
        setUser(parsed.user);
      }
      soundFx.playLevelUp(user.soundEnabled);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }, [user.soundEnabled]);

  const toggleSound = useCallback(() => {
    setUser((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleTheme = useCallback(() => {
    setUser((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  // Compute stats for any habit
  const getHabitStats = useCallback((habit: Habit): HabitStats => {
    const { currentStreak, longestStreak } = calculateHabitStreaks(habit, logs);
    const completionRate30d = calculateCompletionRate(habit, logs, 30);
    const weeklyRate = calculateCompletionRate(habit, logs, 7);
    const todayLog = logs.find((l) => l.habitId === habit.id && l.date === getTodayKey());
    const totalCompletions = logs.filter((l) => l.habitId === habit.id && l.completed).length;

    return {
      currentStreak,
      longestStreak,
      totalCompletions,
      completionRate30d,
      weeklyRate,
      isCompletedToday: Boolean(todayLog?.completed),
      todayValue: todayLog?.value || 0,
    };
  }, [logs]);

  // Summary of selected day
  const todaySummary = useMemo(() => {
    const targetDateObj = parseDateKey(selectedDate);
    const activeHabits = habits.filter((h) => !h.archived);
    const scheduled = activeHabits.filter((h) => isHabitScheduledForDate(h, targetDateObj));
    const completed = scheduled.filter((h) => {
      const log = logs.find((l) => l.habitId === h.id && l.date === selectedDate);
      return Boolean(log?.completed);
    }).length;

    const rate = scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0;
    return {
      scheduled: scheduled.length,
      completed,
      rate,
    };
  }, [habits, logs, selectedDate]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        todos,
        ideas,
        focusSessions,
        teamMembers,
        teamTasks,
        currentMemberId,
        setCurrentMemberId,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        createTeamTask,
        acceptTeamTask,
        declineTeamTask,
        updateTaskProgress,
        submitTaskForReview,
        approveTeamTask,
        reopenTeamTask,
        deleteTeamTask,
        updateTeamTask,
        user,
        selectedDate,
        setSelectedDate,
        activeTab,
        setActiveTab,
        filterCategory,
        setFilterCategory,
        filterTimeOfDay,
        setFilterTimeOfDay,
        searchQuery,
        setSearchQuery,
        addHabit,
        updateHabit,
        deleteHabit,
        requestDeleteHabit,
        deletePendingHabit,
        confirmDeleteHabit,
        cancelDeleteHabit,
        resetDeleteConfirmPreference,
        toggleArchiveHabit,
        reorderHabits,
        moveHabit,
        moveHabitStep,
        toggleHabitCompletion,
        setHabitNumericValue,
        incrementHabitValue,
        updateHabitNotes,
        addTodo,
        toggleTodo,
        toggleTodoImportant,
        updateTodo,
        deleteTodo,
        reorderTodos,
        clearCompletedTodos,
        addIdea,
        updateIdea,
        deleteIdea,
        togglePinIdea,
        addFocusSession,
        deleteFocusSession,
        clearFocusSessions,
        resetToDefaults,
        resetFullSystem,
        importData,
        exportData,
        loadTemplate,
        toggleSound,
        toggleTheme,
        triggerConfetti,
        getHabitStats,
        getHabitLog,
        todaySummary,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
