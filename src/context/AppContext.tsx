import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_LESSONS, DEFAULT_WORD_POOLS } from '../data/curriculum';
import { ACHIEVEMENTS, ARENA_THEMES, calculateLevelFromXp, DEFAULT_MODE_CONFIGS } from '../data/modes';
import type {
  GameModeConfig,
  GameModeId,
  LessonItem,
  SessionRecord,
  UserProfile,
  UserSettings,
  WordPoolItem,
} from '../types/game';

const TOKEN_KEY = 'typing_name_token';
const GUEST_PROFILE_KEY = 'typing_name_guest_profile';
const GUEST_HISTORY_KEY = 'typing_name_guest_history';

const DEFAULT_SETTINGS: UserSettings = {
  themeMode: 'dark',
  soundProfile: 'mechanical',
  showKeyboard: true,
  showFingerColors: true,
  caretStyle: 'line',
  activeArenaTheme: 'obsidian-core',
};

function createDefaultGuestProfile(): UserProfile {
  return {
    id: 'guest',
    email: '',
    displayName: 'Guest Typist',
    role: 'user',
    status: 'active',
    coins: 120,
    xp: 0,
    level: 1,
    streakDays: 0,
    lastDailyDate: null,
    unlockedThemes: ['obsidian-core'],
    achievements: [],
    completedLessons: {},
    personalBests: {},
    totalTests: 0,
    totalWords: 0,
    settings: { ...DEFAULT_SETTINGS },
    createdAt: new Date().toISOString(),
  };
}

export interface SessionSubmissionInput {
  mode: GameModeId;
  modeLabel: string;
  lessonId?: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  mistakes: number;
  wordsTyped: number;
  charsTyped: number;
  durationSeconds: number;
  missedKeys?: Record<string, number>;
}

