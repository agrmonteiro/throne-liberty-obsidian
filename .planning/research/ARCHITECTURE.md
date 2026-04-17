# Architecture: v2.0 Game Intelligence Modules

**Project:** Throne & Liberty — Obsidian Command
**Researched:** 2026-04-17
**Mode:** Integration analysis for subsequent milestone

---

## Current Architecture Snapshot

The app has a hard three-layer boundary enforced by Electron's context isolation:

```
[Main Process]         [Preload Bridge]         [Renderer Process]
 electron/main/         electron/preload/         src/
   index.ts               index.ts
  ─────────────────────────────────────────────────────────────────
  IPC handlers           window.dataAPI           Zustand stores
  file I/O               contextBridge             React pages
  child_process          typed wrappers            engine/ (pure TS)
  Python subprocess
```

The renderer NEVER touches Node.js directly. All privileged operations cross IPC via named channels (`data:*`, `questlog:*`, `combatlog:*`). The engine layer (`src/engine/`) is pure TypeScript with zero side effects.

**State of the 4 modules at codebase read time:**

All 4 modules are already partially or fully implemented in code. This is NOT a greenfield addition — the code exists, the IPC channels exist, the stores exist, the pages exist. The v2.0 milestone is about hardening, completing, and properly wiring what is already scaffolded.

---

## Integration Points per Module

### 1. Log Parser

**Current state:** Fully scaffolded and substantially implemented.

- `electron/main/index.ts` already has 5 IPC handlers: `combatlog:pick-folder`, `combatlog:get-folder`, `combatlog:list-files`, `combatlog:read-file`, `combatlog:delete-file`
- `electron/preload/index.ts` already exposes all 5 methods as `window.dataAPI.combatlog*`
- `src/store/useLogTimeline.ts` exists: persists `LogTimelineData` (pull timeline, casts per skill) to `log-timeline.json` via `data:read/write`
- `src/pages/LogReader.tsx` exists and imports from `useLogTimeline` and `skillsDB`
- `src/engine/skillsDB.ts` exists with full skill name mapping (EN+PT) for enriching parsed log lines
- `App.tsx` already routes `'logreader'` to `<LogReader>` and supports split-view mode

**Integration boundary that already works:**
```
Renderer (LogReader.tsx)
  → window.dataAPI.combatlogPickFolder()    → combatlog:pick-folder IPC → dialog + saves to settings.json
  → window.dataAPI.combatlogListFiles()     → combatlog:list-files IPC  → readdirSync(savedFolder)
  → window.dataAPI.combatlogReadFile(path)  → combatlog:read-file IPC   → readFileSync (path-traversal guarded)
  → window.dataAPI.combatlogDeleteFile(p)   → combatlog:delete-file IPC → unlinkSync (guarded)
```

**Security already in place:** `combatlog:read-file` and `combatlog:delete-file` use `assertInsideDir()` — the renderer cannot request paths outside the saved combat log folder. `combatlog:list-files` ignores the folder arg from renderer entirely and reads from `settings.json` on the main-process side.

**What is NOT yet done (based on code inspection):** The log parsing logic inside `LogReader.tsx` (the `parseTLLogTime`, `CombatEvent`, `Pull` types) appears to be renderer-side parsing. The raw log text is read via IPC then parsed entirely in the renderer — this is acceptable for this use case since logs are read once on user demand, not streamed continuously.

**No new IPC channels needed.** No changes to main process needed.

---

### 2. Rotation Builder

**Current state:** Fully scaffolded. Engine, store, page, and DB all exist.

