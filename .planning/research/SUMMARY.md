# Research Summary - v2.0 Game Intelligence

**Project:** Throne and Liberty - Obsidian Command
**Milestone:** v2.0 Game Intelligence
**Researched:** 2026-04-17
**Confidence:** HIGH

---

## Executive Summary

This is a completion milestone, not greenfield construction. Three of the four v2.0 modules (Log Parser, Rotation Builder, and the deterministic Gear Scorer) are substantially implemented in the codebase. The IPC security layer is already partially hardened. The actual work is closing specific gaps: wiring an existing log parser, enriching a skills database, building a Gear Scorer UI page that has no renderer surface yet, and applying a targeted security audit to existing handlers. Only the Gear Scorer ML pipeline (sklearn training, ONNX export, Python inference subprocess) represents genuinely new infrastructure.

The one decision that cuts across all three functional modules is the skillsDB.ts format. Currently it is compiled TypeScript (TS-as-JSON), making post-patch updates require a new app release. Switching to a JSON file loaded from userData at runtime would allow skill DB updates without re-releasing the app, but this choice must be made before any module that reads or enriches the DB is finalized.

IPC security hardening must run earlier than intuition suggests. The questlog:import-python handler passes a renderer-supplied URL to a Python subprocess without main-process URL validation. The data:write handler accepts an unknown payload type. The sandbox:false BrowserWindow setting widens the blast radius of any renderer compromise. These are current vulnerabilities, not future ones.

---

## Stack Additions

Only one new npm package is added to the production app:

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | `^3.23` | Schema validation for all IPC handler inputs in the main process |

Python runtime shipped with the app gains one package:

| Package | Version | Purpose |
|---------|---------|---------|
| `onnxruntime` | `>=1.20,<2.0` | ONNX model inference for Gear Scorer ML subprocess |

Dev-only Python tooling (not shipped):

| Package | Version | Purpose |
|---------|---------|---------|
| `scikit-learn` | `>=1.8` | HistGradientBoostingRegressor training pipeline |
| `skl2onnx` | `>=1.20` | Export sklearn pipeline to .onnx artifact |
| `onnx` | `>=1.17` | ONNX IR library (skl2onnx dependency) |

Everything else (React, Zustand, Recharts, Tailwind, electron-vite, electron-builder, the subprocess spawn pattern) is unchanged.

---

## Module State

| Module | State | Key Gaps |
|--------|-------|---------|
| Log Parser | Substantially done - IPC handlers, store, page, and CSV parser all exist | readFileSync blocks on large files; no streaming; log format validation step missing; PULL_GAP_MS is hardcoded |
| Rotation Builder | Engine and UI fully implemented - rotationEngine.ts, gearScorer.ts, Rotation.tsx, useRotation.ts all working | skillsDB.ts has no cooldown/damage%/hits data; autocomplete not wired; split view not connected in App.tsx |
| Gear Scorer (deterministic) | Engine complete - rankItemUpgrades(), bestPerSlot(), full type system in types.ts | No UI page (GearScorer.tsx does not exist); no candidate item input mechanism |
| Gear Scorer ML | Not started - only the deterministic scorer exists | Python data collector, trainer, .onnx artifact, gearscore:infer IPC handler, useGearScorer.ts store, GearScorer.tsx all missing |
| IPC Security | Partially hardened - contextIsolation:true, assertInsideDir(), sanitizeDataFilename() in place | No Zod validation; no URL check before subprocess spawn; data:write accepts unknown; sandbox:false not audited |

---

## Critical Decisions Before Planning

**1. skillsDB format: compiled-in TS vs userData JSON**

Current state: skillsDB.ts is a static TS module compiled into the bundle. Skill data updates require a new app release.

Alternative: Load a skillsDB.json from userData at runtime, with the bundled TS file as the fallback seed. Allows pushing skill DB updates without a new installer - important because T&L patches are frequent.

Impact: Affects Log Parser (unmapped skill detection), Rotation Builder (autocomplete, pre-fill), and Gear Scorer (feature vector construction). Must be decided before any phase that enriches the DB.

**Recommendation:** Switch to JSON-loadable format. Engineering cost is low (read-from-file with bundled fallback). Payoff is high (patch responsiveness without installer churn).

**2. Gear Scorer UI before or in parallel with ML pipeline**

