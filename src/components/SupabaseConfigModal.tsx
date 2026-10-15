import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getSupabaseCredentials,
  saveCustomSupabaseConfig,
  getSupabaseClient,
} from '../lib/supabase';
import { getRazorpayKey, saveCustomRazorpayKey } from '../lib/razorpay';

export const SupabaseConfigModal: React.FC = () => {
  const { isConfigModalOpen, closeConfigModal } = useAuth();

  const creds = getSupabaseCredentials();
  const currentRzpKey = getRazorpayKey();

  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey);
  const [razorpayKey, setRazorpayKey] = useState(currentRzpKey);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isConfigModalOpen) return null;

  const handleSave = () => {
    saveCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
    saveCustomRazorpayKey(razorpayKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeConfigModal();
      window.location.reload();
    }, 1200);
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both Project URL and Anon Key before testing.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      saveCustomSupabaseConfig(supabaseUrl, supabaseAnonKey);
      const client = getSupabaseClient();
      if (!client) {
        setTestResult({ success: false, message: 'Invalid URL format' });
        return;
      }

      const { error } = await client.auth.getSession();
      if (error && error.message.includes('FetchError')) {
        setTestResult({ success: false, message: 'Connection failed: could not reach Supabase endpoint.' });
      } else {
        setTestResult({
          success: true,
          message: 'Connection successful! Supabase API is responding.',
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-black dark:text-white tracking-tight">
                Database & Payment Keys
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Configure your Supabase Cloud & Razorpay API credentials
              </p>
            </div>
          </div>
          <button
            onClick={closeConfigModal}
            className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white text-xs font-bold text-black dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Credentials saved! Reloading app to apply...</span>
          </div>
        )}

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              testResult.success
                ? 'bg-zinc-100 dark:bg-zinc-900 border-black dark:border-white text-black dark:text-white'
                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-400 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Info card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-black dark:text-white">
            <span>Your Project Info</span>
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] underline text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white"
            >
              <span>Supabase API Settings</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            In your Supabase project (<strong>habitpluse</strong>), navigate to <strong>Project Settings $\rightarrow$ API</strong> to copy your <strong>Project URL</strong> and <strong>anon / public key</strong>.
          </p>
        </div>

        {/* Inputs Form */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-black dark:text-white font-mono placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Supabase Anon / Public API Key
            </label>
            <textarea
              rows={2}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-black dark:text-white font-mono placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Razorpay Key ID (Optional)
              </label>
              <span className="text-[10px] text-zinc-400">Test mode active if empty</span>
            </div>
            <input
              type="text"
              placeholder="rzp_test_..."
              value={razorpayKey}
              onChange={(e) => setRazorpayKey(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-black dark:text-white font-mono placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeConfigModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-black dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold text-xs shadow-xs transition active:scale-95"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
