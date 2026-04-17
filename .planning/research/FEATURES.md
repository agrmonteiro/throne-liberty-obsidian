# Feature Landscape: v2.0 Game Intelligence Modules

**Domain:** Desktop game optimization tool (Electron + React) for Throne & Liberty
**Researched:** 2026-04-17
**Confidence:** HIGH — based on full codebase read + domain knowledge of similar tools (WoW SimC, FFXIV ACT, Path of Building, GW2 arc-dps)

---

## Module 1: Gear Scorer ML

### What's already built

`gearScorer.ts` already implements a **deterministic DPS-delta scorer**: for each candidate item, it applies the item stats onto the active `RotationCharacter`, re-runs `calcRotationResult`, and ranks by `dpsDelta`. This is already a working, fast, no-ML approach.

The "ML" framing in the milestone refers to a future enhancement: scraping mass Questlog builds, training a sklearn/ONNX model on that corpus, and running inference via Python subprocess. The existing engine already handles the hard part (knowing what a stat is worth in DPS terms).

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Score items by DPS impact | Core purpose — users want "which item is best for my build" | Low | Already done via `rankItemUpgrades` |
| Best item per slot output | Slot-by-slot recommendation list | Low | Already done via `bestPerSlot` |
| Input: current build's character stats | Scoring is meaningless without context | Low | Already bridged via "Import from Build" in Rotation |
| Human-readable reason string | Users need to understand why item X ranked first | Low | Already done via `buildReason()` |
| Rank by DPS delta, secondary stat score | Tie-breaking | Low | Already done |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| UI surface for the scorer | Engine exists but there is NO page/UI yet for Gear Scorer — this is the gap | Medium | Need a `GearScorer` page |
| Candidate item library input | Users need a way to feed candidate items (paste from game, import from Questlog items[], manual entry) | Medium | `EquippedItem` type exists; no import path yet |
| ML model overlay (future) | Cross-build pattern recognition beyond single-rotation simulation; "builds like yours tend to use X" | High | Requires mass-scraping pipeline + subprocess inference; this is the ML phase |
| Retraining cycle UI | Show model version, trigger retrain when game updates | Medium | Dev workflow, not user-facing initially |
| Slot-specific recommendations panel | Visual layout matching T&L gear slots (head, chest, hands, legs, feet, 2x accessories, 2x weapons) | Medium | UX polish |
| Compare two items head-to-head | "Is this drop better than what I have?" | Low | Simple dpsDelta diff |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time item scraping from game API | T&L has no public item API; scraping at inference time adds latency and fragility | Feed candidate items from existing build imports or manual entry |
| General "item tier list" divorced from build | Tier lists ignore build context; a crit item is only good if your build has crit scaling | Always score relative to the current rotation's character |
| Showing raw model weights to users | Confusing, not actionable | Show only DPS delta + reason string |
| Auto-applying best items to build | Destructive without user review | Suggest only; user applies manually |
| Cloud ML inference | App is local-only; no server allowed | subprocess Python with local ONNX model |

### Complexity Note

**Current state:** Engine is complete. The gap is 100% UI — there is no GearScorer page. Building the UI (item input mechanism + display of ranked results) is Medium complexity. The ML layer (data pipeline + training + subprocess inference) is a separate High-complexity phase that can come after the UI exists. Do not conflate them in a single phase.

**Dependency:** Requires `Rotation` module (character stats) to already be active. Builds store already has `rawStats`/`rawAttributes` which could seed an item candidate list.

---

## Module 2: Log Parser (LogReader)

### What's already built

