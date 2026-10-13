import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const { exportData, importData, resetToDefaults } = useHabits();
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleReset = () => {
    if (confirm('Reset your habits back to the curated starter routines?')) {
      resetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Data Management & Backup</h2>
            <p className="text-xs text-slate-400">Export your routines or restore from a JSON file</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
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
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Export Backup
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download .JSON File</span>
              </button>
              <button
                onClick={handleCopy}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Restore / Import Backup
            </h3>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">
                Upload Backup File (.json)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">
                Or Paste JSON directly:
              </label>
              <textarea
                rows={3}
                placeholder="Paste exported JSON here..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleImportSubmit}
              disabled={!importJson.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Apply Backup</span>
            </button>
          </div>

          {/* Reset Demo Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300">Starter Demo Data</h4>
                <p className="text-[11px] text-slate-500">Restore the curated habit routines and history</p>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
