import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitProvider, useHabits } from './context/HabitContext';
import { Header } from './components/Header';
import { DailyOverview } from './components/DailyOverview';
import { HabitCard } from './components/HabitCard';
import { parseDateKey, isHabitScheduledForDate } from './utils/dateUtils';
import { Plus, Sparkles, CheckCircle2, Cloud, HardDrive, Loader2 } from 'lucide-react';
import { HabitModal } from './components/HabitModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';

// Code-split heavy secondary views for maximum initial page load speed
const WeeklyMatrix = lazy(() => import('./components/WeeklyMatrix').then(m => ({ default: m.WeeklyMatrix })));
const HeatmapView = lazy(() => import('./components/HeatmapView').then(m => ({ default: m.HeatmapView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const ManageHabitsView = lazy(() => import('./components/ManageHabitsView').then(m => ({ default: m.ManageHabitsView })));
const TodosView = lazy(() => import('./components/TodosView').then(m => ({ default: m.TodosView })));
const IdeasView = lazy(() => import('./components/IdeasView').then(m => ({ default: m.IdeasView })));
const LockedInView = lazy(() => import('./components/LockedInView').then(m => ({ default: m.LockedInView })));

const TabLoadingFallback: React.FC = () => (
  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
    <span className="text-xs text-zinc-500 font-medium">Loading view...</span>
  </div>
);

const MainContent: React.FC = () => {
  const {
    habits,
    selectedDate,
    activeTab,
    filterCategory,
    filterTimeOfDay,
    searchQuery,
    getHabitLog,
    deletePendingHabit,
    confirmDeleteHabit,
    cancelDeleteHabit,
  } = useHabits();

  const { isPremium, isLifetime } = useAuth();

  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = React.useState(false);

  const activeHabits = habits.filter((h) => !h.archived);

  const targetDateObj = parseDateKey(selectedDate);
  const scheduledHabits = activeHabits.filter((h) => {
    const isScheduled = isHabitScheduledForDate(h, targetDateObj);
    if (!isScheduled) return false;

    if (filterCategory !== 'all' && h.category !== filterCategory) return false;
    if (filterTimeOfDay !== 'all' && h.timeOfDay !== filterTimeOfDay) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = h.title.toLowerCase().includes(q);
      const matchDesc = (h.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  const sortedScheduledHabits = [...scheduledHabits].sort((a, b) => {
    const logA = getHabitLog(a.id, selectedDate);
    const logB = getHabitLog(b.id, selectedDate);
    const doneA = Boolean(logA?.completed);
    const doneB = Boolean(logB?.completed);
    if (doneA === doneB) return 0;
    return doneA ? 1 : -1;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-black text-black dark:text-white transition-colors selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-8 pb-24 sm:pb-12">
        {activeTab === 'today' && (
          <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-300">
            <DailyOverview />

            {/* Habit Cards Grid */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight whitespace-nowrap">
                    Daily Rituals ({sortedScheduledHabits.length})
                  </h3>
                  {sortedScheduledHabits.length > 0 && (
                    <span className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      • Tap to complete or track progress
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsNewHabitModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white hover:opacity-70 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Habit</span>
                </button>
              </div>

              {sortedScheduledHabits.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-2xl card-neo text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-black dark:text-white">No rituals scheduled</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                      {searchQuery || filterCategory !== 'all' || filterTimeOfDay !== 'all'
                        ? 'No habits match your active filters. Try clearing filters or search keywords.'
                        : 'No habits scheduled for this day. You can take this as a rest day or create a new habit!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNewHabitModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold transition shadow-sm hover:opacity-85 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Create a Habit</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                  {sortedScheduledHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} dateKey={selectedDate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'locked_in' && (
            <div className="animate-in fade-in duration-300">
              <LockedInView />
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="animate-in fade-in duration-300">
              <WeeklyMatrix />
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="animate-in fade-in duration-300">
              <HeatmapView />
            </div>
          )}

          {activeTab === 'todos' && (
            <div className="animate-in fade-in duration-300">
              <TodosView />
            </div>
          )}

          {activeTab === 'ideas' && (
            <div className="animate-in fade-in duration-300">
              <IdeasView />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-300">
              <AnalyticsView />
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="animate-in fade-in duration-300">
              <ManageHabitsView />
            </div>
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">HabitPulse — Minimalist & High-Consistency Daily Rituals</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isLifetime ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-black dark:text-white" />
                <span className="font-semibold text-black dark:text-white">Lifetime VIP Tier • Encrypted Supabase Cloud</span>
              </>
            ) : isPremium ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Pro Tier • Stored online in Supabase Database</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                <span>Free Tier • Stored locally in your browser</span>
              </>
            )}
          </div>
        </div>
      </footer>

      {isNewHabitModalOpen && (
        <HabitModal
          isOpen={isNewHabitModalOpen}
          onClose={() => setIsNewHabitModalOpen(false)}
        />
      )}

      {deletePendingHabit && (
        <DeleteConfirmModal
          isOpen={Boolean(deletePendingHabit)}
          habitTitle={deletePendingHabit.title}
          onConfirm={confirmDeleteHabit}
          onCancel={cancelDeleteHabit}
        />
      )}

      {/* Modals */}
      <AuthModal />
      <PricingModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <HabitProvider>
        <MainContent />
      </HabitProvider>
    </AuthProvider>
  );
}

export default App;