- `src/engine/rotationEngine.ts` — complete: `calcSkillDps`, `calcDotResult`, `calcRotationResult`, `effectiveCDRPct`
- `src/engine/gearScorer.ts` — complete: `rankItemUpgrades`, `bestPerSlot` using `calcRotationResult` as oracle
- `src/engine/skillsDB.ts` — static JSON-as-TS with all weapon skills (Longbow, Wand & Tome, Staff, Crossbow, Dagger, Greatsword, Sword & Shield, Spear, Orb) plus item procs/masteries
- `src/engine/types.ts` — full type system: `Rotation`, `RotationCharacter`, `RotationSkill`, `RotationDot`, `RotationBuff`, `RotationRule`, `CastEvent`, `RotationResult`, `ItemStats`, `EquippedItem`, `GearSnapshot`, `ItemUpgradeSuggestion`
- `src/store/useRotation.ts` — Zustand store persisting `RotationMap` to `rotations.json` with full CRUD: create, save, delete, duplicate, updateCharacter, addSkill, updateSkill, removeSkill, moveSkill, addDot, updateDot, removeDot, addBuff, updateBuff, removeBuff, toggleCastEvent, importFromBuild
- `src/pages/Rotation.tsx` — exists and imports from `useRotation`, `useBuilds`, `useLogTimeline`, `rotationEngine`
- `App.tsx` already routes `'rotation'` to `<Rotation>`

**Integration boundary:**
```
Rotation.tsx (renderer)
  → useRotation store (Zustand)
    → window.dataAPI.read('rotations.json')   → data:read IPC
    → window.dataAPI.write('rotations.json')  → data:write IPC
  → calcRotationResult() / calcSkillDps()     (pure, in-renderer, no IPC)
  → useBuilds store                           (importFromBuild — pulls BuildStats → RotationCharacter)
  → useLogTimeline store                      (reads saved log timeline for comparison overlay)
```

**Cross-module connection already present:** `useRotation.importFromBuild(build: Build)` converts a `Build` into a `Rotation` with pre-filled `RotationCharacter` stats. `Rotation.tsx` imports `useLogTimeline` — meaning the rotation page already plans to overlay real log data against the theoretical rotation.

**No new IPC channels needed.** No changes to main process needed.

---

### 3. Gear Scorer ML

**Current state:** The pure-TypeScript scorer (`gearScorer.ts`) is implemented and working as a DPS-delta ranker. The ML pipeline (Python data collector + trainer + serialized model + inference subprocess) does NOT yet exist in code.

**What exists (deterministic scorer):**
- `src/engine/gearScorer.ts` — `rankItemUpgrades(rotation, candidates)` ranks items by DPS delta using `calcRotationResult` as oracle. This is a simulation-based scorer, not ML.
- `ItemStats`, `EquippedItem`, `GearSnapshot`, `ItemUpgradeSuggestion` types are fully defined in `types.ts`

**What does NOT exist yet (ML pipeline):**
- Python data collector (mass Questlog scraping to build training dataset)
- Python trainer script (sklearn/ONNX model fitting)
- Serialized model artifact (`.pkl` or `.onnx` file)
- IPC channel for ML inference subprocess (`gearscore:infer` or similar)
- Preload bridge method for ML inference
- UI page for Gear Scorer (no `src/pages/GearScorer.tsx` detected)

**Proposed integration for ML inference:**

The ML inference subprocess follows the exact same pattern as the existing Python scraper:

```
[Main Process]
  ipcMain.handle('gearscore:infer', async (_event, itemStats: ItemStats[]) => {
    // spawn python gear_scorer_inference.py
    // pipe itemStats as JSON via stdin (or as CLI arg)
    // read scored results from stdout
    // return { scores: ItemScore[] } or { error: string }
  })

[Preload Bridge — addition needed]
  gearScoreInfer: (items: ItemStats[]) => ipcRenderer.invoke('gearscore:infer', items)

[Renderer]
  // New store: useGearScorer.ts
  // New page: src/pages/GearScorer.tsx
  // Calls window.dataAPI.gearScoreInfer(items)
  // Falls back to deterministic gearScorer.ts if Python not available
```

**Model artifact distribution strategy:**
- At dev time: model artifact (`gear_scorer.onnx` or `gear_scorer.pkl`) lives in the sibling `throne_and_liberty_agent` project, same directory resolution as `findPythonScraper()`
- At package time: model artifact is bundled into the app's resources via `electron-builder` `extraResources` config — alongside or near the Python inference script
- Retraining cycle: new game patch → run data collector → run trainer → commit new model artifact → ship new app version. This is a dev-time operation, not a runtime operation.
- Fallback: if Python or model not found, silently fall back to `rankItemUpgrades()` (deterministic TypeScript scorer) and surface a banner "ML model not available — using deterministic scorer"

