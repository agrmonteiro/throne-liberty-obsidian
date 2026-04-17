# External Integrations

**Analysis Date:** 2026-04-11

## APIs & External Services

**Questlog.gg tRPC API:**
- Purpose: Import character builds from questlog.gg character builder
- Base URL: `https://questlog.gg/throne-and-liberty/api/trpc/`
- Client: Electron's built-in `net.fetch` (Node-side, avoids CORS restrictions)
- Implementation: `electron/main/index.ts` — `trpcGet()` function + `questlog:import-url` IPC handler
- Method called: `characterBuilder.getCharacter` with `{ slug }` input
- Request headers: `User-Agent: Mozilla/5.0`, `Accept: application/json`, `Referer: https://questlog.gg/throne-and-liberty/en/character-builder/`
- URL parsing: `extractSlugAndBuildId()` extracts `slug` from path and optional `buildId` from query string

**Google Fonts CDN:**
- Purpose: Load Inter, Noto Serif, JetBrains Mono fonts
- Imported in `src/styles/globals.css` via `@import url('https://fonts.googleapis.com/...')`
- No API key required; loaded at runtime in the renderer process

## Data Storage

**Local JSON files (no database):**
- Location: `AppData/Roaming/throne-liberty/data/` (resolved via `app.getPath('userData')`)
- Constant defined in `electron/main/index.ts`: `DATA_DIR = path.join(app.getPath('userData'), 'data')`
- Two managed files:
  - `builds.json` — persisted builds map (`BuildMap` = `Record<string, Build>`)
  - `settings.json` — app settings (`{ theme: 'obsidian', port: 8501 }`)
- Write pattern: atomic write via temp file + rename (`file.tmp` → `file`) to prevent corruption
- Read/write exposed to renderer through `dataAPI` IPC bridge

**No external database, no cloud storage, no caching layer.**

## IPC Channels (Main ↔ Renderer)

All channels use `ipcMain.handle` / `ipcRenderer.invoke` (async, promise-based).

### Data channels (filesystem)

| Channel | Direction | Parameters | Returns |
|---|---|---|---|
| `data:read` | renderer → main | `filename: string` | parsed JSON or `null` |
| `data:write` | renderer → main | `filename: string, data: unknown` | `{ ok: boolean, error?: string }` |
| `data:import-file` | renderer → main | — | parsed JSON from user-picked file or `null` |
| `data:export-file` | renderer → main | `data: unknown, defaultName: string` | `{ ok: boolean, path?: string }` |
| `data:dir` | renderer → main | — | `string` (DATA_DIR path) |

### Questlog import channels

| Channel | Direction | Parameters | Returns |
|---|---|---|---|
| `questlog:import-url` | renderer → main | `url: string` | `QuestlogApiResult` or `{ error: string }` |
| `questlog:import-python` | renderer → main | `url: string` | Python scraper JSON or `{ error: string }` |

### Preload bridge

Defined in `electron/preload/index.ts`. Exposes two globals via `contextBridge`:

```typescript
// window.electron  — from @electron-toolkit/preload (standard Electron APIs)
// window.dataAPI   — custom data + questlog API
window.dataAPI = {
  read, write, importFile, exportFile, dir,
  questlogImport,       // calls questlog:import-url
  questlogImportPython, // calls questlog:import-python
}
```

Window is configured with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`.

## File System Access

**Access is entirely main-process side.** The renderer never touches the filesystem directly.

| Operation | IPC channel | Implementation |
|---|---|---|
| Read JSON data file | `data:read` | `fs.readFileSync` |
| Write JSON data file | `data:write` | `fs.writeFileSync` (tmp) + `fs.renameSync` |
| User picks file to import | `data:import-file` | `dialog.showOpenDialog` + `fs.readFileSync` |
| User picks path to export | `data:export-file` | `dialog.showSaveDialog` + `fs.writeFileSync` |
| Initialize data directory | startup | `fs.mkdirSync({ recursive: true })` |

All paths are sandboxed to `DATA_DIR` for internal reads/writes; user-triggered imports/exports use native dialog to pick arbitrary locations.

## External Process Integration (Python Scraper)

**Purpose:** Fallback build importer using a Python Selenium/scraper script.

**Implementation:** `electron/main/index.ts` — `questlog:import-python` IPC handler

**Script resolution** (`findPythonScraper()`):
1. Sibling project path: `../throne_and_liberty_agent/scraper/questlog_scraper_standalone.py` (relative to `process.cwd()`)
2. Packaged app path: relative to `app.getPath('exe')`
3. Environment variable override: `process.env.TL_SCRAPER_PATH`

**Invocation:**
```typescript
spawn('python' /* or 'python3' on non-Windows */, [scriptPath, url])
```

**Output contract:** Python script must print debug to `stderr` and a valid JSON object to `stdout`. The main process scans `stdout` for the first `{` character, then `JSON.parse`s from that point.

**Dependency:** Python must be in system `PATH`. The sibling project `throne_and_liberty_agent` must be present at the same parent directory as this project.

## Authentication & Identity

**None.** No auth provider, no login, no accounts. Fully local desktop app.

## Monitoring & Observability

**Error Tracking:** None detected.

**Logs:** `console.error` calls in main process IPC handlers only. No structured logging framework.

## CI/CD & Deployment

**Hosting:** Windows desktop application, distributed as NSIS installer.

**CI Pipeline:** Not detected (no `.github/`, no CI config files).

**Build output:** `release/` directory (electron-builder output).

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None. All network calls are request/response.

## Window & Shell Integration

- External links opened via `shell.openExternal` (renderer cannot open new windows directly)
- Custom titlebar: `titleBarStyle: 'hidden'` + `titleBarOverlay` (color `#0b0c0e`, symbol `#d4af37`, height 32px)
- App user model ID for Windows taskbar: `com.thronebuilds.obsidian`

---

*Integration audit: 2026-04-11*
