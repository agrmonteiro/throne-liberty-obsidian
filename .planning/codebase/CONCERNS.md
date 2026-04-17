# Codebase Concerns

**Analysis Date:** 2026-04-11
**Project:** Throne & Liberty — Obsidian Command (Electron + React + Vite)

---

## Security Concerns

### [HIGH] `sandbox: false` in BrowserWindow webPreferences

- **Files:** `electron/main/index.ts` (line 243)
- **Issue:** `sandbox: false` is set explicitly. Electron's renderer sandbox is disabled, meaning any code executing in the renderer process (including injected scripts if XSS occurred) has access to Node.js built-ins indirectly through the preload. This is the single most impactful security setting in an Electron app.
- **Mitigating factor:** `contextIsolation: true` and `nodeIntegration: false` are correctly set, and there is no direct Node access from the renderer. The `@electron-toolkit/preload` electronAPI is also exposed.
- **Fix approach:** Set `sandbox: true`. Verify that `@electron-toolkit/preload` and the custom `dataAPI` still function correctly (they should, as they use `contextBridge`). Sandboxed preload scripts are supported in modern Electron.

---

### [HIGH] Path traversal via IPC: `data:read` and `data:write` accept arbitrary filenames

- **Files:** `electron/main/index.ts` (lines 31–55)
- **Issue:** Both `data:read` and `data:write` accept a `filename` string from the renderer, then join it directly with `DATA_DIR` using `path.join`. A malicious or bugged renderer could pass `../../AppData/Roaming/SensitiveApp/config.json` or similar relative paths and read/write arbitrary files in the user's AppData.
- **Example:** `window.dataAPI.read('../../Roaming/SomeApp/credentials.json')`
- **Fix approach:** Add a validation function that checks the resolved path starts with `DATA_DIR`:
  ```ts
  function safeDataPath(filename: string): string {
    const resolved = path.resolve(DATA_DIR, filename)
    if (!resolved.startsWith(DATA_DIR + path.sep)) throw new Error('Path traversal blocked')
    return resolved
  }
  ```

---

### [MEDIUM] `shell.openExternal` called for all new-window URLs without allowlist

- **Files:** `electron/main/index.ts` (lines 253–256)
- **Issue:** Every `window.open()` or link with `target="_blank"` in the renderer is forwarded to the OS via `shell.openExternal(details.url)` with no URL validation. If a third-party library renders an untrusted URL (e.g., from imported build data containing a `sourceUrl`), it could open `file://` paths or `javascript:` URIs on some OS/shell combinations.
- **Fix approach:** Validate the URL before opening:
  ```ts
  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = new URL(details.url)
    if (['https:', 'http:'].includes(url.protocol)) shell.openExternal(details.url)
    return { action: 'deny' }
  })
  ```

---

### [MEDIUM] Preload fallback assigns globals directly when `contextIsolated` is false

- **Files:** `electron/preload/index.ts` (lines 22–27)
- **Issue:** The `else` branch sets `window.electron` and `window.dataAPI` directly with `// @ts-ignore`, bypassing TypeScript safety. In a hypothetical non-isolated context this widens the attack surface. The `@ts-ignore` comments also silence real type errors.
- **Fix approach:** If `sandbox: true` is adopted, `process.contextIsolated` will always be `true` and this branch becomes dead code. Until then, at minimum replace `@ts-ignore` with a proper type assertion.

---

### [MEDIUM] External tRPC request sends Referer header spoofing questlog.gg

- **Files:** `electron/main/index.ts` (lines 111–117)
- **Issue:** The `trpcGet` function sends `Referer: https://questlog.gg/throne-and-liberty/en/character-builder/` and `User-Agent: Mozilla/5.0` to impersonate a browser. This is a terms-of-service concern for the questlog.gg API and could break if the API implements bot detection. There is no rate limiting on the IPC handler.
- **Fix approach:** Document the dependency on questlog.gg as a best-effort scrape, add a rate-limit guard (e.g., 1 req/2s), and handle 429/403 responses gracefully with a user-visible error.

---

### [LOW] Python scraper spawned with inherited full environment

- **Files:** `electron/main/index.ts` (lines 193)
- **Issue:** `spawn(pythonBin, [scriptPath, url], { env: { ...process.env } })` passes the complete Electron process environment to the child process. This includes any secrets injected via environment variables (e.g., CI tokens, cloud credentials) that happen to be in the parent process's env.
- **Fix approach:** Pass a minimal environment: `{ env: { PATH: process.env['PATH'] ?? '' } }`. Only add specific vars the scraper actually needs.

---

## Technical Debt

