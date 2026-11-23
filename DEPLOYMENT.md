# Hasnain Typing — Deployment & Store Publishing Guide

## 1. Local Development & Production Web Server

1. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET` (32+ random characters).
   - Optional: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (and `APP_URL`) to enable Google Sign-In.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server (Express API + Vite HMR/PWA on port 3000):
   ```bash
   npm run dev
   ```
4. Build and start production server:
   ```bash
   npm run build
   npm start
   ```

## 2. Website Deployment with a Custom Domain

- **Cloud Run / Railway / Fly.io / Render / VPS**:
  - Build command: `npm run build`
  - Start command: `npm start`
  - Exposed port: `3000` (or `process.env.PORT`)
  - Persist the `data/` directory on a mounted volume (or set up automated backups) to retain user accounts, leaderboard scores, and custom admin lessons across redeploys.
  - Attach your custom domain (e.g., `https://hasnaintyping.com`) with TLS/HTTPS enabled so PWA installability and Service Workers register automatically.

## 3. Google Play Store (Android APK & AAB)

### Option A: Capacitor Native Wrapper (Recommended for full offline & Play Billing support)
1. Build the production web bundle:
   ```bash
   npm run build
   ```
2. Install Capacitor Android platform:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```
4. Configure your release keystore, then generate **Build -> Generate Signed Bundle / APK** -> **Android App Bundle (.aab)** for Google Play Console upload (or `.apk` for direct distribution).

### Option B: Trusted Web Activity (TWA) via Bubblewrap
1. Deploy your HTTPS custom domain first.
2. Run Bubblewrap against your deployed Web App Manifest (`https://your-domain.com/manifest.webmanifest`):
   ```bash
   npx @bubblewrap/cli init --manifest https://your-domain.com/manifest.webmanifest
   npx @bubblewrap/cli build
   ```
3. Upload the generated `.aab` to Google Play Console and add your SHA-256 asset link fingerprint in `public/.well-known/assetlinks.json`.

## 4. Apple App Store (iOS / iPadOS)

1. On macOS with Xcode installed, add the iOS Capacitor target:
   ```bash
   npm run build
   npm install @capacitor/ios
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
2. Set your Bundle Identifier (`app.hasnaintyping.game`), Signing Team, and App Icons in Xcode.
3. Archive (**Product -> Archive**) and upload to App Store Connect.

## 5. Seeded Admin Account

- **Email**: `oihcchasnsijhb@gmail.com` (or `admin@typingname.app`)
- **Initial Password**: `TypingAdmin2026!`
- Use the Admin Console (`/admin` link in footer or Account menu) to add typing lessons, expand word/sentence banks, manage users, and adjust game mode parameters.
