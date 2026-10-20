import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  Link2,
  FileText,
  Bookmark,
  Calendar,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import type { IdeaItem } from '../types/habit';

const CATEGORY_SUGGESTIONS = ['Productivity', 'Tech', 'Business', 'Design', 'Content', 'Health', 'Learning'];

export const IdeasView: React.FC = () => {
  const { ideas, addIdea, updateIdea, deleteIdea, togglePinIdea } = useHabits();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState('');
  const [category, setCategory] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available categories extracted from existing ideas
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    ideas.forEach((i) => {
      if (i.category && i.category.trim()) cats.add(i.category.trim());
    });
    return Array.from(cats);
  }, [ideas]);

  // Filter and sort ideas (Pinned first, then newest first)
  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((item) => {
        if (onlyPinned && !item.pinned) return false;
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchRes = (item.resources || '').toLowerCase().includes(q);
          const matchCat = (item.category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchRes && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [ideas, search, selectedCategory, onlyPinned]);

  const openCreateModal = () => {
    setEditingIdea(null);
    setTitle('');
    setDescription('');
    setResources('');
    setCategory('');
    setIsPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setTitle(idea.title);
    setDescription(idea.description);
    setResources(idea.resources);
    setCategory(idea.category || '');
    setIsPinned(Boolean(idea.pinned));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIdea(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingIdea) {
      updateIdea(editingIdea.id, {
        title: title.trim(),
        description: description.trim(),
        resources: resources.trim(),
        category: category.trim() || undefined,
        pinned: isPinned,
      });
    } else {
      addIdea({
        title: title.trim(),
        description: description.trim(),
        resources: resources.trim(),
        category: category.trim() || undefined,
        pinned: isPinned,
      });
    }

    closeModal();
  };

  const handleCopyResources = (id: string, text: string) => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse individual resource items (split by lines or commas)
  const parseResourceTokens = (res: string) => {
    if (!res) return [];
    return res
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const isUrl = (str: string) => {
    return /^https?:\/\//i.test(str) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(str);
  };

  const formatUrl = (str: string) => {
    return /^https?:\/\//i.test(str) ? str : `https://${str}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl card-neo flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
              <Lightbulb className="w-3 h-3 fill-current" />
              <span>Ideas Vault</span>
            </span>
            <span className="text-xs text-zinc-500 font-semibold">• {ideas.length} saved</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            Capture & Cultivate Ideas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Save your concepts, creative sparks, notes, and references in one dedicated place.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold transition shadow-sm hover:opacity-85 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Capture New Idea</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas, resources, descriptions..."
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-9 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setOnlyPinned((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
              onlyPinned
                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-current' : ''}`} />
            <span>Pinned</span>
          </button>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
              selectedCategory === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
            }`}
          >
            All
          </button>

          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                  : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="p-10 sm:p-16 rounded-3xl card-neo text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Lightbulb className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-white">
              {search || selectedCategory !== 'all' || onlyPinned
                ? 'No ideas match your filters'
                : 'Your Ideas Vault is empty'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
              {search || selectedCategory !== 'all' || onlyPinned
                ? 'Try clearing your search keyword or switching category filters.'
                : 'Capture your thoughts, side projects, app ideas, and references before they slip away.'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold transition shadow-sm hover:opacity-85 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Capture First Idea</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredIdeas.map((idea) => {
            const resourceTokens = parseResourceTokens(idea.resources);

            return (
              <div
                key={idea.id}
                className={`group relative rounded-3xl p-5 sm:p-6 card-neo flex flex-col justify-between transition-all hover:shadow-md ${
                  idea.pinned ? 'border-zinc-400 dark:border-zinc-600' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Category Pill & Pin/Edit/Delete actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {idea.category ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 truncate">
                          {idea.category}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Idea</span>
                        </span>
                      )}

                      {idea.pinned && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 dark:text-amber-400">
                          <Bookmark className="w-3 h-3 fill-current" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinIdea(idea.id)}
                        title={idea.pinned ? 'Unpin idea' : 'Pin idea to top'}
                        className={`p-1.5 rounded-lg transition ${
                          idea.pinned
                            ? 'text-black dark:text-white bg-zinc-100 dark:bg-zinc-800'
                            : 'text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${idea.pinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => openEditModal(idea)}
                        title="Edit idea"
                        className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteIdea(idea.id)}
                        title="Delete idea"
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Idea Title */}
                  <h3 className="font-bold text-base sm:text-lg text-black dark:text-white tracking-tight leading-snug">
                    {idea.title}
                  </h3>

                  {/* Description */}
                  {idea.description && (
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-2 whitespace-pre-line leading-relaxed">
                      {idea.description}
                    </p>
                  )}

                  {/* Resources Section */}
                  {resourceTokens.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          <span>Resources & References ({resourceTokens.length})</span>
                        </span>
                        <button
                          onClick={() => handleCopyResources(idea.id, idea.resources)}
                          className="hover:text-black dark:hover:text-white flex items-center gap-1 transition"
                          title="Copy resources to clipboard"
                        >
                          {copiedId === idea.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {resourceTokens.map((token, idx) => {
                          const validUrl = isUrl(token);

                          if (validUrl) {
                            return (
                              <a
                                key={idx}
                                href={formatUrl(token)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition border border-zinc-200 dark:border-zinc-800 max-w-[240px] truncate"
                              >
                                <span className="truncate">{token.replace(/^https?:\/\//i, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                              </a>
                            );
                          }

                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                            >
                              {token}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Timestamp */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(idea.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {idea.updatedAt && (
                    <span className="text-[9px] opacity-70">
                      Edited {new Date(idea.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Idea Capture / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-black z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white tracking-tight">
                    {editingIdea ? 'Edit Idea' : 'Capture New Idea'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {editingIdea ? 'Update your concept and references' : 'Store your idea and helpful resources'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 -mr-1 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition shrink-0"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Habit Coach Agent"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Description / Details
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this idea about? Key features, execution steps, target audience, thoughts..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition resize-none"
                />
              </div>

              {/* Resources */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Resources (Links, URLs, References)
                </label>
                <textarea
                  rows={3}
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                  placeholder="Enter links, GitHub repos, articles, or books (separate by line or comma):&#10;https://github.com/my-project&#10;https://docs.clerk.com&#10;Figma Prototype link"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition resize-none font-mono"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">
                  💡 URLs starting with http:// or https:// will be rendered as one-click openable links.
                </span>
              </div>

              {/* Category & Pin Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Tech, Business"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
                  />
                  {/* Category quick chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        +{cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Priority Pin
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPinned((prev) => !prev)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                      isPinned
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                    <span>{isPinned ? 'Pinned to Top' : 'Not Pinned'}</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-85 active:scale-95 transition shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{editingIdea ? 'Save Changes' : 'Save Idea'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