`LogReader.tsx` is **substantially complete**. It parses T&L combat log CSV format (`DamageDone` events), auto-detects pulls via 15s gap heuristic + user-defined splits, aggregates per-skill and per-weapon metrics, renders a stacked/individual AreaChart over time with moving average, shows a skill breakdown table with crit/heavy rates and average cast interval, and exports a timeline to the Rotation module.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Load log file from disk | Entry point | Low | Done — folder picker + file list sidebar |
| Parse DamageDone events | Core data extraction | Low | Done — CSV parser `parseTLLogTime` |
| Total damage + DPS + duration | First numbers users look for | Low | Done |
| Per-skill damage table | "How much did each skill contribute?" | Low | Done with sort |
| Crit rate + heavy rate per skill | T&L-specific metrics users care about | Low | Done |
| DPS over time chart | Spot burst vs sustained phases | Medium | Done with Recharts AreaChart |
| Pull detection (boss fight isolation) | Most sessions have multiple pulls | Medium | Done — 15s gap + user splits |
| Target filter | Multi-target logs need filtering | Low | Done |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Weapon detection from log | Auto-identifies class from skill names via skillsDB | Medium | Done — top 5 active skills heuristic |
| Stacked vs individual chart toggle | Weapon vs skill grouping | Low | Done |
| User-defined pull splits | Some fights don't have clean 15s gaps | Medium | Done — slider + timestamp persistence |
| Log Timeline export to Rotation | Cross-module bridge: compare real rotation vs planned | Medium | Done — "Send to Rotation" button |
| Unmapped skill detection panel | Surfaces skills not in skillsDB so the DB can be updated | Low | Done — red warning block |
| Average cast interval per skill | Diagnoses real-world CDR vs theoretical | Medium | Done |
| Attack breakdown detail (normal/crit/heavy) | Verify crit and heavy scaling claims | Medium | Done |
| Split view (side-by-side two logs) | Compare two pulls or two sessions | High | Interface hooks exist (`isSplitView` prop) but split view orchestration is unfinished |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time log tailing (live ACT-style) | Requires fs watcher + streaming parser; high complexity, niche need for this tool | Load-on-demand; user refreshes file list manually |
| Healing/tanking metrics | App targets DPS optimization only | Out of scope; resist adding healer/tank columns |
| Raid-wide damage aggregation | Multi-player logs are not available in T&L client logs | Do not promise or attempt |
| Automatic pull naming from encounter database | No encounter database for T&L | Let users name pulls manually if needed |
| Log upload / cloud storage | Local-only constraint | Keep all parsing in-process |
| Damage-taken / death analysis | Different use case, different parser domain | Separate future feature if needed |

### Complexity Note

**Current state:** This module is the most complete of the four. The main remaining work is:
1. Skills missing from `skillsDB.ts` (active curation need — unmapped panel surfaces these)
2. The split view orchestration (`isSplitView` prop + `onToggleSplit` callback exist but the parent-level split rendering is not connected in `App.tsx`)
3. Edge cases in pull detection (very short pulls, log files with pre-combat spam)

The remaining work is Low-to-Medium complexity maintenance, not new feature development.

**Dependency:** `skillsDB.ts` is the mapping backbone. Any new weapon added to T&L requires updating this DB or the weapon distribution chart silently misfires.

---

## Module 3: Rotation Builder

### What's already built

`Rotation.tsx` + `rotationEngine.ts` together form a **fully functional rotation planner**. Features already working: character stat panel (all combat stats, weapon damage, CDR with DR), skill table (name, weapon, cast time, CD, damage%, hits, monster bonus, conditional bonus, per-skill DPS), DoT block (ticks, cooldown, reaplication), buff block (type, value, duration, cooldown), chaining rules (trigger → effect), interactive timeline (click/drag to mark casts, conflict detection in red, active duration shading), planned-vs-real side-by-side view (log timeline import), import character from saved build, auto-save.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add/remove skills manually | Basic builder function | Low | Done |
| Per-skill DPS display | Immediate feedback on value | Low | Done |
| Total DPS summary | The number users optimize toward | Low | Done |
| CDR with diminishing returns | T&L-specific mechanic | Medium | Done — correct formula |
| Cooldown validation in timeline | Prevent "impossible" rotations | Medium | Done — conflict cells in red |
| Import stats from saved build | Bridge to import module | Low | Done |
| Save/load rotations | Persistence between sessions | Medium | Done |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Skill lookup from DB (autocomplete) | Users shouldn't have to remember exact skill names and stats | Medium | NOT done — skill name is a free-text input; skillsDB exists but autocomplete is not wired |
| Pre-filled skill stats from DB | When user picks a skill, CD/damage%/hits auto-populate | Medium | NOT done — would require skill stats in DB, currently DB only maps name→weapon+category |
| Side-by-side planned vs real timeline | Diagnose gap between theory and practice | Medium | Done |
| Chaining rules (buff → skill → DoT) | Model proc-based rotations | Medium | Done |
| Sensitivity: "what if CDR was 10% higher?" | Parameterized what-if analysis | Low | Partially done via the Calculator page; not integrated in Rotation |
| Multi-rotation comparison | Compare Staff+Wand vs Staff+Orb | Medium | NOT done — one active rotation at a time |
| Skill combo detection | T&L has explicit combo chains (e.g., skill A unlocks enhanced B) | High | NOT done — would need combo graph data per weapon |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-generate optimal rotation via solver | Combinatorial explosion across 9+ skills with variable cooldowns; brittle against situational factors | Show DPS contribution per skill; let user decide order |
| PvP skill evaluation | Entirely different metrics (CC, mobility, burst window); would pollute the PvE damage model | Mark explicitly out of scope |
| Cooldown alignment optimizer | Solving "when to cast X to align with Y" is a constraint-satisfaction problem; the timeline already lets users do this manually | Keep manual timeline; resist automation |
| Importing skill data from external APIs | No official T&L skill API | Maintain skillsDB.ts manually, curated |
| Real-time rotation guidance overlay | Would require game window hooks; outside Electron sandbox | No |

### Complexity Note

