# Architecture

**Analysis Date:** 2026-04-11

## Pattern Overview

**Overall:** Electron desktop app with a strict main/renderer process split. The renderer is a single-page React application with client-side-only routing (no router library — manual `useState` page switching). State is centralized in a single Zustand store. The engine is a pure functional TypeScript module with no side effects.

**Key Characteristics:**
- Hard process boundary enforced by `contextIsolation: true` and `nodeIntegration: false`
- All file system and network I/O is locked to the main process, exposed via IPC
- The renderer has zero direct access to Node.js APIs — it communicates exclusively through `window.dataAPI`
- The damage calculation engine (`src/engine/`) is fully pure: no imports from React, no side effects, deterministic math only
- Persistence is JSON files on disk in `AppData/Roaming/throne-liberty/data/` — no database

## Layers

**Main Process (Electron host):**
- Purpose: Owns all privileged operations — file I/O, native dialogs, HTTP requests, child process spawning
- Location: `electron/main/index.ts`
- Contains: IPC handlers, window lifecycle, data directory bootstrap, tRPC HTTP client, Python scraper launcher
- Depends on: Node.js built-ins (`fs`, `path`, `child_process`), Electron APIs (`app`, `BrowserWindow`, `ipcMain`, `dialog`, `net`, `shell`)
- Used by: Nothing (top of the stack)

**Preload Bridge:**
- Purpose: Secure bridge that selectively exposes main-process capabilities to the renderer via `contextBridge`
- Location: `electron/preload/index.ts`
- Contains: `dataAPI` object with typed wrappers around every `ipcRenderer.invoke()` call
- Depends on: `electron` (`contextBridge`, `ipcRenderer`), `@electron-toolkit/preload`
- Used by: Renderer (accesses as `window.dataAPI`)

**Renderer — State Layer:**
- Purpose: Single source of truth for all build data in the renderer process
- Location: `src/store/useBuilds.ts`
- Contains: Zustand store (`useBuilds`) with all async actions — load, save, delete, import (file/URL/Python), export, create
- Depends on: `window.dataAPI` (IPC bridge), `src/engine/questlogParser.ts`, `src/engine/types.ts`
- Used by: All page components

**Renderer — Engine Layer:**
- Purpose: Pure damage calculation mathematics — no React, no side effects
- Location: `src/engine/`
- Contains:
  - `types.ts` — all TypeScript interfaces (`BuildStats`, `Build`, `BuildMap`, `DamageResult`, `SensitivityEntry`, `ElasticityPoint`) and `DEFAULT_STATS`
  - `calculator.ts` — damage formulas (`calcAverageDPS`, `calcResult`, `calcSensitivity`, `calcElasticity`, `critChanceFromStat`, `heavyChanceFromStat`)
  - `questlogParser.ts` — converts raw tRPC API response (`QuestlogApiResult`) into a normalized `Build` object
- Depends on: Nothing external (pure TypeScript)
- Used by: `src/store/useBuilds.ts` (parser), all page components (calculator functions)

**Renderer — UI Layer:**
- Purpose: React components that render the app UI and dispatch actions to the store
- Location: `src/App.tsx`, `src/components/`, `src/pages/`
- Contains: `App` (shell + page routing), `Sidebar` (navigation), 5 page components
- Depends on: Zustand store, engine functions, `recharts`
- Used by: `src/main.tsx`

## Data Flow

**Build Import via Questlog URL (tRPC path):**

1. User pastes URL in `Builds.tsx` → calls `useBuilds.importFromUrl(url)`
2. Store calls `window.dataAPI.questlogImport(url)` → crosses IPC to main process
3. Main process (`ipcMain.handle('questlog:import-url', ...)`) parses URL, calls Questlog tRPC API via `net.fetch`
4. Raw JSON response returns to renderer as `QuestlogApiResult`
5. `parseQuestlogResult()` in `src/engine/questlogParser.ts` normalizes it into a typed `Build` object
6. Store calls `window.dataAPI.write('builds.json', builds)` → IPC → main process writes to disk atomically (tmp + rename)
7. Zustand state updates via `set({ builds })` → React re-renders

**Build Import via Python Scraper:**

1. User checks "Scraper Python" checkbox, pastes URL → calls `useBuilds.importFromUrlPython(url)`
2. Store calls `window.dataAPI.questlogImportPython(url)` → IPC to main
3. Main spawns `python questlog_scraper_standalone.py <url>` as child process
4. Waits for process exit, reads stdout JSON (skipping any debug stderr lines)
5. Returns raw object to renderer → `parsePythonBuild()` in `useBuilds.ts` handles two scraper output formats (new: `{meta, attributes, stats}`, old: `{stats, character_name}`)
6. Saved and state updated as above