### [HIGH] Duplicate format-conversion logic across three files

- **Files:**
  - `src/engine/questlogParser.ts` — `parseQuestlogResult()`, `numVal()`, `minVal()`, `maxVal()`
  - `src/store/useBuilds.ts` — `parseNewScraperFormat()`, `parseOldFormat()`, `statNum()`, `s()`
- **Issue:** Three separate parsers for overlapping data shapes (tRPC API result, new scraper format, old scraper format), each with their own `parseFloat`/`replace` helpers. The species damage key list `['Species Damage Boost', 'Demon Damage Boost', ...]` is literally copy-pasted between `questlogParser.ts` (line 119) and `useBuilds.ts` (lines 231 and 305). Any game stat rename requires updates in multiple locations.
- **Fix approach:** Extract a shared `src/engine/statNormalizer.ts` module containing the key lists, string-to-number coercion, and a unified build shape converter. Both parsers delegate to it.

---

### [HIGH] No auto-update mechanism

- **Files:** `package.json`, `electron/main/index.ts`
- **Issue:** `electron-updater` is not installed and there is no auto-update logic. The app is packaged as NSIS (Windows installer), so users have no way to receive updates automatically. The version is hardcoded at `"1.0.0"` in `package.json` with no update channel configured in `electron-builder`.
- **Fix approach:** Add `electron-updater` dependency, configure `publish` in `package.json` build config (GitHub Releases or S3), and call `autoUpdater.checkForUpdatesAndNotify()` after `app.whenReady()`. This is especially important given the external API dependency on questlog.gg — API changes will require app updates.

---

### [MEDIUM] `newId()` defined twice — once in `questlogParser.ts`, once in `useBuilds.ts`

- **Files:** `src/engine/questlogParser.ts` (line 83), `src/store/useBuilds.ts` (line 57)
- **Issue:** Identical implementation `build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` copy-pasted. Not a bug today, but divergence risk.
- **Fix approach:** Export `newId()` from `src/engine/types.ts` or a shared `src/engine/utils.ts` and import it both places.

---

### [MEDIUM] Inline styles throughout every component — no design token enforcement

- **Files:** `src/pages/Dashboard.tsx`, `src/pages/Builds.tsx`, `src/pages/Calculator.tsx`, `src/pages/Comparator.tsx`, `src/pages/Sensitivity.tsx`, `src/components/Sidebar.tsx`
- **Issue:** Every component uses extensive `style={{ ... }}` inline objects with hardcoded hex colors (`#d4af37`, `#7c5cfc`, `#f25f5c`, etc.) repeated across all six files. No central token map. Changing the color palette requires editing every file manually.
- **Fix approach:** Create `src/styles/tokens.ts` exporting a `COLORS` and `SPACING` constant object, or extend `tailwind.config.js` with the custom palette and use Tailwind utility classes consistently.

---

### [LOW] `@ts-ignore` in preload fallback suppresses real type errors

- **Files:** `electron/preload/index.ts` (lines 23, 25)
- **Issue:** Two `// @ts-ignore` comments silence TypeScript on `window.electron` and `window.dataAPI` assignments in the non-isolated fallback path. The type declarations in `useBuilds.ts` already define these window properties, so the ignores are unnecessary.
- **Fix approach:** Remove `@ts-ignore` and use `(window as Window & typeof globalThis)` cast or extend the global `Window` interface.

---

### [LOW] `settings.json` initialized but never read or used

- **Files:** `electron/main/index.ts` (lines 16–25)
- **Issue:** `settings.json` with `{ theme: 'obsidian', port: 8501 }` is created on first run but no IPC handler reads it, and the renderer never requests it. Dead data file.
- **Fix approach:** Either implement settings persistence (theme switcher, port config for future Python bridge) or remove it from `ensureDataDir` to avoid confusion.

---

## Performance Concerns

### [MEDIUM] DPS recalculated synchronously on every render in Dashboard and Comparator

- **Files:** `src/pages/Dashboard.tsx` (lines 16–19, 25–27), `src/pages/Comparator.tsx` (lines 48–49)
- **Issue:** `calcAverageDPS()` is called inside `useMemo` hooks, which is correct. However, in `Dashboard`, it is also called a *second time* outside the memo on line 25 (`const activeDps = active ? calcAverageDPS(active.stats) : 0`) — duplicating the computation on every render. In `Comparator`, `dpsList` is memoized separately from `selBuilds`, causing unnecessary re-computation when selection order changes.
- **Fix approach:** Include `activeDps` inside the `dpsData` memo and derive it by `id` lookup. In `Comparator`, compute both `selBuilds` and `dpsList` in a single `useMemo`.