The deterministic scorer engine is complete. The ML pipeline adds a learned layer on top and requires significant external infrastructure. These are separable.

**Recommendation:** Build the Gear Scorer UI page in Phase 3 against the deterministic scorer. ML inference subprocess is Phase 4. Users get a working Gear Scorer sooner.

**3. IPC Security placement**

Security hardening touches existing handlers that all other phases depend on. Doing it last means new handlers are added before security patterns are established.

**Recommendation:** Run IPC Security in parallel with Rotation Builder (Phase 2), not after Gear Scorer ML. New handlers in Phase 3 and 4 must be born following established patterns.

---

## Top Pitfalls to Address

**1. Large log files blocking the Electron event loop (Critical - Log Parser)**

combatlog:read-file uses fs.readFileSync in the main process. A multi-hour T&L session produces logs of 100 MB or more. Synchronous read freezes the entire UI. Must be addressed at the start of the Log Parser phase - retrofitting async streaming into a synchronous design is near-rewrite territory. Fix: replace with fs.promises.readFile immediately; design streaming as the target state.

**2. Log format changes silently corrupting all parsed data (Critical - Log Parser)**

The combat log format is undocumented and changes without notice on game patches. Current parseTLLogTime uses hardcoded character offsets. After a format change, every timestamp returns NaN and pull detection produces garbage silently. Fix: validate the first 5 lines against the expected pattern before parsing; surface a format-mismatch warning; use named-group regex instead of offset slicing.

**3. URL passed to Python subprocess without main-process validation (Critical - IPC Security)**

questlog:import-python receives a URL from the renderer and passes it directly to spawn(). The main process trusts whatever the renderer sends. A compromised renderer could pass arbitrary strings to the subprocess. Fix: add a strict URL format check in the main process handler before spawning, regardless of renderer-side validation.

**4. Meta snapshot bias making the ML model stale after patches (Critical - Gear Scorer ML)**

The ML model trains on Questlog builds reflecting the current meta. After a balance patch, the model continues scoring nerfed gear highly until retrained. Fix: version-stamp every training corpus with game patch identifier; surface model version and training date in the UI; use deterministic rankItemUpgrades() score as a sanity-check layer.

---

## Recommended Phase Order

### Phase 1: Log Parser - Complete Existing Implementation

**Rationale:** Most complete module; zero external dependencies; no new IPC or infrastructure. Delivers immediately usable capability and validates combat log parsing assumptions before other modules consume log output.

**Delivers:** User can select combat log folder, pick a file, view a damage timeline with per-skill breakdown and pull segmentation. Send to Rotation export works end-to-end.

**Must address in this phase:**
- Replace readFileSync with fs.promises.readFile to unblock the event loop
- Add log format validation step (first 5 lines asserted against pattern before parsing)
- Make PULL_GAP_MS a user-configurable setting in Settings
- Decide skillsDB format (TS vs JSON) - this is the blocking cross-module decision

**Research flags:** Low - patterns are well-established. Log format regex may need validation against a real T&L log file if none is available during planning.

---

### Phase 2 (parallel tracks): Rotation Builder + IPC Security

**Rationale:** Rotation Builder engine is complete; remaining work is UI enrichment and skills DB enrichment - pure renderer work with no new IPC. IPC Security is surgical modifications to existing handlers. These run in parallel. IPC Security must complete before Phase 3 adds gearscore:infer.

**Rotation Builder delivers:** Skill autocomplete wired from enriched skillsDB; pre-filled cooldown/damage%/hits when user selects a skill; split view connected in App.tsx; planned-vs-real timeline comparison working end-to-end.

**IPC Security delivers:** Zod validation on all IPC handler inputs; URL format check before Python subprocess spawn; filename allowlist on data:read/data:write; sandbox:false audited and documented; electronAPI re-export restricted to explicitly needed members.

**Must address in this phase:**
- Decide and implement skillsDB format (JSON-loadable vs compiled) before enriching the DB
- URL validation via Zod in questlog:import-python handler
- data:write payload type check for known schemas (builds.json, rotations.json, etc.)
- Document every handler trust tier (read-only / write-local / destructive)

**Research flags:** Low for both tracks - Zod patterns are well-documented; Rotation UI follows existing page patterns exactly.

---

### Phase 3: Gear Scorer UI - Surface the Existing Engine

