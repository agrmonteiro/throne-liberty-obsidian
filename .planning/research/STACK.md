# Stack Additions for v2.0 Game Intelligence Modules

**Project:** Throne & Liberty — Obsidian Command  
**Researched:** 2026-04-17  
**Scope:** 4 new modules added to existing Electron 31 + React 18 + TypeScript + Zustand app

---

## Context: Existing Patterns (Do Not Re-research)

The app already ships:
- Python subprocess spawned from `electron/main/index.ts` via `child_process.spawn`
- IPC bridge through `contextBridge` in preload (`window.dataAPI`)
- `contextIsolation: true`, `nodeIntegration: false` already enforced
- Combat log folder persisted in `settings.json`; `combatlog:read-file` IPC handler already validates path with `assertInsideDir()`
- Log parsing (`parseTLLogTime`, `CombatEvent` struct) already done in TypeScript inside the renderer (`src/pages/LogReader.tsx`)
- `rotationEngine.ts` and `gearScorer.ts` already implemented in pure TypeScript
- `skillsDB.ts` already populated with skills by weapon class

The new modules add **Python-side** ML and **hardening** on top of what exists.

---

## Module 1: Gear Scorer ML

### Problem

Mass-scrape Questlog builds → extract `BuildStats` feature vectors → train a regression/ranking model → ship serialized model to production → Python subprocess does inference at runtime. Retrain cycle per game patch.

### Recommended Stack

#### Training (dev-time, NOT shipped)

**scikit-learn 1.8.x — `HistGradientBoostingRegressor`**

- Version: `scikit-learn>=1.8` (current stable as of 2026-04)
- Why HistGBT over XGBoost/LightGBM: `HistGradientBoostingRegressor` is native sklearn, zero extra dependency, natively handles missing values, comparable accuracy on small-to-medium tabular datasets (hundreds of builds, ~14 features). The dataset size is tiny — the performance gap between frameworks only matters at millions of rows. XGBoost and LightGBM add install complexity and separate ONNX converters that trail the main package by months.
- Why sklearn over PyTorch: tabular data with ~14 numeric features, likely <10K samples. Tree ensembles consistently beat deep learning on this profile. PyTorch adds hundreds of MB to the training environment for zero benefit here.
- Pipeline wrapper: `sklearn.pipeline.Pipeline` with `StandardScaler` → `HistGradientBoostingRegressor`. Pipeline converts cleanly to ONNX in one call.

#### ONNX Export (dev-time, produces the artifact)

**skl2onnx 1.20.x**

- Version: `skl2onnx>=1.20`
- Why: The official ONNX-org converter for scikit-learn pipelines. `to_onnx(pipeline, X_sample)` produces a portable `.onnx` file. Supports `HistGradientBoostingRegressor` since skl2onnx 1.17.
- Companion: `onnx>=1.17` (the IR library; not the runtime)
- Export call: `to_onnx(pipeline, initial_types=[('stats', FloatTensorType([None, 14]))])` — the resulting `.onnx` file ships with the app, no sklearn needed at runtime.

#### Inference (runtime, ships to production)

**onnxruntime 1.20.x (CPU)**

