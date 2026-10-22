import React from 'react';
import {
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Calendar,
  Grid,
  BarChart3,
  ListTodo,
  Flame,
  Sparkles,
  CheckSquare,
  Lightbulb,
} from 'lucide-react';
import type { ActiveTabType } from '../context/HabitContext';

interface TabReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabOrder: ActiveTabType[];
  onReorder: (newOrder: ActiveTabType[]) => void;
  onReset: () => void;
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
}

const TAB_METADATA: Record<
  ActiveTabType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  today: { label: 'Today', icon: Calendar },
  locked_in: { label: 'Locked In', icon: Flame },
  weekly: { label: 'Weekly Grid', icon: Grid },
  heatmap: { label: 'Heatmap', icon: Sparkles },
  todos: { label: 'To-Dos', icon: CheckSquare },
  ideas: { label: 'Ideas Vault', icon: Lightbulb },
  analytics: { label: 'Analytics', icon: BarChart3 },
  manage: { label: 'All Habits', icon: ListTodo },
};

export const TabReorderModal: React.FC<TabReorderModalProps> = ({
  isOpen,
  onClose,
  tabOrder,
  onReorder,
  onReset,
  activeTab,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabOrder.length) return;

    const list = [...tabOrder];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    onReorder(list);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="card-neo relative w-full max-w-md bg-white dark:bg-black rounded-2xl p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-black dark:text-white">
              Rearrange Navigation Tabs
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Customize the order of your top navigation bar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of tabs */}
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {tabOrder.map((tabId, index) => {
            const meta = TAB_METADATA[tabId];
            if (!meta) return null;
            const Icon = meta.icon;
            const isCurrent = activeTab === tabId;

            return (
              <div
                key={tabId}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-black dark:border-white shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectTab(tabId);
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div className="w-7 h-7 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-black dark:text-white shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-black dark:text-white truncate">
                    {meta.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full ml-auto mr-2">
                      Active
                    </span>
                  )}
                </div>

                {/* Move buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => moveTab(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-20 transition"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveTab(index, 'down')}
                    disabled={index === tabOrder.length - 1}
                    className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-20 transition"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black shadow-sm hover:opacity-90 active:scale-95 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