---

### [MEDIUM] Elasticity calculation is O(iterations × 6) and runs on the main thread

- **Files:** `src/engine/calculator.ts` (lines 224–243), `src/pages/Calculator.tsx` (line 91)
- **Issue:** `calcElasticity()` runs up to 100 × 6 = 600 calculator invocations synchronously in the renderer thread when the user clicks "Calcular". Each invocation calls `calcAverageDPS()` (several multiplications). At max iterations this is trivial today, but it blocks React's event loop momentarily and does not scale if the formula complexity grows.
- **Fix approach:** Low priority for current formula complexity, but wrapping with `setTimeout(..., 0)` or moving to a Web Worker would future-proof it.

---

### [LOW] All pages are eagerly imported — no code splitting

- **Files:** `src/App.tsx` (lines 3–8)
- **Issue:** All five page components (`Dashboard`, `Calculator`, `Comparator`, `Sensitivity`, `Builds`) are statically imported. The bundle contains everything upfront. For the current app size this is minor, but adding heavy pages (e.g., a data grid with many rows) will slow initial load.
- **Fix approach:** Use `React.lazy` + `Suspense`:
  ```tsx
  const Calculator = React.lazy(() => import('./pages/Calculator'))
  ```

---

### [LOW] Recharts `ResponsiveContainer` inside vertically-scrolling divs can trigger layout thrash

- **Files:** `src/pages/Dashboard.tsx` (line 63), `src/pages/Builds.tsx` (not present), `src/pages/Calculator.tsx` (lines 174, 187, 209)
- **Issue:** Recharts `ResponsiveContainer` uses a `ResizeObserver` internally. When placed inside an `overflow: auto` container whose height changes dynamically, it can trigger continuous re-measurement loops on some browsers.
- **Fix approach:** Always give `ResponsiveContainer` a fixed `height` (already done) *and* an explicit `width` percentage rather than `"100%"` inside flex containers. Alternatively, wrap in a `div` with explicit pixel dimensions.

---

## Missing Error Handling

### [HIGH] `data:write` write-failure is silently ignored by callers

- **Files:** `src/store/useBuilds.ts` (lines 53–55, `writeBuilds` function)
- **Issue:** `writeBuilds()` calls `window.dataAPI.write()` which returns `{ ok: boolean; error?: string }`, but the return value is not checked. If the write fails (disk full, permissions error), the UI shows no error and the in-memory state diverges from disk silently. On next launch, the user loses their builds.
- **Fix approach:**
  ```ts
  async function writeBuilds(builds: BuildMap): Promise<void> {
    const result = await window.dataAPI.write(FILE, builds)
    if (!result.ok) throw new Error(result.error ?? 'Write failed')
  }
  ```
  Then surface the error in `saveBuild` and `deleteBuild` via the store's state.

---

### [HIGH] `importFromFile` swallows all parse errors silently, returning `null`

- **Files:** `src/store/useBuilds.ts` (lines 131–133)
- **Issue:** The `catch` block logs to `console.error` and returns `null`. The UI in `Builds.tsx` (line 137) shows "Importação cancelada ou inválida." for both a user cancellation (expected) and a genuine parse error (unexpected). The user cannot distinguish the two cases or know what went wrong.
- **Fix approach:** Return a typed `{ error: string }` instead of `null` for failures, matching the pattern used by `importFromUrl` and `importFromUrlPython`.

---

### [MEDIUM] Python scraper has no timeout — hangs indefinitely if Playwright stalls

- **Files:** `electron/main/index.ts` (lines 183–222)
- **Issue:** The `questlog:import-python` IPC handler spawns a Python child process with no timeout. If the Playwright scraper hangs (network issue, browser crash, infinite wait), the promise never resolves and the UI loading spinner runs forever. The UI text already acknowledges "pode demorar ~30s" but there is no programmatic enforcement.
- **Fix approach:**
  ```ts
  const timeout = setTimeout(() => {
    proc.kill()
    resolve({ error: 'Timeout: scraper demorou mais de 60s' })
  }, 60_000)
  proc.on('close', () => { clearTimeout(timeout); /* ... */ })
  ```

---

### [MEDIUM] `loadFromDisk` sets `loading: false` even if `readBuilds()` throws

- **Files:** `src/store/useBuilds.ts` (lines 68–76)
- **Issue:** If `readBuilds()` throws (IPC failure, JSON parse error of a corrupt file), the `catch {}` in `readBuilds` returns `{}`, masking the error. The store ends up with an empty builds object and no error state. If the corrupt file is then overwritten on the next save, data is permanently lost.
- **Fix approach:** Let `loadFromDisk` catch separately and expose an `error` field in the store state. Prompt the user before overwriting a corrupt file.

