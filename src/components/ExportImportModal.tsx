import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const {
    exportData,
    importData,
    resetToDefaults,
    user,
    resetDeleteConfirmPreference,
  } = useHabits();

  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPromptPrefMsg, setResetPromptPrefMsg] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitpulse-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const jsonStr = exportData();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = () => {
    if (!importJson.trim()) return;
    const success = importData(importJson);
    if (success) {
      setStatusMessage({ type: 'success', text: 'Backup imported successfully!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: 'Invalid JSON backup format. Please check and try again.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJson(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
    onClose();
  };

  const handleRestoreDeletePrompts = () => {
    resetDeleteConfirmPreference();
    setResetPromptPrefMsg(true);
    setTimeout(() => setResetPromptPrefMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col glow-white-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Data Management & Preferences</h2>
            <p className="text-xs text-zinc-400">Export routines, restore backups, or manage safety preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pt-4">
          {/* Status message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Delete Prompt Preference Section */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Habit Deletion Confirmations</h4>
                <p className="text-[10px] text-zinc-400">
                  {user.skipDeleteConfirm
                    ? 'Currently set to: Delete immediately without confirmation'
                    : 'Currently set to: Always ask for confirmation before deleting'}
                </p>
              </div>
            </div>

            {user.skipDeleteConfirm && (
              <button
                onClick={handleRestoreDeletePrompts}
                className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition shadow-sm shrink-0"
              >
                {resetPromptPrefMsg ? 'Re-enabled!' : 'Re-enable Prompts'}
              </button>
            )}
          </div>

          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Export Backup
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-white hover:text-zinc-950 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/10 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download .JSON</span>
              </button>
              <button
                onClick={handleCopy}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-white hover:text-zinc-950 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/10 transition-all duration-200"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Restore / Import Backup
            </h3>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                Upload Backup File (.json)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5 font-medium">
                Or Paste JSON directly:
              </label>
              <textarea
                rows={3}
                placeholder="Paste exported JSON here..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20"
              />
            </div>

            <button
              onClick={handleImportSubmit}
              disabled={!importJson.trim()}
              className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-40 shadow-md shadow-white/10 transition active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Apply Backup</span>
            </button>
          </div>

          {/* Reset Demo Section */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-zinc-300">Starter Demo Data</h4>
                <p className="text-[11px] text-zinc-500">Restore the curated habit routines and history</p>
              </div>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
                  >
                    Confirm Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