**Current state:** The engine and UI are substantially done. The most impactful gap is **skill DB enrichment**: `skillsDB.ts` currently maps `name → {weapon, category}` but has no damage%, cooldown, or hits data. Adding that data to the DB would allow autocomplete + pre-fill, which is the biggest UX upgrade available. This is Medium complexity (data work + UI wiring) but high user value.

**Dependency:** Tightly coupled to the existing `rotationEngine.ts` formulas. Any formula change propagates immediately to displayed DPS — this is a strength, not a problem.

---

## Module 4: IPC Security

### What's already built

The IPC architecture uses `contextBridge` + `ipcMain`/`ipcRenderer` with a typed `window.dataAPI` surface. Handlers exist for: file read/write, build persistence, Python scraper subprocess spawn, combat log folder/file operations.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Input validation on all IPC handlers | Prevent path traversal, injection via malformed arguments | Medium | Current handlers do minimal validation |
| Restrict file I/O to AppData scope | Renderer should not be able to read arbitrary disk paths | Medium | `combatlogReadFile` and similar accept user-supplied paths |
| Subprocess argument sanitization | The scraper is invoked with user-supplied URL — must sanitize before passing to child_process | Medium | High-priority: arbitrary URL → shell injection risk |
| Error boundary: never leak stack traces to renderer | Electron stack traces contain file system paths | Low | Review all IPC error responses |
| Channel allowlist | `ipcMain.handle` for known channels only; unknown channels rejected | Low | Audit required |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Path confinement utility | Reusable helper that resolves all paths to `AppData/Roaming/throne-liberty/` and rejects traversal | Low | Single utility function, high value |
| Argument schema validation (zod or manual) | Type-safe IPC contract — catch bad data before it reaches the file system | Medium | Could use zod in main process only |
| IPC audit log | Dev-mode log of all IPC calls with arguments | Low | Debug utility, disable in production |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full CSP policy enforcement | Electron's renderer is a controlled internal app, not a public web page; strict CSP would break Recharts/Tailwind with significant dev cost | Validate at IPC boundary, not at renderer level |
| Code signing / app notarization | Out of scope for this dev-phase milestone | Add to a release hardening phase |
| Renderer-side encryption of build data | Adds complexity with little threat model benefit for a local-only personal tool | Not needed |
| Network firewall rules | Electron has no built-in network policy; would require OS-level config | Not the right layer |

### Complexity Note

**Current state:** Security hardening is a code audit + targeted fixes, not a new feature build. The highest-priority risk is the Python subprocess invocation: the scraper receives a user-pasted URL, and if that path goes through shell-interpolated `exec` (rather than `spawn` with an array of args), it is a shell injection vector. This is a Low/Medium fix with High safety value. The rest of the hardening (path confinement, error sanitization) is similarly straightforward.

**Dependency:** Touches `electron/main/index.ts` and `electron/preload/index.ts`. Must not change the `window.dataAPI` contract — renderer pages depend on it. Changes are transparent to the UI.

---

## Cross-Module Feature Dependencies

```
Build Import (existing) → Rotation Builder (import character stats from build)
Build Import (existing) → Gear Scorer (candidate items from build's rawStats/items[])
Log Parser              → Rotation Builder (export timeline → planned vs real comparison)
Rotation Builder        → Gear Scorer (active rotation provides the DPS model for scoring)
IPC Security            → All modules (hardening is cross-cutting; must not break existing channels)
```

## MVP Recommendation for v2.0

**Already done (no new work needed):**
- Log Parser core (parse, aggregate, chart, pulls, export)
- Rotation Builder core (engine, UI, timeline, buffs, rules)
- Gear Scorer engine (DPS-delta ranking, stat weights)

**High-value gaps to close first:**
1. Gear Scorer UI page — engine exists, no user-facing surface (Medium)
2. skillsDB enrichment with cooldown/damage% data + autocomplete wiring in Rotation (Medium)
3. IPC subprocess argument sanitization — URL → scraper (Low/Medium, High safety)
4. Split view connection in App.tsx for LogReader (Low)

**Defer to post-v2.0:**
- ML model pipeline (sklearn training + ONNX inference + retraining cycle) — High complexity, requires separate data infrastructure
- Multi-rotation comparison — Medium complexity, lower immediate user value
- Skill combo chain detection — High complexity, requires structured combo graph data

## Sources

- Codebase read: `src/engine/gearScorer.ts`, `rotationEngine.ts`, `skillsDB.ts`, `questlogParser.ts`, `types.ts`
- UI read: `src/pages/LogReader.tsx`, `src/pages/Rotation.tsx`
- Domain analogues: WoW SimCraft (rotation simulation), FFXIV ACT (log parsing), Path of Building (item scoring), GW2 Arc-DPS (weapon/skill breakdown)
- Confidence: HIGH for table stakes and existing state (direct code read); MEDIUM for differentiator prioritization (domain judgment)