export interface SessionSubmissionResult {
  session: SessionRecord;
  newlyUnlockedAchievements: string[];
  isPersonalBest: boolean;
  leveledUp: boolean;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextValue {
  user: UserProfile | null;
  activeProfile: UserProfile;
  isAuthenticated: boolean;
  token: string | null;
  history: SessionRecord[];
  lessons: LessonItem[];
  wordPools: WordPoolItem[];
  modeConfigs: GameModeConfig[];
  dailyDate: string;
  googleEnabled: boolean;
  settings: UserSettings;
  toast: ToastMessage | null;
  loadingAuth: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (email: string, password: string, displayName: string) => Promise<UserProfile>;
  logout: () => void;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  submitSession: (input: SessionSubmissionInput) => Promise<SessionSubmissionResult>;
  unlockTheme: (themeId: string) => Promise<void>;
  refreshContent: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(Boolean(token));
  const [guestProfile, setGuestProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(GUEST_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile;
        return {
          ...createDefaultGuestProfile(),
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
      }
    } catch {
      // ignore
    }
    return createDefaultGuestProfile();
  });
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_HISTORY_KEY);
      return saved ? (JSON.parse(saved) as SessionRecord[]) : [];
    } catch {
      return [];
    }
  });

  const [lessons, setLessons] = useState<LessonItem[]>(DEFAULT_LESSONS);
  const [wordPools, setWordPools] = useState<WordPoolItem[]>(DEFAULT_WORD_POOLS);
  const [modeConfigs, setModeConfigs] = useState<GameModeConfig[]>(DEFAULT_MODE_CONFIGS);
  const [dailyDate, setDailyDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [googleEnabled, setGoogleEnabled] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const activeProfile = user ?? guestProfile;
  const settings = activeProfile.settings;

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = String(Date.now());
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3600);
  }, []);

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', settings.themeMode === 'dark' ? '#090D16' : '#F8FAFC');
    }
  }, [settings.themeMode]);

  // Persist guest profile & history
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(guestProfile));
      } catch {
        // ignore
      }
    }
  }, [guestProfile, user]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
      } catch {
        // ignore
      }
    }
  }, [history, user]);

  // Handle OAuth callback query param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('oauthToken');
    const authError = params.get('authError');
    if (oauthToken) {
      localStorage.setItem(TOKEN_KEY, oauthToken);
      setToken(oauthToken);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authError) {
      showToast('Google Sign-In could not be completed. Please try again.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showToast]);

  const refreshContent = useCallback(async () => {
    try {
      const resp = await fetch('/api/content');
      if (!resp.ok) return;
      const data = (await resp.json()) as {
        lessons: LessonItem[];
        wordPools: WordPoolItem[];
        modeConfigs: GameModeConfig[];
        dailyDate: string;
      };
      if (data.lessons?.length) setLessons(data.lessons);
      if (data.wordPools?.length) setWordPools(data.wordPools);
      if (data.modeConfigs?.length) setModeConfigs(data.modeConfigs);
      if (data.dailyDate) setDailyDate(data.dailyDate);
    } catch {
      // Offline fallback already loaded
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoadingAuth(false);
      return;
    }
    try {
      const resp = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setLoadingAuth(false);
        return;
      }
      const data = (await resp.json()) as { user: UserProfile; history: SessionRecord[] };
      setUser(data.user);
      setHistory(data.history || []);
    } catch {
      // Offline mode: keep current state
    } finally {
      setLoadingAuth(false);
    }
  }, [token]);

  useEffect(() => {
    refreshContent();
    fetch('/api/auth/config')
      .then((r) => (r.ok ? r.json() : { googleEnabled: false }))
      .then((d: { googleEnabled?: boolean }) => setGoogleEnabled(Boolean(d.googleEnabled)))
      .catch(() => setGoogleEnabled(false));
  }, [refreshContent]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await resp.json()) as { user?: UserProfile; token?: string; error?: string };
    if (!resp.ok || !data.user || !data.token) {
      throw new Error(data.error || 'Unable to sign in.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    showToast(`Welcome back, ${data.user.displayName}`, 'success');
    return data.user;
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const resp = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = (await resp.json()) as { user?: UserProfile; token?: string; error?: string };
    if (!resp.ok || !data.user || !data.token) {
      throw new Error(data.error || 'Unable to create account.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    showToast(`Account created! Welcome, ${data.user.displayName}`, 'success');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    try {
      const savedHist = localStorage.getItem(GUEST_HISTORY_KEY);
      setHistory(savedHist ? (JSON.parse(savedHist) as SessionRecord[]) : []);
    } catch {
      setHistory([]);
    }
    showToast('Signed out cleanly.', 'info');
  };

  const updateSettings = async (patch: Partial<UserSettings>) => {
    const nextSettings: UserSettings = { ...settings, ...patch };
    if (user && token) {
      setUser({ ...user, settings: nextSettings });
      try {
        const resp = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ settings: patch }),
        });
        if (resp.ok) {
          const data = (await resp.json()) as { user: UserProfile };
          setUser(data.user);
        }
      } catch {
        // Offline tolerance
      }
    } else {
      setGuestProfile((prev) => ({ ...prev, settings: nextSettings }));
    }
  };

  const updateDisplayName = async (displayName: string) => {
    const trimmed = displayName.trim().slice(0, 32);
    if (!trimmed) return;
    if (user && token) {
      const resp = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { user: UserProfile };
        setUser(data.user);
        showToast('Display name updated.', 'success');
      }
    } else {
      setGuestProfile((prev) => ({ ...prev, displayName: trimmed }));
      showToast('Display name updated.', 'success');
    }
  };

  const applyLocalGuestSession = (input: SessionSubmissionInput): SessionSubmissionResult => {
    const modeCfg = modeConfigs.find((m) => m.id === input.mode);
    const mult = modeCfg ? modeCfg.coinMultiplier : 1.0;
    const accFactor = Math.max(0.4, input.accuracy / 100);
    const score = Math.round(input.wpm * 10 * accFactor);
    let coinsEarned =
      Math.max(8, Math.round((input.wordsTyped * 0.6 + input.wpm * 0.25) * mult)) +
      (input.accuracy >= 98 ? 15 : input.accuracy >= 95 ? 8 : 0);
    const xpEarned = Math.max(20, Math.round((input.charsTyped * 0.35 + input.wpm * 1.4) * accFactor));

    const prev = guestProfile;
    const prevLevel = prev.level;
    const nextXp = prev.xp + xpEarned;
    const nextLevel = calculateLevelFromXp(nextXp);
    const leveledUp = nextLevel > prevLevel;
    const today = new Date().toISOString().slice(0, 10);

    let nextStreak = prev.streakDays;
    let nextDailyDate = prev.lastDailyDate;
    if (input.mode === 'daily-challenge' && prev.lastDailyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      nextStreak = prev.lastDailyDate === yesterday ? prev.streakDays + 1 : 1;
      nextDailyDate = today;
      coinsEarned += 40;
    }

    const prevBest = prev.personalBests[input.mode];
    const isPersonalBest = !prevBest || input.wpm > prevBest.wpm;
    const nextBests = { ...prev.personalBests };
    if (isPersonalBest) {
      nextBests[input.mode] = {
        wpm: input.wpm,
        accuracy: input.accuracy,
        score,
        date: new Date().toISOString(),
      };
    }

    const nextLessons = { ...prev.completedLessons };
    if (input.lessonId) {
      const lesson = lessons.find((l) => l.id === input.lessonId);
      const tWpm = lesson?.targetWpm ?? 25;
      const tAcc = lesson?.targetAccuracy ?? 90;
      const stars =
        input.accuracy >= tAcc && input.wpm >= tWpm + 10
          ? 3
          : input.accuracy >= tAcc && input.wpm >= tWpm
          ? 2
          : input.accuracy >= 80
          ? 1
          : 0;
      const oldL = nextLessons[input.lessonId];
      nextLessons[input.lessonId] = {
        bestWpm: Math.max(oldL?.bestWpm ?? 0, input.wpm),
        bestAccuracy: Math.max(oldL?.bestAccuracy ?? 0, input.accuracy),
        stars: Math.max(oldL?.stars ?? 0, stars),
      };
    }

    const owned = new Set(prev.achievements);
    const newlyUnlocked: string[] = [];
    const checkUnlock = (id: string) => {
      if (!owned.has(id)) {
        owned.add(id);
        newlyUnlocked.push(id);
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) coinsEarned += def.coinBonus;
      }
    };
    const nextTests = prev.totalTests + 1;
    const nextWords = prev.totalWords + input.wordsTyped;
    if (nextTests >= 1) checkUnlock('first-run');
    if (input.accuracy >= 98) checkUnlock('accuracy-ace');
    if (input.accuracy === 100 && input.wordsTyped >= 5) checkUnlock('perfectionist');
    if (input.wpm >= 40) checkUnlock('speed-40');
    if (input.wpm >= 65 && input.accuracy >= 92) checkUnlock('speed-65');
    if (input.wpm >= 90 && input.accuracy >= 94) checkUnlock('speed-90');
    if (input.mode === 'daily-challenge') checkUnlock('daily-streak');
    if (Object.values(nextLessons).filter((l) => l.stars >= 1).length >= 5) checkUnlock('course-scholar');
    if (nextWords >= 1000) checkUnlock('marathon-typist');

    const session: SessionRecord = {
      id: `local-${Date.now()}`,
      userId: 'guest',
      userName: prev.displayName,
      mode: input.mode,
      modeLabel: input.modeLabel,
      lessonId: input.lessonId,
      wpm: input.wpm,
      rawWpm: input.rawWpm,
      accuracy: input.accuracy,
      mistakes: input.mistakes,
      wordsTyped: input.wordsTyped,
      charsTyped: input.charsTyped,
      durationSeconds: input.durationSeconds,
      score,
      coinsEarned,
      xpEarned,
      createdAt: new Date().toISOString(),
      missedKeys: input.missedKeys,
    };

    setGuestProfile({
      ...prev,
      coins: prev.coins + coinsEarned,
      xp: nextXp,
      level: nextLevel,
      streakDays: nextStreak,
      lastDailyDate: nextDailyDate,
      achievements: Array.from(owned),
      completedLessons: nextLessons,
      personalBests: nextBests,
      totalTests: nextTests,
      totalWords: nextWords,
    });
    setHistory((h) => [session, ...h].slice(0, 50));

    return {
      session,
      newlyUnlockedAchievements: newlyUnlocked,
      isPersonalBest,
      leveledUp,
    };
  };

  const submitSession = async (input: SessionSubmissionInput): Promise<SessionSubmissionResult> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch('/api/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...input,
          guestName: activeProfile.displayName,
        }),
      });

      if (resp.ok) {
        const data = (await resp.json()) as {
          session: SessionRecord;
          user: UserProfile | null;
          newlyUnlockedAchievements: string[];
          isPersonalBest: boolean;
          leveledUp: boolean;
        };
        if (data.user) {
          setUser(data.user);
          setHistory((prev) => [data.session, ...prev].slice(0, 50));
          return {
            session: data.session,
            newlyUnlockedAchievements: data.newlyUnlockedAchievements || [],
            isPersonalBest: data.isPersonalBest,
            leveledUp: data.leveledUp,
          };
        }
      }
    } catch {
      // Fallback to offline local evaluation
    }
    return applyLocalGuestSession(input);
  };

  const unlockTheme = async (themeId: string) => {
    const theme = ARENA_THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    if (user && token) {
      const resp = await fetch('/api/shop/unlock-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ themeId }),
      });
      const data = (await resp.json()) as { user?: UserProfile; error?: string };
      if (!resp.ok || !data.user) {
        throw new Error(data.error || 'Could not unlock theme.');
      }
      setUser(data.user);
      showToast(`Equipped ${theme.name}`, 'success');
    } else {
      if (!guestProfile.unlockedThemes.includes(themeId)) {
        if (guestProfile.coins < theme.cost) {
          throw new Error(`Need ${theme.cost} coins to unlock ${theme.name}.`);
        }
        setGuestProfile((prev) => ({
          ...prev,
          coins: prev.coins - theme.cost,
          unlockedThemes: [...prev.unlockedThemes, themeId],
          settings: { ...prev.settings, activeArenaTheme: themeId },
        }));
      } else {
        setGuestProfile((prev) => ({
          ...prev,
          settings: { ...prev.settings, activeArenaTheme: themeId },
        }));
      }
      showToast(`Equipped ${theme.name}`, 'success');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        activeProfile,
        isAuthenticated: Boolean(user),
        token,
        history,
        lessons,
        wordPools,
        modeConfigs,
        dailyDate,
        googleEnabled,
        settings,
        toast,
        loadingAuth,
        login,
        signup,
        logout,
        updateSettings,
        updateDisplayName,
        submitSession,
        unlockTheme,
        refreshContent,
        refreshProfile,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