**New components needed:**
- `electron/main/index.ts` — add `gearscore:infer` IPC handler (pattern: same as `questlog:import-python`)
- `electron/preload/index.ts` — add `gearScoreInfer` method to `dataAPI`
- `src/store/useGearScorer.ts` — new Zustand store
- `src/pages/GearScorer.tsx` — new page
- `src/App.tsx` — add `'gearscore'` to `Page` type and route map
- Python: `gear_scorer_inference.py` in sibling project (reads stdin JSON, outputs scored JSON to stdout)

---

### 4. IPC Security

**Current state:** Substantially already hardened. The audit reveals:

**Already in place:**
- `contextIsolation: true`, `nodeIntegration: false` — renderer has no Node access
- `assertInsideDir(baseDir, filePath)` — path traversal guard on all combatlog file operations
- `sanitizeDataFilename(filename)` — rejects filenames with path separators or `..` on `data:read` and `data:write`
- `combatlog:list-files` ignores the renderer-supplied `folder` arg entirely, reads from `settings.json` on main-process side — this is the correct trust model (renderer cannot influence which folder is scanned)
- All IPC handlers wrap in `try/catch` and return error objects, never throw across IPC
- Python scraper receives only `url: string` — no shell metacharacter concern since spawn() with array args (not shell: true) avoids shell injection

**Remaining gaps to address:**
1. `data:read` — `sanitizeDataFilename` checks for path separators but does not whitelist allowed filenames. A renderer could read `settings.json` (which now contains `combatLogFolder` — a filesystem path). This is low severity (local app) but worth an allowlist.
2. `data:write` — same gap; renderer can write any filename without path separators. Should be restricted to known files: `builds.json`, `rotations.json`, `log-timeline.json`, `settings.json`.
3. The new `gearscore:infer` handler will need input validation: `ItemStats[]` array size limit and numeric field bounds check before passing to Python, to prevent a malicious renderer from causing subprocess issues.
4. `questlog:import-python` does not validate the `url` parameter in the main process (renderer validates it, but main process trusts the value). Should add URL format check before spawning subprocess.
5. No `webSecurity` or CSP header configured — acceptable for local app but should be documented explicitly.

**No new IPC channels are needed for the security audit** — this phase modifies existing handlers in `electron/main/index.ts`.

---

## New Components (net new files)

| Component | Location | Purpose |
|-----------|----------|---------|
| `gear_scorer_inference.py` | sibling project | Python ML inference subprocess |
| `src/pages/GearScorer.tsx` | renderer | Gear Scorer UI page |
| `src/store/useGearScorer.ts` | renderer | Zustand store for gear scoring state |

---

## Modified Components (existing files changed)

| Component | Location | What Changes |
|-----------|----------|--------------|
| `electron/main/index.ts` | main process | Add `gearscore:infer` IPC handler; harden `data:read`/`data:write` with filename allowlist; add URL validation in `questlog:import-python`; add input bounds check for new gearscore handler |
| `electron/preload/index.ts` | preload bridge | Add `gearScoreInfer` method to `dataAPI` object |
| `src/App.tsx` | renderer shell | Add `'gearscore'` to `Page` union type and route map; add sidebar nav item |
| `src/engine/types.ts` | engine | Potentially extend `EquippedItem` or `ItemUpgradeSuggestion` with ML confidence score field |
| `src/pages/LogReader.tsx` | renderer | Ongoing completion of log parsing logic (already scaffolded) |
| `src/pages/Rotation.tsx` | renderer | Ongoing completion of rotation builder UI (already scaffolded) |
| `src/store/useRotation.ts` | renderer | Already complete; minor additions possible |
| `src/engine/skillsDB.ts` | engine | Add missing skills as game patches land (ongoing) |

---

## Suggested Build Order

### Phase A: Log Parser (complete first)
**Rationale:** Already the most complete module. IPC fully in place. No new infrastructure. Completing LogReader.tsx is pure renderer work — zero dependency on other new modules. Delivering this first gives the app an immediately usable, testable new capability.