---

### [LOW] `handleDelete` uses `confirm()` — blocked in Electron renderer by default in some configs

- **Files:** `src/pages/Builds.tsx` (line 157)
- **Issue:** `window.confirm()` is a blocking dialog that Electron may suppress in some security configurations. It is also not styleable and breaks the app's visual language.
- **Fix approach:** Replace with an inline confirmation UI pattern (e.g., a two-step button: click once shows "Confirmar?" with Yes/No) or use `ipcMain` + `dialog.showMessageBox`.

---

## Dependency Risks

### [MEDIUM] `electron@^31.2.1` — several major versions behind current (v34+)

- **Files:** `package.json` (line 26)
- **Issue:** Electron 31 reached end-of-life. Current stable is Electron 34 (as of early 2026). Older versions do not receive security patches. The `^` range allows patch updates within v31 but not major upgrades.
- **Impact:** Known security vulnerabilities in Chromium/Node that are patched in v32+ remain unpatched.
- **Fix approach:** Upgrade to `electron@^34.0.0`. Review breaking changes in the migration guides for v32, v33, v34 (mainly context bridge and protocol API changes).

---

### [MEDIUM] `electron-builder@^24.13.3` — no code signing configured

- **Files:** `package.json` (lines 37–52), `build.win` config
- **Issue:** The Windows NSIS build has no `certificateFile`, `certificatePassword`, or `signingHashAlgorithms` configured. Distributing an unsigned `.exe` will trigger SmartScreen warnings on every install ("Windows protected your PC"). Users must click through "Run anyway" which is a UX and trust issue.
- **Fix approach:** Obtain an EV or OV code signing certificate and configure it in `package.json`'s build config or via environment variables in the build pipeline.

---

### [MEDIUM] No `electron-updater` — packaging without update delivery

- **Files:** `package.json`
- **Issue:** `electron-updater` is absent from both `dependencies` and `devDependencies`. The packaged NSIS installer has no mechanism to update itself. (See also: Technical Debt — No auto-update mechanism.)

---

### [LOW] `recharts@^2.12.7` — v2 maintenance mode, v3 is current

- **Files:** `package.json` (line 16)
- **Issue:** Recharts v3 was released with API changes and performance improvements. v2 still receives critical fixes but is in maintenance mode. Not an immediate risk.
- **Fix approach:** Plan migration to v3 when doing a dependency refresh sprint. The main breaking change is the `ResponsiveContainer` API and some chart prop renames.

---

### [LOW] `tailwindcss@^3.4.6` with Tailwind v4 now available

- **Files:** `package.json` (line 32)
- **Issue:** Tailwind CSS v4 (released 2025) requires a different config format and removes `tailwind.config.js` support. Not an immediate risk, but a future migration will be required.

---

### [LOW] No lockfile integrity check in scripts — `package-lock.json` present but no `npm ci` in build

- **Files:** `package.json` (scripts section)
- **Issue:** The `package` script runs `electron-vite build && electron-builder --win` without ensuring a clean install. If `node_modules` is dirty or out of sync with the lockfile, the packaged binary may contain unexpected dependency versions.
- **Fix approach:** Add a `prebuild` script: `"prebuild": "npm ci"`.

---

## Electron-Specific Concerns

### [HIGH] No CSP (Content Security Policy) set on the renderer

- **Files:** `electron/main/index.ts`, `index.html`
- **Issue:** Neither `webContents.session.webRequest.onHeadersReceived` nor a `<meta http-equiv="Content-Security-Policy">` tag is configured. Any XSS vector in the renderer (e.g., from unsanitized build names rendered in JSX — currently safe but not enforced) would have no additional browser-level barrier.
- **Fix approach:** Add a CSP meta tag to `index.html`:
  ```html
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
  ```
  Or set it via `webRequest.onHeadersReceived` in main for production builds.

---

### [MEDIUM] Build output: renderer path hardcoded as `'../renderer/index.html'`

- **Files:** `electron/main/index.ts` (line 262)
- **Issue:** `mainWindow.loadFile(join(__dirname, '../renderer/index.html'))` assumes the renderer output is at `dist-electron/../renderer/`. The actual Vite output goes to `dist/index.html`. If `electron-builder` copies files correctly via the `"files"` glob, this works at runtime, but the path dependency is fragile and not obvious from the config. The `electron.vite.config.ts` sets `outDir: 'dist'` for the renderer, so the expected path at runtime is `dist-electron/main/../renderer/index.html` = `dist-electron/renderer/index.html` — this only works if electron-vite copies/links correctly.
- **Fix approach:** Verify with a test package that the file resolves correctly. Consider using `app.getAppPath()` for more robust path resolution.

