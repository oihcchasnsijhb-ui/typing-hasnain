import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, BookPlus, Coins, Plus, Shield, Sliders, Trash2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AdminOverviewData, LessonCategory, WordPoolItem } from '../types/game';

export const AdminPanelView: React.FC = () => {
  const {
    user,
    token,
    lessons,
    wordPools,
    modeConfigs,
    login,
    refreshContent,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'stats' | 'lessons' | 'words' | 'users' | 'modes'>('stats');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin Login Form state when non-admin views /admin
  const [adminEmail, setAdminEmail] = useState('oihcchasnsijhb@gmail.com');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // New Lesson Form
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonCategory, setLessonCategory] = useState<LessonCategory>('words');
  const [lessonDifficulty, setLessonDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonText, setLessonText] = useState('');
  const [lessonTargetWpm, setLessonTargetWpm] = useState(30);
  const [lessonCoins, setLessonCoins] = useState(40);

  // New Word/Sentence Form
  const [wordPool, setWordPool] = useState<WordPoolItem['pool']>('beginner');
  const [wordText, setWordText] = useState('');

  const fetchOverview = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        setOverview((await resp.json()) as AdminOverviewData);
      }
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (!user || user.role !== 'admin') {
    const handleAdminSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      try {
        const logged = await login(adminEmail, adminPass);
        if (logged.role !== 'admin') {
          setAuthError('This account does not have administrator permissions.');
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign in failed.');
      }
    };

    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Admin Access
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in with an administrator account to manage lessons, users, and modes.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {authError && <p className="text-xs text-rose-500 font-medium">{authError}</p>}

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
              Owner seeded login: <span className="font-mono-typing">oihcchasnsijhb@gmail.com</span> · Password:{' '}
              <span className="font-mono-typing">TypingAdmin2026!</span>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 transition-all min-h-[44px]"
            >
              Sign In to Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const resp = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: lessonTitle,
        category: lessonCategory,
        difficulty: lessonDifficulty,
        description: lessonDesc,
        text: lessonText,
        targetWpm: lessonTargetWpm,
        coinReward: lessonCoins,
      }),
    });
    if (resp.ok) {
      setLessonTitle('');
      setLessonDesc('');
      setLessonText('');
      await refreshContent();
      showToast('New lesson published.', 'success');
    } else {
      showToast('Failed to add lesson.', 'error');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    const resp = await fetch(`/api/admin/lessons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) {
      await refreshContent();
      showToast('Lesson removed.', 'info');
    }
  };

  const handleAddWords = async (e: React.FormEvent) => {
    e.preventDefault();
    const resp = await fetch('/api/admin/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pool: wordPool, text: wordText }),
    });
    if (resp.ok) {
      setWordText('');
      await refreshContent();
      showToast('Added words/sentences to practice bank.', 'success');
    } else {
      showToast('Could not add content.', 'error');
    }
  };

  const handleDeleteWord = async (id: string) => {
    const resp = await fetch(`/api/admin/words/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) {
      await refreshContent();
      showToast('Entry removed.', 'info');
    }
  };

  const handleUpdateUser = async (
    userId: string,
    patch: { role?: 'user' | 'admin'; status?: 'active' | 'suspended'; grantCoins?: number }
  ) => {
    const resp = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });
    if (resp.ok) {
      await fetchOverview();
      showToast('User updated.', 'success');
    }
  };

  const handleUpdateMode = async (
    modeId: string,
    patch: { durationSeconds?: number; targetWpm?: number; coinMultiplier?: number; enabled?: boolean }
  ) => {
    const resp = await fetch(`/api/admin/modes/${encodeURIComponent(modeId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });
    if (resp.ok) {
      await refreshContent();
      showToast('Game mode settings saved.', 'success');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400">
            <Shield className="w-4 h-4" />
            <span>Owner Console</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Admin Management Panel
          </h1>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'lessons', label: 'Typing Lessons', icon: <BookPlus className="w-4 h-4" /> },
          { id: 'words', label: 'Words & Sentences', icon: <Plus className="w-4 h-4" /> },
          { id: 'users', label: 'Manage Users', icon: <Users className="w-4 h-4" /> },
          { id: 'modes', label: 'Game Levels', icon: <Sliders className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[40px] ${
              tab === t.id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Statistics Tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Registered Users</div>
              <div className="font-mono-typing text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {loading ? '...' : overview?.stats.totalUsers ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Completed Sessions</div>
              <div className="font-mono-typing text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                {loading ? '...' : overview?.stats.totalSessions ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Average Speed</div>
              <div className="font-mono-typing text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                {loading ? '...' : overview?.stats.avgWpm ?? 0} <span className="text-sm font-normal">WPM</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Average Accuracy</div>
              <div className="font-mono-typing text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {loading ? '...' : overview?.stats.avgAccuracy ?? 0}%
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Recent Activity Across Platform
            </h2>
            {!overview || overview.recentSessions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No player sessions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">WPM</th>
                      <th className="py-2.5 px-3 text-right">Accuracy</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {overview.recentSessions.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{s.userName}</td>
                        <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300">{s.modeLabel}</td>
                        <td className="py-2.5 px-3 text-right font-mono-typing text-blue-600 dark:text-blue-400 tabular-nums">
                          {s.wpm}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-typing text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {s.accuracy}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-slate-500 tabular-nums">
                          {new Date(s.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lessons Tab */}
      {tab === 'lessons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateLesson}
            className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Add New Typing Lesson
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lesson Title
              </label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Top Row Velocity"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={lessonCategory}
                  onChange={(e) => setLessonCategory(e.target.value as LessonCategory)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="home-row">Home Row</option>
                  <option value="left-hand">Left Hand</option>
                  <option value="right-hand">Right Hand</option>
                  <option value="alphabet">Alphabet</option>
                  <option value="words">Words</option>
                  <option value="sentences">Sentences</option>
                  <option value="numbers-symbols">Numbers &amp; Symbols</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={lessonDifficulty}
                  onChange={(e) => setLessonDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target WPM
                </label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={lessonTargetWpm}
                  onChange={(e) => setLessonTargetWpm(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coin Reward
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={lessonCoins}
                  onChange={(e) => setLessonCoins(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={lessonDesc}
                onChange={(e) => setLessonDesc(e.target.value)}
                placeholder="Focus on clean finger reach..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lesson Typing Text
              </label>
              <textarea
                required
                rows={3}
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
                placeholder="Enter exact words or sentences for students to type..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono-typing text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 min-h-[44px]"
            >
              Publish Lesson
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Active Curriculum ({lessons.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lessons.map((l) => (
                <div key={l.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{l.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {l.category} · {l.difficulty} · {l.targetWpm} WPM
                    </div>
                    <div className="text-xs font-mono-typing text-slate-600 dark:text-slate-300 truncate mt-1">
                      {l.text}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLesson(l.id)}
                    aria-label={`Delete ${l.title}`}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Words & Sentences Tab */}
      {tab === 'words' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAddWords}
            className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Add Words or Sentences
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Pool
              </label>
              <select
                value={wordPool}
                onChange={(e) => setWordPool(e.target.value as WordPoolItem['pool'])}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="beginner">Beginner Pool</option>
                <option value="intermediate">Intermediate Pool</option>
                <option value="advanced">Advanced Pool</option>
                <option value="speed">Speed &amp; Timed Tests Pool</option>
                <option value="daily">Daily Challenge Pool</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Words or Sentence Text
              </label>
              <textarea
                required
                rows={4}
                value={wordText}
                onChange={(e) => setWordText(e.target.value)}
                placeholder="Type a sentence or space-separated practice words..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono-typing text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 min-h-[44px]"
            >
              Add to Practice Bank
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Word &amp; Sentence Entries ({wordPools.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {wordPools.map((w) => (
                <div key={w.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Pool: {w.pool} {w.isCustom ? '· Custom' : ''}
                    </div>
                    <p className="text-xs sm:text-sm font-mono-typing text-slate-700 dark:text-slate-200 mt-1 break-words">
                      {w.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteWord(w.id)}
                    aria-label="Delete word pool item"
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manage Users Tab */}
      {tab === 'users' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Level</th>
                  <th className="py-3.5 px-4 text-right">Coins</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(overview?.users || []).map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{u.displayName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {u.role}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      <span className={u.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-typing tabular-nums">Lv. {u.level}</td>
                    <td className="py-3 px-4 text-right font-mono-typing tabular-nums">{u.coins}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateUser(u.id, { grantCoins: 100 })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>+100</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {u.role === 'admin' ? 'Set User' : 'Make Admin'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateUser(u.id, {
                              status: u.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manage Game Modes / Levels Tab */}
      {tab === 'modes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modeConfigs.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {m.title}
                </h3>
                <button
                  type="button"
                  onClick={() => handleUpdateMode(m.id, { enabled: !m.enabled })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    m.enabled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {m.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Timer (s)</label>
                  <input
                    type="number"
                    min={0}
                    defaultValue={m.durationSeconds}
                    onBlur={(e) => handleUpdateMode(m.id, { durationSeconds: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono-typing text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Target WPM</label>
                  <input
                    type="number"
                    min={10}
                    defaultValue={m.targetWpm}
                    onBlur={(e) => handleUpdateMode(m.id, { targetWpm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono-typing text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Coin Mult</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.5}
                    defaultValue={m.coinMultiplier}
                    onBlur={(e) => handleUpdateMode(m.id, { coinMultiplier: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono-typing text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
