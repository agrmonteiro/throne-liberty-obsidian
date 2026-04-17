# Technology Stack

**Analysis Date:** 2026-04-11

## Languages

**Primary:**
- TypeScript 5.5.3 — all source code (main process, preload, renderer)

**No secondary language** in this project; Python is used externally by a sibling project (`throne_and_liberty_agent`) whose scraper is spawned as a child process.

## Runtime

**Environment:**
- Electron 31.2.1 — desktop runtime (Chromium + Node.js bundled)
- Node.js — embedded inside Electron; no standalone Node version pinned (no `.nvmrc`)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- React 18.3.1 — renderer UI (`src/`)
- Electron 31.2.1 — desktop shell (`electron/`)

**State Management:**
- Zustand 4.5.5 — single global store at `src/store/useBuilds.ts`

**Charts:**
- Recharts 2.12.7 — used in pages for damage/elasticity charts

**Styling:**
- Tailwind CSS 3.4.6 — utility classes, configured at `tailwind.config.js`
- PostCSS 8.4.39 + Autoprefixer 10.4.19 — configured at `postcss.config.js`
- Custom CSS design system — `src/styles/globals.css` (CSS variables + utility classes)

**Testing:**
- Not detected — no test runner configured, no test files present

**Build/Dev:**
- electron-vite 2.3.0 — unified build tool for Electron + Vite; config at `electron.vite.config.ts`
- Vite 5.3.4 — renderer bundler (used under electron-vite)
- @vitejs/plugin-react 4.3.1 — JSX transform for renderer
- electron-builder 24.13.3 — packaging/installer for Windows (NSIS target); configured in `package.json` `"build"` section

## Key Dependencies

**Critical:**
- `recharts` ^2.12.7 — charts for Calculator, Comparator, Sensitivity pages
- `zustand` ^4.5.5 — all app state (builds, active build, load/save)

**Electron Toolkit:**
- `@electron-toolkit/preload` ^3.0.1 — `electronAPI` helper exposed via `contextBridge` in `electron/preload/index.ts`
- `@electron-toolkit/utils` ^3.0.0 — `electronApp`, `optimizer`, `is` helpers used in `electron/main/index.ts`

**Fonts (external CDN):**
- Inter, Noto Serif, JetBrains Mono — loaded from Google Fonts in `src/styles/globals.css`

## Configuration

**TypeScript — project references setup:**
- `tsconfig.json` — root, references `tsconfig.node.json` and `tsconfig.web.json`
- `tsconfig.node.json` — covers `electron/**/*` and `electron.vite.config.*`; target ES2022, no DOM lib
- `tsconfig.web.json` — covers `src/**/*`; target ES2022 + DOM, jsx react-jsx, path alias `@/*` → `src/*`

**Build:**
- `electron.vite.config.ts` — three build targets:
  - `main`: `electron/main/index.ts` → `dist-electron/main/index.js`
  - `preload`: `electron/preload/index.ts` → `dist-electron/preload/index.js`
  - `renderer`: `index.html` → `dist/`; alias `@` = `src/`

**Packaging:**
- `package.json` `"build"` section — appId `com.thronebuilds.obsidian`, NSIS installer, output to `release/`

## npm Scripts

```bash
npm run dev       # electron-vite dev (hot reload)
npm run build     # electron-vite build
npm run package   # electron-vite build && electron-builder --win
npm run preview   # electron-vite preview
```

## Platform Requirements

**Development:**
- Windows (primary; no cross-platform CI detected)
- Python must be in PATH for the questlog Python scraper fallback (`questlog:import-python` IPC handler)

**Production:**
- Windows desktop app, NSIS installer, output at `release/`
- App user data stored in `AppData/Roaming/throne-liberty/data/`

---

*Stack analysis: 2026-04-11*