- Version: `onnxruntime>=1.20` (current stable 1.24.x as of 2026-04; pin `>=1.20,<2.0`)
- Install: `pip install onnxruntime` (CPU-only package — do NOT use `onnxruntime-gpu`; users won't have CUDA)
- Why: Microsoft-maintained, cross-platform, <30 MB wheels, Python ≥3.11 required (matching current stdlib). Loads `.onnx` file once at startup, runs inference in <1ms for 14 features. Requires zero sklearn at runtime — only the serialized model file and onnxruntime itself.
- Integration: follows exact same subprocess pattern as the existing scraper. Main process spawns `gear_scorer_inference.py <json_input>`, script loads model via `ort.InferenceSession('model.onnx')`, prints JSON score to stdout, main process reads result.

#### Model Artifact Management

- Artifact: `gear_scorer_v{version}.onnx` (e.g., `gear_scorer_v1_0.onnx`)
- Location: shipped inside the packaged app under `resources/ml/` (electron-builder `extraResources` config)
- Version tagging: model filename includes game patch version. Inference script reads the latest model file from `resources/ml/`.
- Retrain cycle: new game patch → run `train_gear_scorer.py` in dev → replace artifact → rebuild → ship new installer. No runtime retraining.

#### Alternatives Considered

| Option | Why Not |
|--------|---------|
| XGBoost | Requires separate `xgboost` package + `onnxmltools` for ONNX export; adds complexity with no accuracy benefit at this dataset size |
| LightGBM | Same: needs `onnxmltools.convert_lightgbm()`; skl2onnx support is via an extension, not first-party |
| PyTorch tabular | Massively oversized for 14-feature, <10K row dataset; no ONNX export simplicity win |
| Joblib `.pkl` | Not portable — requires sklearn at runtime. ONNX eliminates the sklearn runtime dependency entirely |
| RandomForestRegressor | Worse than HistGBT on tabular with missing values; larger ONNX file (stores all trees fully) |

#### Installation (training environment — dev only)

```bash
pip install scikit-learn>=1.8 skl2onnx>=1.20 onnx>=1.17
```

#### Installation (production inference — ships with app)

```bash
pip install onnxruntime>=1.20
```

#### electron-builder Config Addition

```json
"extraResources": [
  { "from": "resources/ml/", "to": "ml/", "filter": ["*.onnx"] }
]
```

---

## Module 2: Log Parser

### Problem

Parse Throne & Liberty combat log files (UTF-8 `.txt`/`.log` at `%LOCALAPPDATA%\TL\Saved\COMBATLOGS`), extract per-skill damage, detect pull boundaries, produce timeline.

### Key Finding: Parser Already Exists in TypeScript

The renderer already implements the complete parsing logic in `src/pages/LogReader.tsx`:
- `parseTLLogTime()` parses the `YYYYMMdd_HH_mm_ss_ms` timestamp format
- `CombatEvent` struct with `tsMs`, `skill`, `damage`, `isCrit`, `isHeavy`, `source`, `target`
- Pull detection via 15-second gap heuristic (`PULL_GAP_MS = 15000`)
- IPC handlers `combatlog:read-file`, `combatlog:list-files`, `combatlog:pick-folder` already in `electron/main/index.ts`

### What Is Actually Missing

The missing piece is **not** a parser library — it is the regex engine and the per-line parsing function that converts a raw log line into a `CombatEvent`. The `LogReader.tsx` consumes `CombatEvent[]` but the code that produces them from raw text is not yet wired.

### Recommended Stack: Pure TypeScript, No New Libraries

**No Python needed. No new npm packages needed.**

The combat log is plaintext UTF-8. TypeScript + native `RegExp` is the correct tool:

```typescript
// Example line format (observed from TL Combat Ledger source references):
// 20240815_14_32_01_234 PLAYER_COMBAT_LOG DAMAGE PlayerName SkillName 4521 CRITICAL HEAVY TargetName
const LINE_RE = /^(\d{8}_\d{2}_\d{2}_\d{2}_\d{3})\s+(\w+)\s+DAMAGE\s+(\S+)\s+(.+?)\s+(\d+)\s+(\w+)\s+(\w+)\s+(\S+)/
```

- The file is already read by `combatlog:read-file` IPC in main (validated, path-traversal-safe)
- Parse in main process (avoids shipping large files to renderer), split by newline, apply regex per line
- Return `CombatEvent[]` array via IPC (structured data, not raw file content) — already a security improvement since the renderer never touches raw file paths

### Recommended Implementation Approach

1. Add `combatlog:parse-file` IPC handler in `electron/main/index.ts` — reads file via `assertInsideDir()`, splits by `\n`, applies line regex, returns `CombatEvent[]`
2. Move parsing out of the renderer (`LogReader.tsx`) and into the main process handler
3. Store parsed result in `log-timeline.json` via existing `useLogTimeline` store — already implemented in `src/store/useLogTimeline.ts`

### What NOT to Add

- Do not add Python for log parsing — adds process overhead for a pure text operation
- Do not add a CSV/log parsing npm library (e.g., `csv-parse`, `papaparse`) — the format is fixed and simple
- Do not add `fs.watch()` for real-time parsing in v2.0 — batch analysis per file is sufficient; live tail can be a v3.0 feature

---

## Module 3: Rotation Builder

### Key Finding: Core Logic Already Implemented

The rotation engine is fully implemented in pure TypeScript:
- `src/engine/rotationEngine.ts` — `calcRotationResult()`, `calcSkillDps()`, `calcDotResult()`
- `src/engine/gearScorer.ts` — `rankItemUpgrades()`, `bestPerSlot()`
- `src/engine/skillsDB.ts` — skills DB with EN/PT names by weapon class
- `src/pages/Rotation.tsx` — UI page already exists

### What Is Actually Missing

The missing piece is the **interactive UI** for building a rotation (selecting skills, setting cooldowns, hits, etc.) and the **skill detail data** (cooldown values, hit count, damage % per skill from the game).

### Recommended Stack: Pure TypeScript + React, No New Libraries

**No new npm packages needed.**

- Skill selection UI: React `useState` + existing Tailwind/CSS system — same pattern as all other pages
- Rotation optimization: `rankItemUpgrades()` already uses a deterministic greedy sort (sort by `dpsDelta` desc). This is correct for T&L — the skill set is small and fixed, brute-force over all permutations of ≤12 active skills is feasible in <1ms
- State: new Zustand store `src/store/useRotation.ts` (already exists per git status)

### What NOT to Add

- Do not add a constraint solver (OR-Tools, PuLP, scipy.optimize) — overkill. T&L rotation optimization is: given a fixed skill set, sort by DPS contribution. No scheduling problem exists because skills are independent (no shared cooldown groups in the current engine)
- Do not add `react-dnd` or `@dnd-kit` for drag-and-drop ordering in v2.0 — click-to-add/remove is sufficient for MVP
- Do not add a graph optimizer or genetic algorithm — the problem space is small enough for exhaustive search

### Skill Data Strategy

The game does not expose an official skill API. Options ranked by effort:
1. **Hardcode in `skillsDB.ts`** (current approach, already done for names) — extend with `cooldown`, `hits`, `skillDmgPct` fields. One-time manual data entry, updated each game patch alongside the retrain cycle. LOW engineering effort, HIGH reliability.
2. Community wikis (Questlog.gg, gameslantern) — scrape as data source for initial population, but treat as manually verified.

No library helps here — it is a data problem, not a code problem.

---

## Module 4: IPC Security

### Current State Assessment

The existing IPC is already partially hardened:
- `contextIsolation: true`, `nodeIntegration: false` — confirmed in architecture
- `assertInsideDir()` path traversal guard — implemented for all file read/write handlers
- `sanitizeDataFilename()` — rejects path separators and `..` in filenames
- `combatlog:list-files` ignores the renderer-provided `_folder` argument, reads from settings — correct pattern
- `findPythonScraper()` uses a fixed candidate list, not renderer-provided paths

### Gaps Found

1. **No input type validation on IPC payloads** — `data:write` accepts `data: unknown` and passes it directly to `JSON.stringify`. A compromised renderer could send a `Proxy` or circular reference object.
2. **No channel sender validation** — IPC handlers do not verify `event.senderFrame.url` origin. Not exploitable in the current app (no `loadURL` to remote URLs) but a gap for defense in depth.
3. **`any` types in main process** — `combatlog:pick-folder` uses `as any` for the dialog window; `settings` parsed without schema.
4. **No Content Security Policy** — `src/main.tsx` (renderer bootstrap) has no CSP header configured, leaving open script injection surface if a dependency is compromised.
5. **Python subprocess argument injection** — `questlog:import-python` passes the renderer-provided `url` string as a CLI argument to `python`. No URL format validation before spawn.

### Recommended Stack: Zod + Electron Security Checklist

#### Zod 3.x — IPC Input Validation

- Version: `zod@^3.23` (current stable)
- Install: `npm install zod` (TypeScript-first, zero runtime dependencies, <14 KB)
- Use: validate all IPC handler inputs in main process before any I/O operation
- Example:

```typescript
import { z } from 'zod'

const WriteSchema = z.object({
  filename: z.string().regex(/^[\w.-]+$/).max(64),
  data: z.unknown(),
})

ipcMain.handle('data:write', (_event, filename: string, data: unknown) => {
  const parsed = WriteSchema.safeParse({ filename, data })
  if (!parsed.success) return { ok: false, error: 'Invalid input' }
  // proceed
})
```

- For URL validation before Python spawn:

```typescript
const QuestlogUrlSchema = z.string().url().startsWith('https://questlog.gg/')
```

#### Electron Security Checklist Items (No New Libraries)

These are configuration/code changes, not library additions:

1. **CSP header** — add via `session.defaultSession.webRequest.onHeadersReceived` in main process. Restrict to `'self'` + Google Fonts CDN (already used for Inter/JetBrains Mono).
2. **Sender origin check** — in sensitive handlers, check `event.senderFrame.url` matches the expected app URL (`app://` in production, `http://localhost:5173` in dev).
3. **`sandbox: true`** — add to `BrowserWindow` `webPreferences`. Electron defaults this to `true` since v20 but verify it is not explicitly disabled.
4. **Remove `any` types** — replace `as any` casts in main process IPC handlers with typed alternatives.
5. **`shell.openExternal` guard** — if any handler calls `shell.openExternal`, validate the URL scheme is `https:` only.

#### Alternatives Considered

| Option | Why Not |
|--------|---------|
| `ajv` (JSON Schema) | Valid alternative but worse TypeScript DX than Zod; Zod schemas double as TypeScript types |
| `joi` | Heavier, less idiomatic TypeScript, no tree-shaking advantage in this context |
| Hand-rolled `typeof` checks | Already the current pattern; insufficient — doesn't handle nested objects or URL format |
| `electron-squirrel-startup` security | Out of scope — installer security separate concern |

#### Installation

```typescript
// npm side (TypeScript types included):
npm install zod
```

No Python additions for IPC Security.

---

## Summary: What Changes

### New npm Dependencies

| Package | Version | Used By | Purpose |
|---------|---------|---------|---------|
| `zod` | `^3.23` | IPC Security | Input validation on all IPC handlers in main process |

### No Changes To

- React, Zustand, Recharts, Tailwind — unchanged
- electron-vite, electron-builder — unchanged
- The subprocess pattern — Gear Scorer inference uses the exact same `spawn` + stdout JSON read pattern as the existing scraper

### Python (Dev Tooling, Not Shipped)

| Package | Version | Phase | Purpose |
|---------|---------|-------|---------|
| `scikit-learn` | `>=1.8` | Training only | `HistGradientBoostingRegressor` + `Pipeline` |
| `skl2onnx` | `>=1.20` | Training only | Export pipeline to `.onnx` artifact |
| `onnx` | `>=1.17` | Training only | ONNX IR library (dependency of skl2onnx) |

### Python (Ships With App)

| Package | Version | Phase | Purpose |
|---------|---------|-------|---------|
| `onnxruntime` | `>=1.20,<2.0` | Runtime | Load `.onnx` model, run inference in gear scorer subprocess |

### New File Artifacts

| Artifact | Location | Notes |
|----------|----------|-------|
| `gear_scorer_v{patch}.onnx` | `resources/ml/` | Retrained each game patch, shipped via installer |
| `gear_scorer_inference.py` | sibling Python project | Inference-only script: load ONNX, read stdin JSON, print score |
| `train_gear_scorer.py` | sibling Python project | Dev-only training script |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| sklearn HistGBT recommendation | HIGH | Official sklearn 1.8 docs + consensus on tabular data profile |
| skl2onnx 1.20 supports HistGBT | HIGH | Official skl2onnx 1.20 release notes explicitly list HistGradientBoosting support |
| onnxruntime 1.20+ CPU, Python >=3.11 | HIGH | PyPI official page + release notes |
| Log format `%LOCALAPPDATA%\TL\Saved\COMBATLOGS` | MEDIUM | Corroborated by TL Combat Ledger site + community references; exact line format needs validation against actual log file |
| Log parser already in TypeScript | HIGH | Confirmed by reading `src/pages/LogReader.tsx` and `electron/main/index.ts` |
| Rotation engine already implemented | HIGH | Confirmed by reading `src/engine/rotationEngine.ts` and `gearScorer.ts` |
| Zod for IPC validation | HIGH | Established pattern in Electron security literature + official Electron security docs |
| IPC gaps identified | HIGH | Confirmed by reading `electron/main/index.ts` — `data:write` takes `unknown`, no sender check |

---

## Sources

- [scikit-learn 1.8 ensemble docs](https://scikit-learn.org/stable/modules/ensemble.html)
- [skl2onnx 1.20 API + HistGBT support](https://onnx.ai/sklearn-onnx/)
- [onnxruntime PyPI — current 1.24.x](https://pypi.org/project/onnxruntime/)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Bishop Fox: Reasonably Secure Electron](https://bishopfox.com/blog/reasonably-secure-electron)
- [TL Combat Ledger — log format reference](https://tlcombatledger.com/)
- [tl-combat-analyzer (GitHub)](https://github.com/Darkshinera/tl-combat-analyzer)
