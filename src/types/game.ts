export type ThemeMode = 'dark' | 'light';

export type SoundProfile = 'mechanical' | 'soft' | 'off';

export type CaretStyle = 'line' | 'block' | 'underline';

export type GameModeId =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'speed-challenge'
  | '1-minute'
  | '2-minute'
  | '5-minute'
  | 'daily-challenge'
  | 'endless'
  | 'lesson';

export type LessonCategory =
  | 'home-row'
  | 'left-hand'
  | 'right-hand'
  | 'alphabet'
  | 'words'
  | 'sentences'
  | 'numbers-symbols'
  | 'advanced';

export interface UserSettings {
  themeMode: ThemeMode;
  soundProfile: SoundProfile;
  showKeyboard: boolean;
  showFingerColors: boolean;
  caretStyle: CaretStyle;
  activeArenaTheme: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  userName: string;
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
  score: number;
  coinsEarned: number;
  xpEarned: number;
  createdAt: string;
  missedKeys?: Record<string, number>;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  coins: number;
  xp: number;
  level: number;
  streakDays: number;
  lastDailyDate: string | null;
  unlockedThemes: string[];
  achievements: string[];
  completedLessons: Record<string, { bestWpm: number; bestAccuracy: number; stars: number }>;
  personalBests: Partial<Record<GameModeId, { wpm: number; accuracy: number; score: number; date: string }>>;
  totalTests: number;
  totalWords: number;
  settings: UserSettings;
  createdAt: string;
}

export interface LessonItem {
  id: string;
  title: string;
  category: LessonCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  order: number;
  description: string;
  text: string;
  targetWpm: number;
  targetAccuracy: number;
  coinReward: number;
  isCustom?: boolean;
}

export interface WordPoolItem {
  id: string;
  pool: 'beginner' | 'intermediate' | 'advanced' | 'speed' | 'daily';
  text: string;
  isCustom?: boolean;
}

export interface GameModeConfig {
  id: Exclude<GameModeId, 'lesson'>;
  title: string;
  shortTitle: string;
  description: string;
  durationSeconds: number; // 0 = untimed / until complete / endless
  targetWpm: number;
  coinMultiplier: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Timed' | 'Special';
  enabled: boolean;
}

export interface ArenaTheme {
  id: string;
  name: string;
  description: string;
  cost: number;
  previewImage?: string;
  backdropClass: string;
  accentLabel: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  coinBonus: number;
  requirementLabel: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  level: number;
  mode: GameModeId;
  modeLabel: string;
  wpm: number;
  accuracy: number;
  wordsTyped: number;
  score: number;
  createdAt: string;
}

export interface AdminOverviewData {
  stats: {
    totalUsers: number;
    totalSessions: number;
    avgWpm: number;
    avgAccuracy: number;
    modeCounts: Record<string, number>;
  };
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    status: 'active' | 'suspended';
    coins: number;
    level: number;
    totalTests: number;
    createdAt: string;
  }>;
  recentSessions: SessionRecord[];
}
