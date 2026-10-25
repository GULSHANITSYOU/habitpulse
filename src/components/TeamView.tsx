import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Search,
  LayoutGrid,
  List,
  MessageSquare,
  X,
  Calendar,
  ShieldCheck,
  Send,
  Trash2,
  Check,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import type {
  TeamTask,
  TeamMember,
  TeamTaskStatus,
  TaskPriority,
} from '../types/habit';

type PerspectiveFilter = 'all' | 'assigned_to_me' | 'delegated_by_me' | 'needs_review';
type ViewMode = 'kanban' | 'list';

const CATEGORIES = [
  'All',
  'Frontend',
  'Backend',
  'Design',
  'Product',
  'Bug',
  'DevOps',
  'Growth',
  'Research',
];

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400',
  },
};

const STATUS_CONFIG: Record<
  TeamTaskStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  pending_acceptance: {
    label: 'Pending Acceptance',
    icon: Clock,
    description: 'Assigned, waiting for assignee to accept & start',
  },
  in_progress: {
    label: 'In Progress',
    icon: Sliders,
    description: 'Accepted and active work underway',
  },
  in_review: {
    label: 'In Review',
    icon: ShieldCheck,
    description: 'Work submitted, waiting for assigner verification',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    description: 'Verified and signed off by assigner',
  },
};

