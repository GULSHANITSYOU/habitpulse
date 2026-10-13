import type { Habit, HabitLog } from '../types/habit';

// Format Date object to 'YYYY-MM-DD' in local timezone
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Today as 'YYYY-MM-DD' string
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

// Parse 'YYYY-MM-DD' to Date object
export function parseDateKey(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Format for pleasant display: "Tuesday, Oct 14"
export function formatDisplayDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? parseDateKey(dateInput) : dateInput;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// Short day name: "Mon", "Tue"
export function getShortDayName(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? parseDateKey(dateInput) : dateInput;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// Check if habit is scheduled for a specific date based on frequency rules
export function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  switch (habit.frequencyType) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom_days':
      return habit.customDays ? habit.customDays.includes(dayOfWeek) : true;
    case 'times_per_week':
      return true; // Available every day towards weekly quota
    default:
      return true;
  }
}

// Get array of 7 days for current week (Monday through Sunday)
export function getCurrentWeekDays(referenceDate: Date = new Date()): { date: Date; key: string; isToday: boolean; dayNum: number; shortName: string }[] {
  const curr = new Date(referenceDate);
  const currentDay = curr.getDay(); // 0 is Sun, 1 is Mon...
  // Distance to Monday (if Sun (0), distance is -6, otherwise 1 - currentDay)
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);

  const todayKey = getTodayKey();
  const week = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const key = formatDateKey(day);
    week.push({
      date: day,
      key,
      isToday: key === todayKey,
      dayNum: day.getDate(),
      shortName: day.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  return week;
}

// Calculate streak data for a single habit
export function calculateHabitStreaks(habit: Habit, logs: HabitLog[]): { currentStreak: number; longestStreak: number } {
  // Create quick lookup set of dates where habit was completed
  const logMap = new Map<string, HabitLog>();
  logs.filter(l => l.habitId === habit.id).forEach(l => {
    logMap.set(l.date, l);
  });

  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayLog = logMap.get(todayKey);
  const completedToday = Boolean(todayLog?.completed);

  // Check if today was scheduled
  const scheduledToday = isHabitScheduledForDate(habit, today);

  // Calculate current streak
  let currentStreak = 0;
  const checkDate = new Date(today);

  // If completed today, count today and walk backward
  if (completedToday) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (!scheduledToday) {
    // Not scheduled today, so streak might still be intact from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Scheduled today but not completed yet: check if yesterday was done
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Walk backwards up to 365 days
  while (true) {
    const dateKey = formatDateKey(checkDate);
    const isScheduled = isHabitScheduledForDate(habit, checkDate);
    const log = logMap.get(dateKey);

    if (isScheduled) {
      if (log?.completed) {
        currentStreak++;
      } else {
        // Broke streak
        break;
      }
    }
    // Step back 1 day
    checkDate.setDate(checkDate.getDate() - 1);

    // Stop checking if we've gone before habit creation date or past 365 days
    const createdDate = new Date(habit.createdAt);
    if (checkDate < createdDate || currentStreak > 365) {
      break;
    }
  }

  // Calculate longest streak across all history
  // Gather all dates sorted chronologically
  let longestStreak = currentStreak;
  let runningStreak = 0;

  // Scan over past 180 days
  const scanDate = new Date();
  scanDate.setDate(scanDate.getDate() - 180);
  const scanLimit = new Date();

  while (scanDate <= scanLimit) {
    const isScheduled = isHabitScheduledForDate(habit, scanDate);
    if (isScheduled) {
      const key = formatDateKey(scanDate);
      const isDone = Boolean(logMap.get(key)?.completed);
      if (isDone) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

// Calculate completion percentage over the last N days
export function calculateCompletionRate(habit: Habit, logs: HabitLog[], daysCount: number = 30): number {
  const logMap = new Map<string, HabitLog>();
  logs.filter(l => l.habitId === habit.id).forEach(l => {
    logMap.set(l.date, l);
  });

  let scheduledDays = 0;
  let completedDays = 0;
  const cursor = new Date();

  for (let i = 0; i < daysCount; i++) {
    const isScheduled = isHabitScheduledForDate(habit, cursor);
    if (isScheduled) {
      scheduledDays++;
      const key = formatDateKey(cursor);
      if (logMap.get(key)?.completed) {
        completedDays++;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  if (scheduledDays === 0) return 0;
  return Math.round((completedDays / scheduledDays) * 100);
}

// Generate date array for activity heatmap (e.g. past 90 or 180 days)
export function getHeatmapDates(days: number = 98): { date: Date; key: string }[] {
  const result: { date: Date; key: string }[] = [];
  const start = new Date();
  
  // Align to end on Saturday of current week to produce neat 7-row columns
  const dayOfWeek = start.getDay();
  const daysUntilSaturday = 6 - dayOfWeek;
  start.setDate(start.getDate() + daysUntilSaturday);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    result.push({
      date: d,
      key: formatDateKey(d),
    });
  }
  return result;
}
