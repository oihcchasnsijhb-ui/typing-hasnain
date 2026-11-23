import React, { useEffect, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LeaderboardEntry } from '../types/game';

export const LeaderboardView: React.FC = () => {
  const { modeConfigs, activeProfile } = useApp();
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (mode: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/leaderboard?mode=${encodeURIComponent(mode)}`);
      if (!resp.ok) throw new Error('Unable to load leaderboard.');
      const data = (await resp.json()) as { entries: LeaderboardEntry[] };
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach leaderboard server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedMode);
  }, [selectedMode]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Trophy className="w-4 h-4" />
            <span>Global Rankings</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            High Score Leaderboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Complete any game mode with 75%+ accuracy to submit your score automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLeaderboard(selectedMode)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mode Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedMode('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[38px] ${
            selectedMode === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          All Modes
        </button>
        {modeConfigs.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMode(m.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[38px] ${
              selectedMode === m.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {m.shortTitle}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading rankings...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-rose-500">{error}</div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No scores recorded for this mode yet. Play a round to claim #1!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4 text-right">Speed</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {entries.map((entry, idx) => {
                  const isCurrentUser =
                    activeProfile.id !== 'guest' && entry.userId === activeProfile.id;
                  return (
                    <tr
                      key={entry.id}
                      className={`${
                        isCurrentUser
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                      } transition-colors`}
                    >
                      <td className="py-3.5 px-4 font-mono-typing font-bold tabular-nums text-slate-900 dark:text-white">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {entry.displayName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Level {entry.level}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {entry.modeLabel}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-typing font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {entry.wpm} WPM
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-typing text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {entry.accuracy}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-typing font-semibold text-slate-900 dark:text-white tabular-nums">
                        {entry.score}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums hidden sm:table-cell">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