**Build Persistence (Read/Write):**

1. On app start: `App.tsx` `useEffect` calls `loadFromDisk()` → reads `builds.json` from `AppData/Roaming/throne-liberty/data/`
2. Any mutation (save/delete) writes the full `BuildMap` back to disk immediately (synchronous write via IPC)
3. Atomic write: main process writes to `.tmp` file then `renameSync` to avoid corruption

**DPS Calculation (in-memory, no IPC):**

1. Page components call `calcAverageDPS(build.stats)` or `calcResult()` directly — pure synchronous call
2. `useMemo` gates recalculation — only runs when `builds` or selected stat objects change
3. No server round-trips; all math happens in renderer memory

**State Management:**

- Single Zustand store (`src/store/useBuilds.ts`) holds `builds: BuildMap`, `activeBuildId: string | null`, `loading: boolean`
- No React Context, no Redux, no prop drilling past one level
- `App.tsx` manages only `page: Page` state (current view) as local `useState`
- Page-level local state (e.g., selected columns in Calculator, edit panel open in Builds) stays in each page component via `useState`

## Key Abstractions

**`Build` (the core domain object):**
- Purpose: A complete saved character build with both normalized DPS stats and the raw scraper data
- Defined in: `src/engine/types.ts`
- Has two stat layers: `stats: BuildStats` (14 normalized fields used by the engine) and `rawStats: Record<string, string>` + `rawAttributes` (full scraper dump for display/editing)

**`BuildStats` (engine input contract):**
- Purpose: The exact 14 numeric fields the damage engine operates on
- Defined in: `src/engine/types.ts`
- Any import path (tRPC, Python new format, Python old format, manual) must produce a valid `BuildStats` before saving

**`dataAPI` (IPC surface):**
- Purpose: The only legal way for renderer code to touch the file system or network
- Defined in: `electron/preload/index.ts` (implementation), `src/store/useBuilds.ts` (TypeScript declaration on `Window`)
- Methods: `read`, `write`, `importFile`, `exportFile`, `dir`, `questlogImport`, `questlogImportPython`

**`window.dataAPI` Global Declaration:**
- Declared as `interface Window { dataAPI: ... }` inside `src/store/useBuilds.ts`
- This means `window.dataAPI` is typed but only accessible at runtime via the preload bridge

## Entry Points

**Electron Main:**
- Location: `electron/main/index.ts`
- Triggers: Electron app launch (`app.whenReady()`)
- Responsibilities: Creates `BrowserWindow`, registers all IPC handlers, bootstraps data directory, manages app lifecycle

**Preload Script:**
- Location: `electron/preload/index.ts`
- Triggers: Injected by Electron before renderer HTML loads (specified in `webPreferences.preload`)
- Responsibilities: Exposes `window.electron` (from `@electron-toolkit/preload`) and `window.dataAPI` via `contextBridge`

**Renderer Bootstrap:**
- Location: `src/main.tsx`
- Triggers: Loaded via `<script type="module" src="/src/main.tsx">` in `index.html`
- Responsibilities: Mounts `<App />` into `#root`

**App Shell:**
- Location: `src/App.tsx`
- Triggers: Rendered by `src/main.tsx`
- Responsibilities: Loads builds from disk on mount, owns page routing state, renders `<Sidebar>` + current `<PageComponent>`

## Error Handling

**Strategy:** Silent degradation with optional user-visible status messages. No global error boundary.

**Patterns:**
- IPC handlers in main process wrap everything in `try/catch` and return `{ ok: false, error: string }` or `null` on failure — never throw across IPC
- Import functions in the store return `{ error: string }` objects (not thrown exceptions) for import failures
- The `Builds` page displays a status bar (`showStatus`) for 5 seconds on import success/failure
- `readBuilds()` helper returns `{}` on any error — the app starts empty rather than crashing
- Python scraper errors include the stderr output truncated to 300 characters in the error message

## Cross-Cutting Concerns

**Logging:** `console.error` in main process IPC handlers only. No structured logging, no log files.
**Validation:** No schema validation (no Zod/Yup). Type narrowing is done manually with `typeof` checks in parsers.
**Authentication:** Not applicable — local desktop app, no user accounts.
**Styling:** CSS custom properties defined in `src/styles/globals.css` as design tokens (`--bg`, `--gold`, `--violet`, etc.). Tailwind is imported but the primary styling mechanism is inline `style` props combined with named CSS utility classes (`tl-card`, `tl-btn`, `tl-input`, etc.).

---

*Architecture analysis: 2026-04-11*
