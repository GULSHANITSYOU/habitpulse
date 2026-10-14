import React, { useState, useMemo } from 'react';
import {
  Plus,
  Star,
  Check,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Search,
  ListTodo,
  Calendar,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import type { TodoItem } from '../types/habit';

export const TodosView: React.FC = () => {
  const {
    todos,
    addTodo,
    toggleTodo,
    toggleTodoImportant,
    updateTodo,
    deleteTodo,
    reorderTodos,
    clearCompletedTodos,
  } = useHabits();

  // Local UI states
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'important' | 'pending' | 'completed'>('all');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Separate active and completed todos
  const { activeTodos, completedTodos } = useMemo(() => {
    // Filter by search query if present
    const filtered = todos.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
    });

    // Active tasks: important tasks are grouped at the top, then sorted by manual order
    const active = filtered
      .filter((t) => !t.completed)
      .sort((a, b) => {
        if (a.important !== b.important) {
          return a.important ? -1 : 1; // Starred tasks always on top
        }
        return a.order - b.order;
      });

    // Completed tasks: sorted by most recently completed
    const completed = filtered
      .filter((t) => t.completed)
      .sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      });

    return { activeTodos: active, completedTodos: completed };
  }, [todos, searchQuery]);

  // Handle adding new task
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    addTodo(
      newTitle.trim(),
      newNotes.trim() || undefined,
      isImportant,
      newDueDate || undefined
    );

    setNewTitle('');
    setNewNotes('');
    setIsImportant(false);
    setNewDueDate('');
    setShowNotesInput(false);
  };

  // Start editing task title
  const handleStartEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  // Save task title edit
  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      updateTodo(id, { title: editingTitle.trim() });
    }
    setEditingId(null);
  };

  // Move task up or down within its group
  const handleMoveStep = (id: string, direction: 'up' | 'down') => {
    const list = [...activeTodos];
    const currentIndex = list.findIndex((t) => t.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const currentItem = list[currentIndex];
    const targetItem = list[targetIndex];

    // If moving across important vs non-important boundary, adopt target's importance
    if (currentItem.important !== targetItem.important) {
      currentItem.important = targetItem.important;
    }

    // Swap positions
    list[currentIndex] = targetItem;
    list[targetIndex] = currentItem;

    // Apply new order to the full todos list
    const otherTodos = todos.filter((t) => t.completed || !list.some((l) => l.id === t.id));
    reorderTodos([...list, ...otherTodos]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const list = [...activeTodos];
    const sourceIndex = list.findIndex((t) => t.id === draggedId);
    const targetIndex = list.findIndex((t) => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Remove source and insert at target
    const [movedItem] = list.splice(sourceIndex, 1);
    const targetItem = list[targetIndex];

    // Align importance with target region
    if (targetItem) {
      movedItem.important = targetItem.important;
    }

    list.splice(targetIndex, 0, movedItem);

    // Apply new order to active todos
    const otherTodos = todos.filter((t) => t.completed || !list.some((l) => l.id === t.id));
    reorderTodos([...list, ...otherTodos]);

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Display filtered list
  const displayActive = filterMode === 'completed' ? [] : (
    filterMode === 'important' ? activeTodos.filter((t) => t.important) : activeTodos
  );

  const displayCompleted = filterMode === 'important' ? [] : (
    filterMode === 'pending' ? [] : completedTodos
  );

  const starredCount = activeTodos.filter((t) => t.important).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="card-neo rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-black dark:text-white" />
              <h2 className="text-lg font-bold text-black dark:text-white tracking-tight">
                Task Manager & To-Dos
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
                {activeTodos.length} Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Organize your actionable to-dos, star important tasks to the top, and drag to prioritize.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {starredCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black dark:text-white"
                title={`${starredCount} high priority tasks`}
              >
                <Star className="w-3.5 h-3.5 fill-black text-black dark:fill-white dark:text-white" />
                <span>{starredCount} Starred</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedTodos.length} Done</span>
            </div>
          </div>
        </div>

        {/* Add Task Input Bar */}
        <form onSubmit={handleAddTask} className="mt-5 space-y-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 transition focus-within:border-black dark:focus-within:border-white shadow-xs">
            {/* Star toggle button */}
            <button
              type="button"
              onClick={() => setIsImportant(!isImportant)}
              className={`p-2 rounded-xl transition ${
                isImportant
                  ? 'text-black dark:text-white bg-zinc-200 dark:bg-zinc-800'
                  : 'text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
              title={isImportant ? 'Marked as Important (will place on top)' : 'Mark as Important'}
            >
              <Star
                className={`w-4 h-4 ${
                  isImportant
                    ? 'fill-black text-black dark:fill-white dark:text-white'
                    : ''
                }`}
              />
            </button>

            {/* Task Title Input */}
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new task or to-do... (e.g. Prepare presentation, Submit invoice)"
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none"
            />

            {/* Due Date picker button */}
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="hidden sm:block text-xs text-zinc-500 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 focus:outline-none"
              title="Optional due date"
            />

            {/* Add button */}
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-40 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Optional notes expandable toggle */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-black dark:hover:text-white transition"
            >
              {showNotesInput ? '- Hide task details' : '+ Add notes / sub-details'}
            </button>

            {isImportant && (
              <span className="text-[11px] font-bold text-black dark:text-white flex items-center gap-1">
                <Star className="w-3 h-3 fill-black text-black dark:fill-white dark:text-white" />
                Will be prioritized at top of list
              </span>
            )}
          </div>

          {showNotesInput && (
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional notes, context or link..."
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
            />
          )}
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: 'all', label: `All (${activeTodos.length})` },
              { id: 'important', label: `Starred ⭐ (${starredCount})` },
              { id: 'pending', label: `Active (${activeTodos.length})` },
              { id: 'completed', label: `Completed (${completedTodos.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterMode === tab.id
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
          />
        </div>
      </div>

      {/* ACTIVE TASKS SECTION (WITH DRAG & DROP & STAR PRIORITY) */}
      <div className="space-y-2">
        {displayActive.length === 0 && filterMode !== 'completed' ? (
          <div className="card-neo rounded-2xl p-8 sm:p-10 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-black dark:text-white">
                {searchQuery
                  ? 'No tasks match your search'
                  : filterMode === 'important'
                  ? 'No starred tasks'
                  : 'All caught up! No active tasks.'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
                {filterMode === 'important'
                  ? 'Star tasks you want to stay pinned at the top of your priority list.'
                  : 'Add a new to-do above to keep your daily focus organized.'}
              </p>
            </div>
          </div>
        ) : (
          displayActive.map((todo, index) => {
            const isDraggingThis = draggedId === todo.id;
            const isDragOverThis = dragOverId === todo.id;

            return (
              <div
                key={todo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, todo.id)}
                onDragOver={(e) => handleDragOver(e, todo.id)}
                onDrop={(e) => handleDrop(e, todo.id)}
                onDragEnd={handleDragEnd}
                className={`card-neo rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all duration-150 select-none ${
                  isDraggingThis ? 'opacity-40 scale-[0.99] border-dashed border-zinc-400' : ''
                } ${
                  isDragOverThis ? 'border-black dark:border-white shadow-md' : ''
                } ${
                  todo.important
                    ? 'border-l-4 border-l-black dark:border-l-white bg-zinc-50/60 dark:bg-zinc-900/60'
                    : ''
                }`}
              >
                {/* Left controls: Drag Handle, Checkbox, Star */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                  {/* Drag Handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-600 hover:text-black dark:hover:text-white transition shrink-0 p-1"
                    title="Drag to rearrange order"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Checkbox (Click moves to completed) */}
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className="w-5 h-5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white flex items-center justify-center transition shrink-0 group bg-white dark:bg-zinc-900 shadow-xs"
                    title="Mark task completed"
                  >
                    <div className="w-2.5 h-2.5 rounded-sm bg-transparent group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition" />
                  </button>

                  {/* Star Button */}
                  <button
                    type="button"
                    onClick={() => toggleTodoImportant(todo.id)}
                    className={`p-1 rounded-lg transition shrink-0 ${
                      todo.important
                        ? 'text-black dark:text-white'
                        : 'text-zinc-300 dark:text-zinc-600 hover:text-black dark:hover:text-white'
                    }`}
                    title={todo.important ? 'Unstar task' : 'Star as Important (moves to top)'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        todo.important
                          ? 'fill-black text-black dark:fill-white dark:text-white'
                          : ''
                      }`}
                    />
                  </button>

                  {/* Title & Notes */}
                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(todo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(todo.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full bg-transparent border-b border-black dark:border-white text-xs sm:text-sm font-semibold text-black dark:text-white focus:outline-none"
                      />
                    ) : (
                      <div
                        onClick={() => handleStartEdit(todo)}
                        className="cursor-pointer"
                        title="Click to edit"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-black dark:text-white tracking-tight break-words">
                            {todo.title}
                          </span>
                          {todo.important && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-black text-white dark:bg-white dark:text-black shrink-0">
                              Top Priority
                            </span>
                          )}
                        </div>

                        {todo.notes && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                            {todo.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right controls: Due Date & Actions */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {todo.dueDate && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      {todo.dueDate}
                    </span>
                  )}

                  {/* Reorder Buttons (For Mobile or Click Reordering) */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveStep(todo.id, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(todo.id, 'down')}
                      disabled={index === displayActive.length - 1}
                      className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPLETED TASKS SECTION */}
      {completedTodos.length > 0 && filterMode !== 'pending' && (
        <div className="pt-4 space-y-3">
          {/* Completed Header Toggle */}
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition"
            >
              {isCompletedExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
              <span>Completed ({completedTodos.length})</span>
            </button>

            <button
              type="button"
              onClick={clearCompletedTodos}
              className="text-xs text-zinc-400 hover:text-black dark:hover:text-white transition font-medium"
            >
              Clear completed
            </button>
          </div>

          {/* Completed Task Cards */}
          {isCompletedExpanded && (
            <div className="space-y-2 animate-in fade-in duration-200">
              {displayCompleted.map((todo) => (
                <div
                  key={todo.id}
                  className="card-neo rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 opacity-60 hover:opacity-100 transition-opacity bg-zinc-50/50 dark:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Checked checkbox (Click restores to active) */}
                    <button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      className="w-5 h-5 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center transition shrink-0 shadow-xs"
                      title="Click to restore task to active"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Star status if was starred */}
                    {todo.important && (
                      <Star className="w-3.5 h-3.5 fill-zinc-400 text-zinc-400 dark:fill-zinc-600 dark:text-zinc-600 shrink-0" />
                    )}

                    {/* Title with strike-through */}
                    <div className="flex-1 min-w-0">
                      <span className="line-through font-medium text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate block">
                        {todo.title}
                      </span>
                      {todo.notes && (
                        <p className="line-through text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                          {todo.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition shrink-0"
                    title="Delete completed task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
