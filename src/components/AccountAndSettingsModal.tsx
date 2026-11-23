import React, { useState } from 'react';
import { LogOut, Moon, Shield, Sun, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { CaretStyle, SoundProfile } from '../types/game';
import type { AppRoute } from './Header';
import { PWAInstallButton } from './PWAInstallButton';

interface AccountAndSettingsModalProps {
  isOpen: boolean;
  initialTab: 'account' | 'settings';
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const AccountAndSettingsModal: React.FC<AccountAndSettingsModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  onNavigate,
}) => {
  const {
    user,
    activeProfile,
    isAuthenticated,
    googleEnabled,
    settings,
    login,
    signup,
    logout,
    updateSettings,
    updateDisplayName,
  } = useApp();

  const [tab, setTab] = useState<'account' | 'settings'>(initialTab);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [profileNameEdit, setProfileNameEdit] = useState(activeProfile.displayName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setTab(initialTab);
    setProfileNameEdit(activeProfile.displayName);
    setError(null);
  }, [initialTab, isOpen, activeProfile.displayName]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, displayNameInput || email.split('@')[0]);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('account')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'account'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Account
            </button>
            <button
              type="button"
              onClick={() => setTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Settings
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {tab === 'account' ? (
            isAuthenticated && user ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white font-display text-lg font-bold">
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {user.email} · Role: {user.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Display Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileNameEdit}
                      onChange={(e) => setProfileNameEdit(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => updateDisplayName(profileNameEdit)}
                      className="rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('progress');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                  >
                    <User className="w-4 h-4" />
                    <span>My Progress</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('admin');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 min-h-[40px]"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 min-h-[40px]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                      authMode === 'login'
                        ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                      authMode === 'signup'
                        ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Player Name
                      </label>
                      <input
                        type="text"
                        required
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g., Alex Mercer"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 transition-all min-h-[44px]"
                  >
                    {submitting
                      ? 'Please wait...'
                      : authMode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                  </button>
                </form>

                {googleEnabled && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <a
                      href="/api/auth/google"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                    >
                      <span>Continue with Google</span>
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Guest progress saves automatically locally.</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('admin');
                    }}
                    className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Admin Login
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-5">
              {/* Theme Switch */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Switch between dark obsidian and bright studio mode
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1">
                  <button
                    type="button"
                    onClick={() => updateSettings({ themeMode: 'light' })}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      settings.themeMode === 'light'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ themeMode: 'dark' })}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      settings.themeMode === 'dark'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Sound Profile */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Keystroke Sound</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Synthesized tactile audio feedback
                  </div>
                </div>
                <select
                  value={settings.soundProfile}
                  onChange={(e) => updateSettings({ soundProfile: e.target.value as SoundProfile })}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="mechanical">Mechanical Crisp</option>
                  <option value="soft">Soft Tactile</option>
                  <option value="off">Muted</option>
                </select>
              </div>

              {/* Caret Style */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Cursor Style</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Active letter indicator shape
                  </div>
                </div>
                <select
                  value={settings.caretStyle}
                  onChange={(e) => updateSettings({ caretStyle: e.target.value as CaretStyle })}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="line">Vertical Line</option>
                  <option value="block">Highlight Block</option>
                  <option value="underline">Underline</option>
                </select>
              </div>

              {/* Toggles */}
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">On-Screen Keyboard</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Show live interactive keyboard under the typing arena
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showKeyboard}
                  onChange={(e) => updateSettings({ showKeyboard: e.target.checked })}
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Finger Zone Colors</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Color-code keys by assigned touch-typing finger
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showFingerColors}
                  onChange={(e) => updateSettings({ showFingerColors: e.target.checked })}
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Install App (PWA)</span>
                <PWAInstallButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