export const TeamView: React.FC = () => {
  const {
    teamMembers,
    teamTasks,
    currentMemberId,
    setCurrentMemberId,
    addTeamMember,
    deleteTeamMember,
    createTeamTask,
    acceptTeamTask,
    declineTeamTask,
    updateTaskProgress,
    submitTaskForReview,
    approveTeamTask,
    reopenTeamTask,
    deleteTeamTask,
  } = useHabits();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [perspective, setPerspective] = useState<PerspectiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Active persona
  const activeMember = useMemo(
    () => teamMembers.find((m) => m.id === currentMemberId) || teamMembers[0],
    [teamMembers, currentMemberId]
  );

  // Selected Task
  const selectedTask = useMemo(
    () => teamTasks.find((t) => t.id === selectedTaskId) || null,
    [teamTasks, selectedTaskId]
  );

  // Quick stats
  const stats = useMemo(() => {
    const total = teamTasks.length;
    const pendingMyAcceptance = teamTasks.filter(
      (t) => t.assignedToId === activeMember?.id && t.status === 'pending_acceptance'
    ).length;
    const inProgress = teamTasks.filter((t) => t.status === 'in_progress').length;
    const waitingMyReview = teamTasks.filter(
      (t) => t.assignedById === activeMember?.id && t.status === 'in_review'
    ).length;
    const completed = teamTasks.filter((t) => t.status === 'completed').length;

    return { total, pendingMyAcceptance, inProgress, waitingMyReview, completed };
  }, [teamTasks, activeMember]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return teamTasks.filter((t) => {
      // Perspective filter
      if (perspective === 'assigned_to_me' && t.assignedToId !== activeMember?.id) return false;
      if (perspective === 'delegated_by_me' && t.assignedById !== activeMember?.id) return false;
      if (perspective === 'needs_review' && (t.status !== 'in_review' || t.assignedById !== activeMember?.id)) return false;

      // Category filter
      if (selectedCategory !== 'All' && t.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesAssignee = t.assignedToName.toLowerCase().includes(q);
        const matchesAssigner = t.assignedByName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesAssigner) return false;
      }

      return true;
    });
  }, [teamTasks, perspective, selectedCategory, selectedPriority, searchQuery, activeMember]);

  // Tasks grouped by status for Kanban
  const kanbanColumns: { status: TeamTaskStatus; label: string; tasks: TeamTask[] }[] = [
    {
      status: 'pending_acceptance',
      label: 'Pending Acceptance',
      tasks: filteredTasks.filter((t) => t.status === 'pending_acceptance'),
    },
    {
      status: 'in_progress',
      label: 'In Progress',
      tasks: filteredTasks.filter((t) => t.status === 'in_progress'),
    },
    {
      status: 'in_review',
      label: 'In Review',
      tasks: filteredTasks.filter((t) => t.status === 'in_review'),
    },
    {
      status: 'completed',
      label: 'Completed',
      tasks: filteredTasks.filter((t) => t.status === 'completed'),
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Persona Switcher & Primary Actions */}
      <div className="card-neo p-5 sm:p-6 bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  <span>Team Workspace</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Handshake & Sign-off
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Two-way delegation: Assign, explicit acceptance, live progress notes & verified reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Persona Switcher & Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Persona Switcher */}
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Acting as:</span>
              <div className="relative">
                <select
                  value={activeMember?.id || ''}
                  onChange={(e) => setCurrentMemberId(e.target.value)}
                  className="appearance-none bg-transparent pr-7 pl-1 py-1 text-xs sm:text-sm font-bold text-black dark:text-white focus:outline-none cursor-pointer"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id} className="dark:bg-zinc-900 dark:text-white">
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
              </div>
              <div
                className="w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeMember?.avatarColor || '#000000' }}
              >
                {activeMember?.name?.charAt(0) || 'U'}
              </div>
            </div>

            {/* Team Roster Button */}
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Team ({teamMembers.length})</span>
            </button>

            {/* New Task Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Assign Task</span>
            </button>
          </div>
        </div>

        {/* Quick Accountability Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div
            onClick={() => setPerspective('assigned_to_me')}
            className={`cursor-pointer p-3 rounded-xl border transition ${
              stats.pendingMyAcceptance > 0
                ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800'
                : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Needs My Acceptance</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-black dark:text-white mt-1">
              {stats.pendingMyAcceptance}
            </div>
          </div>

          <div
            onClick={() => setPerspective('all')}
            className="cursor-pointer p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">In Progress</span>
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-black dark:text-white mt-1">
              {stats.inProgress}
            </div>
          </div>

          <div
            onClick={() => setPerspective('needs_review')}
            className={`cursor-pointer p-3 rounded-xl border transition ${
              stats.waitingMyReview > 0
                ? 'bg-purple-500/10 border-purple-300 dark:border-purple-800'
                : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Waiting My Review</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-black text-black dark:text-white mt-1">
              {stats.waitingMyReview}
            </div>
          </div>

          <div
            onClick={() => setPerspective('all')}
            className="cursor-pointer p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Verified & Done</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-black dark:text-white mt-1">
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Perspectives, Filters, Search & View Toggle */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Perspective Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setPerspective('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              perspective === 'all'
                ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            All Tasks ({teamTasks.length})
          </button>
          <button
            onClick={() => setPerspective('assigned_to_me')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              perspective === 'assigned_to_me'
                ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Assigned to Me</span>
            {stats.pendingMyAcceptance > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {stats.pendingMyAcceptance}
              </span>
            )}
          </button>
          <button
            onClick={() => setPerspective('delegated_by_me')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              perspective === 'delegated_by_me'
                ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Delegated by Me
          </button>
          <button
            onClick={() => setPerspective('needs_review')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              perspective === 'needs_review'
                ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <span>Needs My Review</span>
            {stats.waitingMyReview > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center font-bold">
                {stats.waitingMyReview}
              </span>
            )}
          </button>
        </div>

        {/* Search, Category, Priority & Layout Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-48 min-w-[140px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or members..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 pr-6 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 pr-6 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban Board"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const Icon = STATUS_CONFIG[col.status].icon;
            return (
              <div
                key={col.status}
                className="bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col min-h-[480px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <h3 className="font-extrabold text-xs sm:text-sm text-black dark:text-white tracking-tight">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {col.tasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-0.5">
                  {col.tasks.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 dark:text-zinc-600 text-xs font-medium">
                      No tasks in this stage
                    </div>
                  ) : (
                    col.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        activeMemberId={activeMember?.id}
                        onOpenModal={() => setSelectedTaskId(task.id)}
                        onAccept={(msg) => acceptTeamTask(task.id, msg)}
                        onDecline={(reason) => declineTeamTask(task.id, reason)}
                        onSubmitReview={(notes) => submitTaskForReview(task.id, notes)}
                        onApprove={(feedback) => approveTeamTask(task.id, feedback)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="card-neo bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              No tasks match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Assigner</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredTasks.map((task) => {
                    const priorityMeta = PRIORITY_CONFIG[task.priority];
                    const isAssignee = task.assignedToId === activeMember?.id;
                    const isAssigner = task.assignedById === activeMember?.id;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-black dark:text-white line-clamp-1">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                              {task.category}
                            </span>
                            {task.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due {task.dueDate}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                          {task.assignedToName} {isAssignee && <span className="text-[10px] text-zinc-400">(You)</span>}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">
                          {task.assignedByName} {isAssigner && <span className="text-[10px] text-zinc-400">(You)</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                            {priorityMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300 capitalize">
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 w-32">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-black dark:bg-white rounded-full transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-zinc-500">
                              {task.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaskId(task.id);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE TASK ================= */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          teamMembers={teamMembers}
          activeMember={activeMember}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(taskData) => {
            createTeamTask(taskData);
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* ================= MODAL: MANAGE TEAM ================= */}
      {isTeamModalOpen && (
        <ManageTeamModal
          isOpen={isTeamModalOpen}
          teamMembers={teamMembers}
          activeMemberId={activeMember?.id}
          onClose={() => setIsTeamModalOpen(false)}
          onAddMember={addTeamMember}
          onDeleteMember={deleteTeamMember}
          onSelectPersona={(id) => {
            setCurrentMemberId(id);
            setIsTeamModalOpen(false);
          }}
        />
      )}

      {/* ================= MODAL: TASK DETAIL & TIMELINE ================= */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          activeMemberId={activeMember?.id}
          onClose={() => setSelectedTaskId(null)}
          onAccept={(msg) => acceptTeamTask(selectedTask.id, msg)}
          onDecline={(reason) => declineTeamTask(selectedTask.id, reason)}
          onUpdateProgress={(p, note) => updateTaskProgress(selectedTask.id, p, note)}
          onSubmitReview={(notes) => submitTaskForReview(selectedTask.id, notes)}
          onApprove={(feedback) => approveTeamTask(selectedTask.id, feedback)}
          onReopen={(feedback) => reopenTeamTask(selectedTask.id, feedback)}
          onDelete={() => {
            deleteTeamTask(selectedTask.id);
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
};

/* =========================================================================
   TASK CARD COMPONENT (Kanban Column Card)
   ========================================================================= */
interface TaskCardProps {
  task: TeamTask;
  activeMemberId?: string;
  onOpenModal: () => void;
  onAccept: (msg?: string) => void;
  onDecline: (reason: string) => void;
  onSubmitReview: (notes?: string) => void;
  onApprove: (feedback?: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  activeMemberId,
  onOpenModal,
  onAccept,
  onDecline,
  onSubmitReview,
  onApprove,
}) => {
  const priorityMeta = PRIORITY_CONFIG[task.priority];
  const isAssignee = task.assignedToId === activeMemberId;
  const isAssigner = task.assignedById === activeMemberId;

  // Latest update note
  const latestUpdate = task.updates[task.updates.length - 1];

  return (
    <div
      onClick={onOpenModal}
      className="card-neo p-4 bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-black dark:hover:border-white transition-all cursor-pointer group"
    >
      {/* Badges: Priority + Category */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
          {priorityMeta.label}
        </span>

        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md">
          {task.category}
        </span>
      </div>

      {/* Task Title */}
      <h4 className="font-extrabold text-sm text-black dark:text-white line-clamp-2 leading-snug group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
        {task.title}
      </h4>

      {/* Description Excerpt */}
      {task.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Delegation Handshake Info */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-850 text-[11px]">
        {/* Assigner */}
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span className="text-[10px] uppercase font-bold text-zinc-400">By</span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {task.assignedByName}
          </span>
        </div>

        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />

        {/* Assignee */}
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span className="text-[10px] uppercase font-bold text-zinc-400">To</span>
          <span
            className={`font-bold ${
              isAssignee
                ? 'text-black dark:text-white underline decoration-zinc-400'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {task.assignedToName} {isAssignee && '(You)'}
          </span>
        </div>
      </div>

      {/* Progress Bar (if in progress or in review) */}
      {task.status !== 'pending_acceptance' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1">
            <span>Progress</span>
            <span className="font-mono text-black dark:text-white">{task.progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                task.status === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-black dark:bg-white'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Latest note log snippet */}
      {latestUpdate && (
        <div className="mt-2.5 bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
          <MessageSquare className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1 italic">
            "{latestUpdate.message}"
          </span>
        </div>
      )}

      {/* Quick Action Handshake Buttons Right on Card */}
      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between gap-2">
        {/* Due date if exists */}
        {task.dueDate ? (
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
            <Calendar className="w-3 h-3" />
            <span>{task.dueDate}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Handshake actions */}
        {task.status === 'pending_acceptance' && isAssignee && (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDecline('Declined by assignee')}
              className="px-2 py-1 rounded-md text-[10px] font-bold text-zinc-500 hover:text-red-500 transition"
            >
              Decline
            </button>
            <button
              onClick={() => onAccept()}
              className="px-2.5 py-1 rounded-md text-[10px] font-black bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition flex items-center gap-1"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Accept Task</span>
            </button>
          </div>
        )}

        {task.status === 'pending_acceptance' && !isAssignee && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Waiting for {task.assignedToName}</span>
          </span>
        )}

        {task.status === 'in_progress' && isAssignee && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSubmitReview();
            }}
            className="px-2.5 py-1 rounded-md text-[10px] font-black bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black hover:opacity-90 transition flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>Submit for Review</span>
          </button>
        )}

        {task.status === 'in_review' && isAssigner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-600 text-white hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Approve +50 XP</span>
          </button>
        )}

        {task.status === 'completed' && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Signed Off</span>
          </span>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   TASK DETAIL & TIMELINE MODAL
   ========================================================================= */
interface TaskDetailModalProps {
  task: TeamTask;
  activeMemberId?: string;
  onClose: () => void;
  onAccept: (msg?: string) => void;
  onDecline: (reason: string) => void;
  onUpdateProgress: (progress: number, note?: string) => void;
  onSubmitReview: (notes?: string) => void;
  onApprove: (feedback?: string) => void;
  onReopen: (feedback: string) => void;
  onDelete: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  activeMemberId,
  onClose,
  onAccept,
  onDecline,
  onUpdateProgress,
  onSubmitReview,
  onApprove,
  onReopen,
  onDelete,
}) => {
  const isAssignee = task.assignedToId === activeMemberId;
  const isAssigner = task.assignedById === activeMemberId;
  const priorityMeta = PRIORITY_CONFIG[task.priority];

  // Local state for interactive actions
  const [newProgress, setNewProgress] = useState(task.progress);
  const [updateNote, setUpdateNote] = useState('');
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateNote.trim() && newProgress === task.progress) return;
    onUpdateProgress(newProgress, updateNote.trim());
    setUpdateNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-850 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                {priorityMeta.label} Priority
              </span>
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                {task.category}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 capitalize">
                Status: {task.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-black dark:text-white leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Delegation Handshake Bar */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Assigned By
              </span>
              <div className="font-extrabold text-sm text-black dark:text-white mt-1">
                {task.assignedByName} {isAssigner && <span className="text-xs font-normal text-zinc-400">(You)</span>}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Assigned To
              </span>
              <div className="font-extrabold text-sm text-black dark:text-white mt-1">
                {task.assignedToName} {isAssignee && <span className="text-xs font-normal text-zinc-400">(You)</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider mb-1.5">
                Description / Scope of Work
              </h4>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                {task.description}
              </p>
            </div>
          )}

          {/* Handshake Phase 1: Pending Acceptance Actions */}
          {task.status === 'pending_acceptance' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                <Clock className="w-4 h-4" />
                <span>Waiting for Handshake Acceptance</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isAssignee
                  ? `${task.assignedByName} has delegated this task to you. Review the scope above and accept to start working, or decline with a reason.`
                  : `You assigned this task to ${task.assignedToName}. They must accept it before beginning progress.`}
              </p>

              {isAssignee && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onAccept()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Accept & Begin Working (+20 XP)</span>
                  </button>

                  <button
                    onClick={() => setShowDeclineInput(!showDeclineInput)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-red-600 transition"
                  >
                    Decline Task
                  </button>
                </div>
              )}

              {showDeclineInput && (
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Reason for declining (e.g., bandwidth, missing specs)..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (declineReason.trim()) onDecline(declineReason.trim());
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white"
                  >
                    Confirm Decline
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Handshake Phase 2: In Progress & Update Posting */}
          {task.status === 'in_progress' && (
            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>Update Work Progress</span>
                </span>
                <span className="font-mono font-extrabold text-sm text-black dark:text-white">
                  {newProgress}%
                </span>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                disabled={!isAssignee && !isAssigner}
                className="w-full accent-black dark:accent-white cursor-pointer"
              />

              {/* Quick Update Note Input */}
              <form onSubmit={handlePostUpdate} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="Post a progress update note (e.g. Completed initial mockups, running test suite)..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white transition"
                  >
                    Save Progress
                  </button>
                </div>
              </form>

              {/* Submit for Review Action for Assignee */}
              {isAssignee && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-zinc-500">
                    Finished all items? Submit to {task.assignedByName} for sign-off:
                  </span>
                  <button
                    onClick={() => onSubmitReview(updateNote || undefined)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review (100%)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Handshake Phase 3: In Review Verification */}
          {task.status === 'in_review' && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Work Submitted for Verification</span>
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300">
                {isAssigner
                  ? `${task.assignedToName} has finished this task and is requesting your review. Verify the outcome and approve to complete the delegation handshake!`
                  : `You submitted this task for review. Waiting for ${task.assignedByName} to verify and approve.`}
              </p>

              {isAssigner && (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={approvalFeedback}
                    onChange={(e) => setApprovalFeedback(e.target.value)}
                    placeholder="Feedback / Sign-off note (optional)..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-black border border-purple-200 dark:border-purple-800 text-black dark:text-white"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onApprove(approvalFeedback)}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-500 transition flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Sign Off (+50 XP Team Reward)</span>
                    </button>

                    <button
                      onClick={() => setShowReopenInput(!showReopenInput)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition"
                    >
                      Request Changes
                    </button>
                  </div>

                  {showReopenInput && (
                    <div className="pt-2 space-y-2">
                      <input
                        type="text"
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="Explain required changes before approval..."
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                      />
                      <button
                        onClick={() => {
                          if (reopenReason.trim()) onReopen(reopenReason.trim());
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white"
                      >
                        Send Back to In Progress
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Handshake Phase 4: Completed Banner */}
          {task.status === 'completed' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300">
                  Task Completed & Verified
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Verified and signed off by {task.assignedByName}.
                </div>
              </div>
            </div>
          )}

          {/* Complete Activity Timeline / Audit Trail */}
          <div>
            <h4 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Two-Way Handshake Timeline ({task.updates.length})</span>
            </h4>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {task.updates.map((update) => (
                <div key={update.id} className="relative flex items-start gap-3 pl-1">
                  <div className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[10px] font-black z-10 shrink-0">
                    {update.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-black dark:text-white">
                        {update.authorName}
                      </span>
                      <span className="text-zinc-400 text-[10px]">
                        {new Date(update.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {update.message}
                    </p>
                    {update.progressPercent !== undefined && (
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold text-zinc-400">
                        Progress recorded: {update.progressPercent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   CREATE TASK MODAL
   ========================================================================= */
interface CreateTaskModalProps {
  isOpen: boolean;
  teamMembers: TeamMember[];
  activeMember?: TeamMember;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description?: string;
    category: string;
    priority: TaskPriority;
    assignedById: string;
    assignedByName: string;
    assignedToId: string;
    assignedToName: string;
    dueDate?: string;
  }) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  teamMembers,
  activeMember,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedById, setAssignedById] = useState(activeMember?.id || teamMembers[0]?.id || '');
  const [assignedToId, setAssignedToId] = useState(
    teamMembers.find((m) => m.id !== activeMember?.id)?.id || teamMembers[0]?.id || ''
  );
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assigner = teamMembers.find((m) => m.id === assignedById) || activeMember;
    const assignee = teamMembers.find((m) => m.id === assignedToId) || teamMembers[0];

    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      assignedById: assigner?.id || 'tm-alex',
      assignedByName: assigner?.name || 'Alex',
      assignedToId: assignee?.id || 'tm-rohan',
      assignedToName: assignee?.name || 'Rohan',
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-black dark:text-white" />
            <h2 className="font-black text-base sm:text-lg text-black dark:text-white">
              Assign New Team Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Webhook retry system"
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs sm:text-sm focus:outline-none focus:border-black dark:focus:border-white font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done? Include links, specs, or definitions of done..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          {/* Delegation Handshake: Assigner & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Assigned By
              </label>
              <select
                value={assignedById}
                onChange={(e) => setAssignedById(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-semibold focus:outline-none"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Assign To *
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-semibold focus:outline-none"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category, Priority & Due Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-semibold focus:outline-none text-xs"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white font-semibold focus:outline-none text-xs"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition shadow-sm"
            >
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   MANAGE TEAM ROSTER MODAL
   ========================================================================= */
interface ManageTeamModalProps {
  isOpen: boolean;
  teamMembers: TeamMember[];
  activeMemberId?: string;
  onClose: () => void;
  onAddMember: (member: Omit<TeamMember, 'id'>) => void;
  onDeleteMember: (id: string) => void;
  onSelectPersona: (id: string) => void;
}

const AVATAR_COLORS = [
  '#000000',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#059669',
  '#d97706',
  '#ea580c',
  '#4b5563',
];

const ManageTeamModal: React.FC<ManageTeamModalProps> = ({
  teamMembers,
  activeMemberId,
  onClose,
  onAddMember,
  onDeleteMember,
  onSelectPersona,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    onAddMember({ name: name.trim(), role: role.trim(), avatarColor });
    setName('');
    setRole('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black dark:text-white" />
            <div>
              <h2 className="font-black text-base sm:text-lg text-black dark:text-white">
                Team Roster & Personas
              </h2>
              <p className="text-xs text-zinc-500">
                Click any member to switch active persona or assign tasks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Members List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          <div className="space-y-2">
            {teamMembers.map((m) => {
              const isActive = m.id === activeMemberId;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800/80 border-black dark:border-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-black dark:text-white flex items-center gap-2">
                        <span>{m.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-black text-white dark:bg-white dark:text-black">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">{m.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => onSelectPersona(m.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        Switch
                      </button>
                    )}
                    {teamMembers.length > 1 && (
                      <button
                        onClick={() => onDeleteMember(m.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Member Section */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </h4>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name (e.g. Maya)"
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Role (e.g. QA / DevOps)"
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs focus:outline-none"
                />
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-semibold">Avatar Color:</span>
                <div className="flex items-center gap-1.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-black dark:ring-white' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition text-xs"
              >
                + Add Member to Workspace
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-black dark:text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