---

### [LOW] `titleBarStyle: 'hidden'` with `titleBarOverlay` only works on Windows 10+

- **Files:** `electron/main/index.ts` (lines 235–240)
- **Issue:** `titleBarOverlay` (the colored traffic light area) is a Windows 11 / macOS feature. On Windows 10 the overlay color may not apply, leaving a jarring default title bar. The app targets Windows (NSIS only), so macOS is out of scope, but Windows 10 users will see a visual inconsistency.
- **Fix approach:** Test on Windows 10 and provide a fallback (e.g., `autoHideMenuBar: true` without `titleBarOverlay` on older builds, or detect OS version).

---

## Code Quality Issues

### [MEDIUM] `Builds.tsx` is 537 lines — God Component

- **Files:** `src/pages/Builds.tsx`
- **Issue:** The `Builds` page component handles import-from-file, import-from-URL (tRPC), import-from-Python, create-empty, delete, inline editing (two tabs: raw stats and DPS calc), export, and status bar management — all in a single component with 13 `useState` declarations. This makes the component difficult to test, navigate, and extend.
- **Fix approach:** Extract at minimum:
  - `BuildCard.tsx` — the per-build row with its inline editor
  - `ImportPanel.tsx` — the URL + file import controls
  - `useBuildEditor.ts` — the edit state and update functions

---

### [MEDIUM] Radar chart key collision: `b.name.slice(0, 18)` used as both dataKey and record key

- **Files:** `src/pages/Comparator.tsx` (lines 53–57, 148–158)
- **Issue:** `radarData` rows use `b.name.slice(0, 18)` as the key for each build's value. If two builds have names whose first 18 characters are identical, one will overwrite the other silently. The radar chart will show the wrong data for one of the builds.
- **Fix approach:** Use `b.id` as the radar data key and keep `b.name.slice(0, 18)` only for display labels via `<Radar name={...}/>`.

---

### [MEDIUM] `useEffect` missing dependency in `App.tsx`

- **Files:** `src/App.tsx` (line 16)
- **Issue:** `useEffect(() => { loadFromDisk() }, [])` omits `loadFromDisk` from the dependency array. With the React strict mode double-invocation in dev, this could call `loadFromDisk` twice, and React's exhaustive-deps lint rule (if enabled) would flag this.
- **Fix approach:** Either add `loadFromDisk` to the deps array (safe because Zustand action references are stable) or wrap the call in a ref guard.

---

### [LOW] Magic numbers for radar normalization maximums are not documented

- **Files:** `src/pages/Comparator.tsx` (lines 12–19)
- **Issue:** The `AXES` array hardcodes normalization maximums (`weapon: 5000`, `skill: 3000`, etc.) with no explanation of how they were derived. If the game patches stat caps, these silently become wrong and all radar charts mislead.
- **Fix approach:** Add a comment explaining the source (e.g., "typical endgame max observed in patch 1.x") and consider deriving the max dynamically from the loaded builds' actual values.

---

## Test Coverage Gaps

### [HIGH] Zero unit tests for the damage engine

- **Files:** `src/engine/calculator.ts`, `src/engine/questlogParser.ts`, `src/engine/types.ts`
- **Issue:** The entire DPS calculation engine has no test files. The formulas (`critChanceFromStat`, `calcAverageDPS`, `calcSensitivity`, `calcElasticity`) are non-trivial math that could silently produce wrong results after a refactor. The questlog parsers handle multiple input formats with edge cases (range strings like `"350 ~ 853"`, percentage strings like `"78,1%"`) that have no regression coverage.
- **Risk:** A formula bug would go undetected until a user reports incorrect DPS numbers. Parser regressions when questlog.gg changes their API format would also be silent.
- **Fix approach:** Add `vitest` (already compatible with Vite) and write at minimum:
  - `calculator.test.ts` — known input → expected DPS for a reference build
  - `questlogParser.test.ts` — fixture of a real API response → expected `Build` shape

---

### [HIGH] No IPC handler integration tests

- **Files:** `electron/main/index.ts`
- **Issue:** All IPC handlers (`data:read`, `data:write`, `data:import-file`, `questlog:import-url`, `questlog:import-python`) are untested. The path-traversal risk and write-failure silent swallow identified above would both be caught by integration tests.
- **Fix approach:** Use `electron`'s test utilities or `@playwright/test` with the Electron driver to write smoke tests that invoke each handler with valid and invalid inputs.

---

*Concerns audit: 2026-04-11*