**Rationale:** The deterministic scorer (rankItemUpgrades, bestPerSlot) is complete and correct. No user-facing page exists. Building the UI against the deterministic engine first decouples UI iteration from ML pipeline complexity. The ML layer is an enhancement added in Phase 4.

**Delivers:** New GearScorer.tsx page with candidate item input, slot-by-slot ranked recommendations, DPS delta display, and reason strings. useGearScorer.ts store. gearscore:infer IPC handler stubbed to return deterministic results (establishes the interface for Phase 4). App.tsx updated with gearscore route.

**Must address in this phase:**
- Candidate item input mechanism (paste from game, import from build items array)
- gearscore:infer IPC handler added with Zod input validation from day one
- Fallback to deterministic scorer surfaced as a clear UI banner when ML model unavailable

**Research flags:** Low - follows existing page patterns; all engine types already defined in types.ts.

---

### Phase 4: Gear Scorer ML - Training Pipeline and ONNX Inference

**Rationale:** Last because it has the most external dependencies - requires Rotation working (scoring oracle), IPC Security patterns established (new handler must be born hardened), and Python ML infrastructure that lives outside this repo. The deterministic fallback makes deferral safe.

**Delivers:** train_gear_scorer.py (dev-only sklearn pipeline to ONNX export); gear_scorer_inference.py (runtime subprocess, reads stdin JSON, outputs scores); gear_scorer_v{patch}.onnx artifact bundled via electron-builder extraResources; retrain cycle documented for each game patch.

**Must address in this phase:**
- Corpus size gate before training (minimum 200 builds per weapon combo; fall back to deterministic below threshold)
- Version-stamp training corpus with game patch identifier
- Model size constraint enforced during training (target: under 10 MB ONNX artifact)
- Lazy-load model on first Gear Scorer page open, not app startup
- Subprocess stdout/stderr drained concurrently with 30s hard timeout
- Model version and training date surfaced in the Gear Scorer UI

**Research flags:** Medium - ML training pipeline and ONNX packaging are the only genuinely new infrastructure. Subprocess deadlock pattern needs careful implementation review. Model artifact size targets need benchmarking on target hardware.

---

### Phase Order Rationale

- Log Parser first: zero dependencies; validates format assumptions before other modules consume log output.
- IPC Security in Phase 2, not Phase 4: existing vulnerabilities affect current code; new handlers in Phase 3 must be born following established patterns.
- Gear Scorer UI before ML pipeline: decouples UI iteration from data infrastructure; users get value sooner; fallback is already built.
- Gear Scorer ML last: highest external dependencies (Rotation, IPC patterns, Python ML project); deterministic fallback makes deferral safe.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct code inspection confirms existing patterns; Zod and onnxruntime are well-documented |
| Module state | HIGH | Based on direct codebase read of all engine, store, and page files |
| Architecture | HIGH | IPC boundary confirmed by reading main/index.ts and preload/index.ts; integration points verified |
| Pitfalls | HIGH | Security gaps confirmed by code inspection; ML pitfalls from established domain literature |
| Log format regex | MEDIUM | Format corroborated by TL Combat Ledger and community tools; exact line format needs validation against a real log file |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact log line format:** The regex pattern is inferred from community tools, not a real T&L log file. First task in Log Parser phase: capture one real log line and validate the pattern before building the parser around it.
- **skillsDB enrichment data source:** Cooldown, hits, and damage% per skill must be manually entered or scraped from community wikis. Time cost is not estimated - treat as a wildcard in the Rotation Builder phase plan.
- **ONNX model size on real data:** The 10 MB target is a guideline. Actual size depends on corpus size and hyperparameters. Enforce max_depth and n_estimators limits early in the training script to avoid surprises.

---

## Sources

- Direct codebase read: electron/main/index.ts, electron/preload/index.ts, src/engine/*.ts, src/pages/*.tsx, src/store/*.ts
- scikit-learn 1.8 docs + skl2onnx 1.20 release notes
- onnxruntime PyPI (current 1.24.x)
- Electron Security Checklist (official docs)
- Bishop Fox: Reasonably Secure Electron
- TL Combat Ledger, tl-combat-analyzer (GitHub) - log format reference
- WoW SimCraft, FFXIV ACT, Path of Building, GW2 arc-DPS - domain analogues for feature expectations

---

*Research completed: 2026-04-17*
*Ready for roadmap: yes*
