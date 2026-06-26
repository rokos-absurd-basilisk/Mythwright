# Building Mythwright

## Web (always works)

```bash
npm install
npm run build
# Output: dist/ — deploy to any static host
```

---

## Desktop with Tauri (recommended over Electron)

Tauri produces a ~8MB native binary using the OS WebView (no bundled Chromium).
Memory at idle: ~50MB vs Electron's ~200MB.

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 2. Install system dependencies

**macOS** — no extra steps. WebKit is built in.

**Windows** — install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
(already on Windows 10 21H2+ and Windows 11).

**Linux (Debian/Ubuntu)**
```bash
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev \
  libgtk-3-dev libsoup-3.0-dev javascriptcoregtk-4.1-dev
```

**Linux (Fedora)**
```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel \
  librsvg2-devel gtk3-devel
```

### 3. Run / Build

```bash
# Development (hot-reload via Vite)
npm run tauri:dev

# Production builds
npm run tauri:build

# Specific platform targets
npx tauri build --bundles dmg          # macOS .dmg
npx tauri build --bundles msi,nsis     # Windows .msi + installer
npx tauri build --bundles deb          # Debian .deb
npx tauri build --bundles appimage     # Linux .AppImage (portable)
npx tauri build --bundles rpm          # Red Hat .rpm
```

### Output locations

```
src-tauri/target/release/bundle/
  macos/    Mythwright.app + Mythwright.dmg
  msi/      Mythwright_1.0.0_x64.msi
  nsis/     Mythwright_1.0.0_x64-setup.exe
  deb/      mythwright_1.0.0_amd64.deb
  appimage/ Mythwright_1.0.0_amd64.AppImage
  rpm/      mythwright-1.0.0-1.x86_64.rpm
```

### Code signing (optional for distribution)

**macOS** — set `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`,
`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`
env vars. See `src-tauri/tauri.conf.json` → `bundle.macOS`.

**Windows** — set `TAURI_SIGNING_PRIVATE_KEY` and
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` for sideload signing,
or configure a code-signing certificate in `bundle.windows`.

---

## PWA (zero-install, works offline)

The app already runs fully offline (localStorage-first architecture).
To make it installable from the browser:

1. Add to `vite.config.ts`:
   ```ts
   import { VitePWA } from 'vite-plugin-pwa'
   plugins: [react(), VitePWA({ registerType: 'autoUpdate' })]
   ```
2. `npm install -D vite-plugin-pwa`
3. `npm run build` → deploy `dist/` to HTTPS

Users can then install from the browser's address bar (Chrome/Edge/Safari).

---

## Auto-updater (Tauri built-in)

Tauri ships a built-in updater. To enable:

1. Generate a key pair: `npx tauri signer generate`
2. Add `tauri-plugin-updater` to `Cargo.toml`
3. Set `TAURI_SIGNING_PRIVATE_KEY` in CI
4. Configure update endpoint in `tauri.conf.json` → `plugins.updater`

See https://v2.tauri.app/plugin/updater/ for full setup.
