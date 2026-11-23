import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LESSONS, DEFAULT_WORD_POOLS } from '../src/data/curriculum.ts';
import { ACHIEVEMENTS, ARENA_THEMES, calculateLevelFromXp, DEFAULT_MODE_CONFIGS } from '../src/data/modes.ts';
import type {
  AdminOverviewData,
  GameModeConfig,
  GameModeId,
  LeaderboardEntry,
  LessonItem,
  SessionRecord,
  UserProfile,
  UserSettings,
  WordPoolItem,
} from '../src/types/game.ts';

export interface StoredUser extends UserProfile {
  passwordHash: string;
  googleId?: string;
}

export interface DatabaseState {
  users: StoredUser[];
  sessions: SessionRecord[];
  leaderboard: LeaderboardEntry[];
  customLessons: LessonItem[];
  deletedLessonIds: string[];
  customWordPools: WordPoolItem[];
  deletedWordPoolIds: string[];
  modeConfigs: GameModeConfig[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'typing_name_db.json');
const SECRET_PATH = path.join(DATA_DIR, '.session_secret');

const OWNER_EMAILS = new Set(['oihcchasnsijhb@gmail.com', 'admin@typingname.app']);

const DEFAULT_SETTINGS: UserSettings = {
  themeMode: 'dark',
  soundProfile: 'mechanical',
  showKeyboard: true,
  showFingerColors: true,
  caretStyle: 'line',
  activeArenaTheme: 'obsidian-core',
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDataDir();
  if (fs.existsSync(SECRET_PATH)) {
    return fs.readFileSync(SECRET_PATH, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_PATH, secret, 'utf8');
  return secret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function signToken(payload: { userId: string; role: 'user' | 'admin'; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { userId: string; role: 'user' | 'admin'; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as {
      userId: string;
      role: 'user' | 'admin';
      exp: number;
    };
    if (!parsed.userId || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function createInitialDb(): DatabaseState {
  const now = new Date().toISOString();
  const seedUsers: StoredUser[] = [
    {
      id: 'usr-admin-owner',
      email: 'oihcchasnsijhb@gmail.com',
      displayName: 'Studio Owner',
      role: 'admin',
      status: 'active',
      coins: 1200,
      xp: 3600,
      level: calculateLevelFromXp(3600),
      streakDays: 5,
      lastDailyDate: null,
      unlockedThemes: ['obsidian-core', 'cobalt-grid', 'aurora-pulse'],
      achievements: ['first-run', 'accuracy-ace', 'speed-40', 'speed-65'],
      completedLessons: {
        'lesson-home-1': { bestWpm: 58, bestAccuracy: 98, stars: 3 },
        'lesson-home-2': { bestWpm: 62, bestAccuracy: 97, stars: 3 },
      },
      personalBests: {
        '1-minute': { wpm: 74, accuracy: 97, score: 718, date: now },
      },
      totalTests: 14,
      totalWords: 840,
      settings: { ...DEFAULT_SETTINGS },
      createdAt: now,
      passwordHash: hashPassword('TypingAdmin2026!'),
    },
    {
      id: 'usr-admin-demo',
      email: 'admin@typingname.app',
      displayName: 'Admin Operator',
      role: 'admin',
      status: 'active',
      coins: 1500,
      xp: 4800,
      level: calculateLevelFromXp(4800),
      streakDays: 7,
      lastDailyDate: null,
      unlockedThemes: ['obsidian-core', 'cobalt-grid', 'aurora-pulse', 'atelier-slate'],
      achievements: ['first-run', 'accuracy-ace', 'speed-40', 'speed-65'],
      completedLessons: {},
      personalBests: {},
      totalTests: 18,
      totalWords: 1120,
      settings: { ...DEFAULT_SETTINGS },
      createdAt: now,
      passwordHash: hashPassword('TypingAdmin2026!'),
    },
  ];

  const seedLeaderboard: LeaderboardEntry[] = [
    {
      id: 'lb-seed-1',
      userId: 'seed-elena',
      displayName: 'Elena Vance',
      level: 18,
      mode: '1-minute',
      modeLabel: '1 Minute Typing Test',
      wpm: 108,
      accuracy: 98,
      wordsTyped: 108,
      score: 1058,
      createdAt: now,
    },
    {
      id: 'lb-seed-2',
      userId: 'seed-marcus',
      displayName: 'Marcus Chen',
      level: 15,
      mode: 'speed-challenge',
      modeLabel: 'Speed Typing Challenge',
      wpm: 96,
      accuracy: 97,
      wordsTyped: 72,
      score: 931,
      createdAt: now,
    },
    {
      id: 'lb-seed-3',
      userId: 'seed-aria',
      displayName: 'Aria Patel',
      level: 12,
      mode: 'daily-challenge',
      modeLabel: 'Daily Typing Challenge',
      wpm: 88,
      accuracy: 99,
      wordsTyped: 88,
      score: 871,
      createdAt: now,
    },
    {
      id: 'lb-seed-4',
      userId: 'seed-lucas',
      displayName: 'Lucas Meyer',
      level: 9,
      mode: '2-minute',
      modeLabel: '2 Minute Typing Test',
      wpm: 79,
      accuracy: 96,
      wordsTyped: 158,
      score: 758,
      createdAt: now,
    },
    {
      id: 'lb-seed-5',
      userId: 'seed-nora',
      displayName: 'Nora Sato',
      level: 7,
      mode: '5-minute',
      modeLabel: '5 Minute Typing Test',
      wpm: 72,
      accuracy: 97,
      wordsTyped: 360,
      score: 698,
      createdAt: now,
    },
    {
      id: 'lb-seed-6',
      userId: 'seed-owen',
      displayName: 'Owen Brooks',
      level: 5,
      mode: 'intermediate',
      modeLabel: 'Intermediate Typing',
      wpm: 64,
      accuracy: 95,
      wordsTyped: 42,
      score: 608,
      createdAt: now,
    },
  ];

  return {
    users: seedUsers,
    sessions: [],
    leaderboard: seedLeaderboard,
    customLessons: [],
    deletedLessonIds: [],
    customWordPools: [],
    deletedWordPoolIds: [],
    modeConfigs: DEFAULT_MODE_CONFIGS.map((m) => ({ ...m })),
  };
}

let cachedDb: DatabaseState | null = null;

export function loadDb(): DatabaseState {
  if (cachedDb) return cachedDb;
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    cachedDb = createInitialDb();
    saveDb(cachedDb);
    return cachedDb;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseState;
    cachedDb = {
      users: parsed.users || [],
      sessions: parsed.sessions || [],
      leaderboard: parsed.leaderboard || [],
      customLessons: parsed.customLessons || [],
      deletedLessonIds: parsed.deletedLessonIds || [],
      customWordPools: parsed.customWordPools || [],
      deletedWordPoolIds: parsed.deletedWordPoolIds || [],
      modeConfigs: parsed.modeConfigs?.length ? parsed.modeConfigs : DEFAULT_MODE_CONFIGS.map((m) => ({ ...m })),
    };
    return cachedDb;
  } catch {
    cachedDb = createInitialDb();
    saveDb(cachedDb);
    return cachedDb;
  }
}

export function saveDb(db: DatabaseState): void {
  ensureDataDir();
  cachedDb = db;
  const tmpPath = `${DB_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ph, googleId: _gid, ...safe } = user;
  return safe;
}

export function getMergedLessons(db: DatabaseState): LessonItem[] {
  const deleted = new Set(db.deletedLessonIds);
  const base = DEFAULT_LESSONS.filter((l) => !deleted.has(l.id));
  const customMap = new Map(db.customLessons.map((l) => [l.id, l]));
  const merged = base.map((l) => customMap.get(l.id) ?? l);
  const baseIds = new Set(base.map((l) => l.id));
  for (const custom of db.customLessons) {
    if (!baseIds.has(custom.id) && !deleted.has(custom.id)) {
      merged.push(custom);
    }
  }
  return merged.sort((a, b) => a.order - b.order);
}

export function getMergedWordPools(db: DatabaseState): WordPoolItem[] {
  const deleted = new Set(db.deletedWordPoolIds);
  const base = DEFAULT_WORD_POOLS.filter((w) => !deleted.has(w.id));
  return [...base, ...db.customWordPools];
}

export function registerUser(email: string, password: string, displayName: string): { user: UserProfile; token: string } {
  const db = loadDb();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  const existing = db.users.find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const now = new Date().toISOString();
  const role: 'user' | 'admin' = OWNER_EMAILS.has(normalizedEmail) ? 'admin' : 'user';
  const newUser: StoredUser = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    email: normalizedEmail,
    displayName: displayName.trim().slice(0, 32) || normalizedEmail.split('@')[0],
    role,
    status: 'active',
    coins: 100,
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
    createdAt: now,
    passwordHash: hashPassword(password),
  };

  db.users.push(newUser);
  saveDb(db);
  const token = signToken({ userId: newUser.id, role: newUser.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  return { user: sanitizeUser(newUser), token };
}

export function loginUser(email: string, password: string): { user: UserProfile; token: string } {
  const db = loadDb();
  const normalizedEmail = email.trim().toLowerCase();
  const found = db.users.find((u) => u.email === normalizedEmail);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  if (found.status === 'suspended') {
    throw new Error('This account has been suspended by an administrator.');
  }
  const token = signToken({ userId: found.id, role: found.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  return { user: sanitizeUser(found), token };
}

export function upsertGoogleUser(googleId: string, email: string, displayName: string): { user: UserProfile; token: string } {
  const db = loadDb();
  const normalizedEmail = email.trim().toLowerCase();
  let found = db.users.find((u) => u.googleId === googleId || u.email === normalizedEmail);
  if (found) {
    if (found.status === 'suspended') {
      throw new Error('This account has been suspended.');
    }
    found.googleId = googleId;
    if (displayName && !found.displayName) {
      found.displayName = displayName.slice(0, 32);
    }
    saveDb(db);
  } else {
    const now = new Date().toISOString();
    const role: 'user' | 'admin' = OWNER_EMAILS.has(normalizedEmail) ? 'admin' : 'user';
    found = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      email: normalizedEmail,
      displayName: (displayName || normalizedEmail.split('@')[0]).slice(0, 32),
      role,
      status: 'active',
      coins: 100,
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
      createdAt: now,
      passwordHash: hashPassword(crypto.randomBytes(24).toString('hex')),
      googleId,
    };
    db.users.push(found);
    saveDb(db);
  }
  const token = signToken({ userId: found.id, role: found.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
  return { user: sanitizeUser(found), token };
}

export function recordSessionForUser(
  userId: string | null,
  input: {
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
    guestName?: string;
    missedKeys?: Record<string, number>;
  }
): {
  session: SessionRecord;
  user: UserProfile | null;
  newlyUnlockedAchievements: string[];
  isPersonalBest: boolean;
  leveledUp: boolean;
} {
  const db = loadDb();
  const modeCfg = db.modeConfigs.find((m) => m.id === input.mode);
  const multiplier = modeCfg ? modeCfg.coinMultiplier : 1.0;

  const accuracyFactor = Math.max(0.4, input.accuracy / 100);
  const score = Math.round(input.wpm * 10 * accuracyFactor);
  const baseCoins = Math.max(8, Math.round((input.wordsTyped * 0.6 + input.wpm * 0.25) * multiplier));
  const accuracyBonus = input.accuracy >= 98 ? 15 : input.accuracy >= 95 ? 8 : 0;
  let coinsEarned = baseCoins + accuracyBonus;
  const xpEarned = Math.max(20, Math.round((input.charsTyped * 0.35 + input.wpm * 1.4) * accuracyFactor));

  const today = new Date().toISOString().slice(0, 10);
  let isPersonalBest = false;
  let leveledUp = false;
  const newlyUnlockedAchievements: string[] = [];

  const user = userId ? db.users.find((u) => u.id === userId) : undefined;
  const userName = user ? user.displayName : (input.guestName?.trim() || 'Guest Typist');

  const session: SessionRecord = {
    id: `ses-${crypto.randomUUID().slice(0, 10)}`,
    userId: user ? user.id : 'guest',
    userName,
    mode: input.mode,
    modeLabel: input.modeLabel,
    lessonId: input.lessonId,
    wpm: Math.max(0, Math.round(input.wpm)),
    rawWpm: Math.max(0, Math.round(input.rawWpm)),
    accuracy: Math.min(100, Math.max(0, Math.round(input.accuracy))),
    mistakes: Math.max(0, Math.round(input.mistakes)),
    wordsTyped: Math.max(0, Math.round(input.wordsTyped)),
    charsTyped: Math.max(0, Math.round(input.charsTyped)),
    durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
    score,
    coinsEarned,
    xpEarned,
    createdAt: new Date().toISOString(),
    missedKeys: input.missedKeys,
  };

  if (user) {
    const prevLevel = user.level;
    user.xp += xpEarned;
    user.level = calculateLevelFromXp(user.xp);
    leveledUp = user.level > prevLevel;
    user.totalTests += 1;
    user.totalWords += session.wordsTyped;

    // Daily challenge streak
    if (input.mode === 'daily-challenge' && user.lastDailyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      user.streakDays = user.lastDailyDate === yesterday ? user.streakDays + 1 : 1;
      user.lastDailyDate = today;
      coinsEarned += 40;
      session.coinsEarned = coinsEarned;
    }

    // Personal best
    const prevBest = user.personalBests[input.mode];
    if (!prevBest || session.wpm > prevBest.wpm || (session.wpm === prevBest.wpm && session.accuracy > prevBest.accuracy)) {
      isPersonalBest = true;
      user.personalBests[input.mode] = {
        wpm: session.wpm,
        accuracy: session.accuracy,
        score: session.score,
        date: session.createdAt,
      };
    }

    // Lesson progress
    if (input.lessonId) {
      const lesson = getMergedLessons(db).find((l) => l.id === input.lessonId);
      const targetWpm = lesson?.targetWpm ?? 25;
      const targetAcc = lesson?.targetAccuracy ?? 90;
      const stars =
        session.accuracy >= targetAcc && session.wpm >= targetWpm + 10
          ? 3
          : session.accuracy >= targetAcc && session.wpm >= targetWpm
          ? 2
          : session.accuracy >= 80
          ? 1
          : 0;
      const prevLesson = user.completedLessons[input.lessonId];
      user.completedLessons[input.lessonId] = {
        bestWpm: Math.max(prevLesson?.bestWpm ?? 0, session.wpm),
        bestAccuracy: Math.max(prevLesson?.bestAccuracy ?? 0, session.accuracy),
        stars: Math.max(prevLesson?.stars ?? 0, stars),
      };
    }

    // Achievements evaluation
    const owned = new Set(user.achievements);
    const unlock = (id: string) => {
      if (!owned.has(id)) {
        owned.add(id);
        newlyUnlockedAchievements.push(id);
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) coinsEarned += def.coinBonus;
      }
    };

    if (user.totalTests >= 1) unlock('first-run');
    if (session.accuracy >= 98) unlock('accuracy-ace');
    if (session.accuracy === 100 && session.wordsTyped >= 5) unlock('perfectionist');
    if (session.wpm >= 40) unlock('speed-40');
    if (session.wpm >= 65 && session.accuracy >= 92) unlock('speed-65');
    if (session.wpm >= 90 && session.accuracy >= 94) unlock('speed-90');
    if (input.mode === 'daily-challenge') unlock('daily-streak');
    if (Object.values(user.completedLessons).filter((l) => l.stars >= 1).length >= 5) unlock('course-scholar');
    if (user.totalWords >= 1000) unlock('marathon-typist');

    user.achievements = Array.from(owned);
    user.coins += coinsEarned;
    session.coinsEarned = coinsEarned;
  }

  db.sessions.unshift(session);
  if (db.sessions.length > 500) {
    db.sessions = db.sessions.slice(0, 500);
  }

  // Update leaderboard if meaningful session (at least 5 words typed and 75% accuracy)
  if (session.wordsTyped >= 5 && session.accuracy >= 75 && input.mode !== 'lesson') {
    db.leaderboard.push({
      id: `lb-${session.id}`,
      userId: session.userId,
      displayName: userName,
      level: user ? user.level : 1,
      mode: session.mode,
      modeLabel: session.modeLabel,
      wpm: session.wpm,
      accuracy: session.accuracy,
      wordsTyped: session.wordsTyped,
      score: session.score,
      createdAt: session.createdAt,
    });
    db.leaderboard.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
    if (db.leaderboard.length > 200) {
      db.leaderboard = db.leaderboard.slice(0, 200);
    }
  }

  saveDb(db);
  return {
    session,
    user: user ? sanitizeUser(user) : null,
    newlyUnlockedAchievements,
    isPersonalBest,
    leveledUp,
  };
}

export function unlockThemeForUser(userId: string, themeId: string): UserProfile {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');
  const theme = ARENA_THEMES.find((t) => t.id === themeId);
  if (!theme) throw new Error('Theme not found.');
  if (!user.unlockedThemes.includes(themeId)) {
    if (user.coins < theme.cost) {
      throw new Error(`Not enough coins. Need ${theme.cost} coins.`);
    }
    user.coins -= theme.cost;
    user.unlockedThemes.push(themeId);
  }
  user.settings.activeArenaTheme = themeId;
  saveDb(db);
  return sanitizeUser(user);
}

export function getAdminOverview(): AdminOverviewData {
  const db = loadDb();
  const totalUsers = db.users.length;
  const totalSessions = db.sessions.length;
  const avgWpm =
    totalSessions > 0
      ? Math.round(db.sessions.reduce((acc, s) => acc + s.wpm, 0) / totalSessions)
      : 0;
  const avgAccuracy =
    totalSessions > 0
      ? Math.round(db.sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions)
      : 0;
  const modeCounts: Record<string, number> = {};
  for (const s of db.sessions) {
    modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;
  }

  return {
    stats: {
      totalUsers,
      totalSessions,
      avgWpm,
      avgAccuracy,
      modeCounts,
    },
    users: db.users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      coins: u.coins,
      level: u.level,
      totalTests: u.totalTests,
      createdAt: u.createdAt,
    })),
    recentSessions: db.sessions.slice(0, 25),
  };
}
