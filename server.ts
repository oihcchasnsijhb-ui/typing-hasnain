import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import {
  getAdminOverview,
  getMergedLessons,
  getMergedWordPools,
  loadDb,
  loginUser,
  recordSessionForUser,
  registerUser,
  sanitizeUser,
  saveDb,
  unlockThemeForUser,
  upsertGoogleUser,
  verifyToken,
} from './server/store.ts';
import type { GameModeConfig, LessonItem, WordPoolItem } from './src/types/game.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

function getAuthPayload(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return verifyToken(token);
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const payload = getAuthPayload(req);
  if (!payload) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const db = loadDb();
  const user = db.users.find((u) => u.id === payload.userId);
  if (!user || user.status === 'suspended') {
    res.status(401).json({ error: 'Account unavailable or suspended.' });
    return;
  }
  res.locals.authUser = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  requireAuth(req, res, () => {
    const user = res.locals.authUser;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Administrator privileges required.' });
      return;
    }
    next();
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health & auth provider capability
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'Hasnain Typing' });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      googleEnabled: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    });
  });

  // Google OAuth redirect flow (active when GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET are configured)
  app.get('/api/auth/google', (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(501).json({ error: 'Google OAuth is not configured on this server.' });
      return;
    }
    const redirectUri = `${APP_URL.replace(/\/$/, '')}/api/auth/google/callback`;
    const state = crypto.randomBytes(16).toString('hex');
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const code = typeof req.query.code === 'string' ? req.query.code : '';
      if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        res.redirect('/?authError=google_unavailable');
        return;
      }
      const redirectUri = `${APP_URL.replace(/\/$/, '')}/api/auth/google/callback`;
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData = (await tokenResp.json()) as { access_token?: string };
      if (!tokenData.access_token) {
        res.redirect('/?authError=google_token_failed');
        return;
      }
      const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = (await profileResp.json()) as { id?: string; email?: string; name?: string };
      if (!profile.id || !profile.email) {
        res.redirect('/?authError=google_profile_failed');
        return;
      }
      const { token } = upsertGoogleUser(profile.id, profile.email, profile.name || profile.email.split('@')[0]);
      res.redirect(`/?oauthToken=${encodeURIComponent(token)}`);
    } catch {
      res.redirect('/?authError=google_callback_error');
    }
  });

  // Email/Password Auth
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { email, password, displayName } = req.body as {
        email?: string;
        password?: string;
        displayName?: string;
      };
      const result = registerUser(email || '', password || '', displayName || '');
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Signup failed.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      const result = loginUser(email || '', password || '');
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'Login failed.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = res.locals.authUser;
    const db = loadDb();
    const history = db.sessions.filter((s) => s.userId === user.id).slice(0, 50);
    res.json({ user: sanitizeUser(user), history });
  });

  app.patch('/api/auth/profile', requireAuth, (req, res) => {
    const db = loadDb();
    const authUser = res.locals.authUser;
    const user = db.users.find((u) => u.id === authUser.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { displayName, settings } = req.body as {
      displayName?: string;
      settings?: Partial<typeof user.settings>;
    };
    if (typeof displayName === 'string' && displayName.trim().length > 0) {
      user.displayName = displayName.trim().slice(0, 32);
    }
    if (settings && typeof settings === 'object') {
      user.settings = {
        ...user.settings,
        ...settings,
      };
      // Ensure activeArenaTheme is actually unlocked
      if (!user.unlockedThemes.includes(user.settings.activeArenaTheme)) {
        user.settings.activeArenaTheme = 'obsidian-core';
      }
    }
    saveDb(db);
    res.json({ user: sanitizeUser(user) });
  });

  // Public content (lessons, word pools, mode configs, daily challenge date)
  app.get('/api/content', (_req, res) => {
    const db = loadDb();
    res.json({
      lessons: getMergedLessons(db),
      wordPools: getMergedWordPools(db),
      modeConfigs: db.modeConfigs,
      dailyDate: new Date().toISOString().slice(0, 10),
    });
  });

  // Record a completed typing session (works for authenticated users and guests)
  app.post('/api/sessions', (req, res) => {
    try {
      const authPayload = getAuthPayload(req);
      const body = req.body as Parameters<typeof recordSessionForUser>[1];
      if (!body || !body.mode || typeof body.wpm !== 'number') {
        res.status(400).json({ error: 'Invalid session payload.' });
        return;
      }
      const result = recordSessionForUser(authPayload?.userId ?? null, body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to save session.' });
    }
  });

  // Unlock & equip theme with coins
  app.post('/api/shop/unlock-theme', requireAuth, (req, res) => {
    try {
      const { themeId } = req.body as { themeId?: string };
      if (!themeId) {
        res.status(400).json({ error: 'themeId is required.' });
        return;
      }
      const user = unlockThemeForUser(res.locals.authUser.id, themeId);
      res.json({ user });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Could not unlock theme.' });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', (req, res) => {
    const db = loadDb();
    const mode = typeof req.query.mode === 'string' ? req.query.mode : 'all';
    const items =
      mode === 'all'
        ? db.leaderboard
        : db.leaderboard.filter((entry) => entry.mode === mode);
    res.json({ entries: items.slice(0, 50) });
  });

  // Admin APIs
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    res.json(getAdminOverview());
  });

  app.post('/api/admin/lessons', requireAdmin, (req, res) => {
    const db = loadDb();
    const payload = req.body as Partial<LessonItem>;
    if (!payload.title || !payload.text || !payload.category) {
      res.status(400).json({ error: 'Title, category, and lesson text are required.' });
      return;
    }
    const existingLessons = getMergedLessons(db);
    const lesson: LessonItem = {
      id: `lesson-custom-${crypto.randomUUID().slice(0, 8)}`,
      title: payload.title.trim().slice(0, 80),
      category: payload.category,
      difficulty: payload.difficulty || 'Beginner',
      order: typeof payload.order === 'number' ? payload.order : existingLessons.length + 1,
      description: (payload.description || 'Custom typing drill').trim().slice(0, 200),
      text: payload.text.trim(),
      targetWpm: Math.max(10, Number(payload.targetWpm) || 30),
      targetAccuracy: Math.min(100, Math.max(70, Number(payload.targetAccuracy) || 92)),
      coinReward: Math.max(10, Number(payload.coinReward) || 40),
      isCustom: true,
    };
    db.customLessons.push(lesson);
    saveDb(db);
    res.status(201).json({ lesson, lessons: getMergedLessons(db) });
  });

  app.put('/api/admin/lessons/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const id = req.params.id;
    const all = getMergedLessons(db);
    const existing = all.find((l) => l.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
    const payload = req.body as Partial<LessonItem>;
    const updated: LessonItem = {
      ...existing,
      title: payload.title?.trim() || existing.title,
      category: payload.category || existing.category,
      difficulty: payload.difficulty || existing.difficulty,
      description: payload.description?.trim() || existing.description,
      text: payload.text?.trim() || existing.text,
      targetWpm: typeof payload.targetWpm === 'number' ? payload.targetWpm : existing.targetWpm,
      targetAccuracy: typeof payload.targetAccuracy === 'number' ? payload.targetAccuracy : existing.targetAccuracy,
      coinReward: typeof payload.coinReward === 'number' ? payload.coinReward : existing.coinReward,
      order: typeof payload.order === 'number' ? payload.order : existing.order,
    };
    const idx = db.customLessons.findIndex((l) => l.id === id);
    if (idx >= 0) {
      db.customLessons[idx] = updated;
    } else {
      db.customLessons.push(updated);
    }
    saveDb(db);
    res.json({ lesson: updated, lessons: getMergedLessons(db) });
  });

  app.delete('/api/admin/lessons/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const id = req.params.id;
    db.customLessons = db.customLessons.filter((l) => l.id !== id);
    if (!db.deletedLessonIds.includes(id)) {
      db.deletedLessonIds.push(id);
    }
    saveDb(db);
    res.json({ lessons: getMergedLessons(db) });
  });

  app.post('/api/admin/words', requireAdmin, (req, res) => {
    const db = loadDb();
    const { pool, text } = req.body as { pool?: WordPoolItem['pool']; text?: string };
    if (!pool || !text || !text.trim()) {
      res.status(400).json({ error: 'Pool and text are required.' });
      return;
    }
    const item: WordPoolItem = {
      id: `wp-custom-${crypto.randomUUID().slice(0, 8)}`,
      pool,
      text: text.trim(),
      isCustom: true,
    };
    db.customWordPools.push(item);
    saveDb(db);
    res.status(201).json({ item, wordPools: getMergedWordPools(db) });
  });

  app.delete('/api/admin/words/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const id = req.params.id;
    db.customWordPools = db.customWordPools.filter((w) => w.id !== id);
    if (!db.deletedWordPoolIds.includes(id)) {
      db.deletedWordPoolIds.push(id);
    }
    saveDb(db);
    res.json({ wordPools: getMergedWordPools(db) });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { role, status, grantCoins } = req.body as {
      role?: 'user' | 'admin';
      status?: 'active' | 'suspended';
      grantCoins?: number;
    };
    if (role === 'user' || role === 'admin') {
      target.role = role;
    }
    if (status === 'active' || status === 'suspended') {
      target.status = status;
    }
    if (typeof grantCoins === 'number' && Number.isFinite(grantCoins)) {
      target.coins = Math.max(0, target.coins + Math.round(grantCoins));
    }
    saveDb(db);
    res.json({ user: sanitizeUser(target) });
  });

  app.put('/api/admin/modes/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.modeConfigs.findIndex((m) => m.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: 'Game mode not found.' });
      return;
    }
    const payload = req.body as Partial<GameModeConfig>;
    db.modeConfigs[idx] = {
      ...db.modeConfigs[idx],
      durationSeconds:
        typeof payload.durationSeconds === 'number' ? Math.max(0, payload.durationSeconds) : db.modeConfigs[idx].durationSeconds,
      targetWpm: typeof payload.targetWpm === 'number' ? Math.max(10, payload.targetWpm) : db.modeConfigs[idx].targetWpm,
      coinMultiplier:
        typeof payload.coinMultiplier === 'number' ? Math.max(0.5, payload.coinMultiplier) : db.modeConfigs[idx].coinMultiplier,
      enabled: typeof payload.enabled === 'boolean' ? payload.enabled : db.modeConfigs[idx].enabled,
    };
    saveDb(db);
    res.json({ modeConfigs: db.modeConfigs });
  });

  // Vite integration in development / static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hasnain Typing server running at http://localhost:${PORT}`);
  });
}

startServer();