**Deliverable:** User can select combat log folder, pick a log file, see timeline of damage events, per-skill stats, pull segmentation.

**Dependency:** None on other new modules. Depends only on existing `combatlog:*` IPC (already implemented), `skillsDB.ts` (complete), `useLogTimeline` store (complete).

---

### Phase B: Rotation Builder (complete second)
**Rationale:** Engine, store, and types are all done. The remaining work is UI completeness in `Rotation.tsx`. Completing this before Gear Scorer ML is important because `rankItemUpgrades()` in `gearScorer.ts` takes a `Rotation` as input — a working Rotation Builder is the prerequisite for meaningful Gear Scorer output. The cross-module link `useRotation.importFromBuild(build)` also needs the Rotation page working to be testable end-to-end.

**Deliverable:** User can create a rotation from a build, configure skills/dots/buffs, see per-skill DPS breakdown, compare against log timeline overlay.

**Dependency:** Requires Log Parser to be done first (Rotation.tsx already imports `useLogTimeline` for the overlay feature). Can be parallelized with IPC Security audit.

---

### Phase C: IPC Security (run in parallel with Phase B, or immediately after Phase A)
**Rationale:** Security hardening is surgical modifications to existing handlers — no new pages, no new stores. It can run in parallel with Phase B. The main dependency is that the `gearscore:infer` handler does not yet exist, so the new handler's security design should be done as part of Phase D. Phase C hardens what exists now.

**Deliverable:** `data:read`/`data:write` filename allowlist; URL validation in Python scraper handler; documented security posture; no new user-facing features.

**Dependency:** No dependency on other new modules. Should be completed before Phase D (Gear Scorer) ships, since Phase D adds a new handler that must be born already hardened.

---

### Phase D: Gear Scorer ML (last)
**Rationale:** Has the most external dependencies. Requires: (1) the Python ML pipeline to exist in the sibling project; (2) `Rotation` to be working (Gear Scorer uses `calcRotationResult` with a rotation as oracle); (3) the security patterns from Phase C to be applied to the new handler. The deterministic `rankItemUpgrades()` already works as a fallback, so the ML layer is an enhancement on top of a working foundation.

**Deliverable:** User can score gear items via ML model (when available) or deterministic simulator (always available). New Gear Scorer page in the app.

**Dependency:** Phase B (Rotation working), Phase C (security patterns established), Python ML pipeline in sibling project.

---

## Dependency Graph

```
Phase A: Log Parser
  └─► Phase B: Rotation Builder (needs log timeline for overlay)
        └─► Phase D: Gear Scorer ML (needs Rotation as scoring oracle)

Phase C: IPC Security (parallel with B, must precede D's new handler)
  └─► Phase D: Gear Scorer ML (new handler born hardened)
```

**Critical path:** A → B → D, with C running alongside B.

---

## Architecture Observations for Roadmapper

1. **Most of v2.0 is already coded.** Log Parser and Rotation Builder are scaffolded to a high degree. The milestone work is completion and polish, not greenfield construction. Phase plans should reflect this — avoid re-speccing what already works.

2. **The ML Gear Scorer is the only true greenfield item.** It requires Python pipeline work outside this repo plus 3 new files inside it. It is also the only module with a non-trivial distribution question (model artifact bundling via electron-builder).

3. **IPC is already in good shape.** The security audit is a hardening pass, not a redesign. The `assertInsideDir` pattern and `sanitizeDataFilename` are already correct in principle; the gaps are completeness (allowlist vs. pattern reject).

4. **The fallback strategy for Gear Scorer ML is already built.** `gearScorer.ts` with `rankItemUpgrades()` is a full deterministic scorer. The ML model adds a learned layer on top. The app will always work without Python/ML.

5. **No database migration needed.** Rotation state goes to `rotations.json`, log timeline to `log-timeline.json`, builds to `builds.json`, settings (including `combatLogFolder`) to `settings.json`. All files are already defined and initialized in `ensureDataDir()`.

---

*Architecture analysis: 2026-04-17*
