# Domain Pitfalls — v2.0 Game Intelligence Modules

**Project:** Throne & Liberty — Obsidian Command  
**Researched:** 2026-04-17  
**Scope:** Gear Scorer ML, Log Parser, Rotation Builder, IPC Security hardening on an existing Electron 31 + Python subprocess app

---

## Module 1: Gear Scorer ML

### Pitfall 1.1: Meta Snapshot Bias (Critical)

**What goes wrong:** The training corpus is a snapshot of builds that were popular at scrape time. Questlog data reflects current meta — whoever is topping DPS charts right now. The model learns to score those builds highly regardless of why they are strong. After a game balance patch that nerfs, say, `critDmgPct`, the model continues ranking `critDmgPct`-heavy gear as top-tier because the training distribution has not changed.

**Why it happens:** There is no ground-truth "item quality" label in an MMORPG. The proxy label (build popularity or DPS rank scraped from Questlog) conflates item quality with player skill, current meta, encounter type, and playstyle. The model cannot distinguish these.

**Warning sign:** Model recommendations stop matching community consensus within 1-2 weeks of a major patch. Users report that the scorer keeps recommending gear the community has flagged as nerfed.

**Prevention:**
- Version-stamp every training corpus with game version and patch number; never mix data across patches.
- Store the raw scrape corpus separately from the model artifact so retraining is possible without re-scraping.
- Surface model version + training patch in the UI so users know when the model is stale.
- Use the deterministic DPS engine (`calcRotationResult`) as a sanity-check layer on top of ML scores: if ML score and DPS delta strongly disagree, flag the item instead of silently ranking it.

**Phase:** Gear Scorer ML phase — add version metadata to corpus and model artifact before first training run.

---

### Pitfall 1.2: Overfitting to Small Corpus (Critical)

**What goes wrong:** Questlog builds represent a biased sample: only players who bothered to share their build. Weapon combos with few public builds (e.g. niche off-meta weapons) have 10-50 samples — far too few for a meaningful ML model. A gradient-boosted tree or even a linear model will overfit and produce confident-but-wrong scores for those slots.

**Why it happens:** Scraping naturally yields a long tail. Popular combos (Staff/Wand, Longbow/Dagger) may have thousands of builds; unpopular ones have dozens.

**Warning sign:** Cross-validation loss is low overall but catastrophically high for specific weapon combos. The model gives very high or very low scores to items from under-represented weapon trees.

**Prevention:**
- Train separate per-weapon-combo models when sample count allows; fall back to a global model with weapon-combo as a feature when it does not.
- Set a minimum sample threshold (suggest: 200 builds per combo) before trusting ML output; below threshold, revert to the deterministic `rankItemUpgrades` function from `gearScorer.ts`.
- Report corpus size and per-weapon sample counts in model metadata — make this visible to the developer during training, not just after deployment.

**Phase:** Gear Scorer ML phase — define corpus quality gates before training, not after.

---

### Pitfall 1.3: ONNX / Runtime Packaging Bloat (Moderate)

**What goes wrong:** The project plan calls for ONNX inference via Python subprocess (matching the existing scraper pattern). This avoids the `onnxruntime-node` native module rebuild problem in Electron, but introduces a different risk: the Python environment must have `onnxruntime` installed, and the model artifact itself can be large (sklearn pipelines serialized to ONNX can easily reach 20-100 MB depending on tree depth and ensemble size).

**Why it happens:** sklearn's `GradientBoostingClassifier` or `RandomForestRegressor` with high `n_estimators` produce large ONNX graphs. The ONNX conversion step (via `skl2onnx`) silently succeeds but produces a model that is slow to load and large to distribute.

**Warning sign:** First inference call after app cold-start takes 3-8 seconds. Model file in `userData` is over 50 MB. Users on slow disks notice visible freeze when opening Gear Scorer page.

**Prevention:**
- During training, enforce `max_depth` and `n_estimators` limits that keep the ONNX artifact under 10 MB. Benchmark load time on target hardware before shipping.
- Use `onnxmltools` with quantization or prune the sklearn model before ONNX conversion.
- Lazy-load the model: do not run inference on app startup; only load when the Gear Scorer page is first opened.
- Cache the loaded session for the app lifetime — do not reload per-request.

**Phase:** Gear Scorer ML phase — add model size and cold-start latency acceptance criteria to the phase success criteria.

---

### Pitfall 1.4: Subprocess Stdout Buffering Deadlock (Moderate)

**What goes wrong:** The existing scraper subprocess pattern in `index.ts` accumulates stdout into a string and parses JSON at process close. This works for the scraper because output is small (one build's stats). An ML inference subprocess that returns scored lists for a large item catalogue (hundreds of items) produces larger output. If stderr also grows (Python warnings, sklearn deprecation notices), the OS pipe buffer fills and the child process blocks waiting for the parent to read — causing a silent deadlock where `proc.on('close', ...)` never fires.

**Why it happens:** Node.js `spawn` with default pipe mode does not drain stderr and stdout concurrently in the current implementation. The Python subprocess blocks on `sys.stdout.write()` when the buffer is full (~65 KB on Windows).

**Warning sign:** Import or score operation hangs indefinitely with no error. The process does not appear in Task Manager as consuming CPU (it is blocked on I/O).

**Prevention:**
- Always drain both `proc.stdout` and `proc.stderr` concurrently via stream events (already done in the scraper handler — verify the ML inference handler matches this pattern).
- Add a hard timeout (e.g. 30 seconds) that `kill()`s the subprocess and rejects the promise.
- Pass `-u` flag to Python (`python -u script.py`) to disable stdout buffering in the Python process itself.
- Keep inference output compact: return only the top-N scored items, not the full item library dump.

**Phase:** Gear Scorer ML phase — the IPC Security phase should audit the new inference IPC handler for this pattern.

---

### Pitfall 1.5: Model Artifact Corruption on Disk (Minor)

**What goes wrong:** The app writes model artifacts to `userData`. If the app crashes mid-write, the artifact is partially written and unloadable. On next startup the inference subprocess crashes with an opaque error.

**Why it happens:** File writes are not atomic unless a tmp-then-rename pattern is used (the existing `data:write` handler does this correctly for `builds.json` but a new model-write handler may not).

**Warning sign:** Inference subprocess fails immediately after an OS crash or hard reboot. Error message from ONNX runtime is cryptic ("failed to read model").

**Prevention:**
- Always write model artifacts using tmp-then-rename (already established pattern in `data:write` handler — replicate it for model writes).
- On load failure, delete the corrupt artifact and surface a "model needs retraining" message rather than crashing.

**Phase:** Gear Scorer ML phase.

---

## Module 2: Log Parser

### Pitfall 2.1: Log Format Changes After Game Patches (Critical)

**What goes wrong:** Throne & Liberty combat logs have an undocumented format that the developer has reverse-engineered. The `parseTLLogTime` function in `LogReader.tsx` hard-codes character offsets (positions 0-4, 4-6, 6-8, etc.) for the timestamp. The game publisher can change this format in any patch with no notice. After a patch, the parser silently produces `NaN` timestamps, and all pull detection (`PULL_GAP_MS` logic) breaks — pulls are not detected and the UI shows no data or a single infinite pull.

**Why it happens:** Game log formats are internal implementation details. Publishers treat them as unstable. There is no versioning or schema contract.

**Warning sign:** After a game patch, users report "no pulls detected" or all events lumped into one pull. `parseTLLogTime` returns 0 for every line.

**Prevention:**
- Add a format-validation step that reads the first 5 lines of a log and asserts the timestamp pattern matches before committing to parsing. Surface a version-mismatch warning in the UI: "Log format may have changed — please report to developers."
- Log one raw line (redacted of player names) to the debug console on parse to make format debugging faster.
- Do not hard-code byte offsets; use a regex with named groups: `/^(?<y>\d{4})(?<M>\d{2})(?<d>\d{2}) (?<h>\d{2}):(?<m>\d{2}):(?<s>\d{2})\.(?<ms>\d{3})/` so a format change produces a clear `null` match rather than silently wrong numbers.
- Separate the timestamp parser into a testable pure function with unit tests covering known-good log samples.

**Phase:** Log Parser phase — validation step must be the first thing built, not retrofitted.

---

### Pitfall 2.2: Large Log Files Blocking the Main Process (Critical)

**What goes wrong:** `combatlog:read-file` reads the entire file synchronously with `fs.readFileSync` in the main process and returns the full string to the renderer. T&L sessions that run for hours produce log files of 100 MB or more. The synchronous read blocks the Electron event loop for 1-3 seconds, freezing the UI entirely.

**Why it happens:** The existing implementation (`index.ts` line 204: `return fs.readFileSync(safe, 'utf-8')`) was designed for small config files. Combat logs do not have a size bound.

**Warning sign:** App freezes for 2-5 seconds when loading a large log file. The window title bar shows "(Not Responding)" on Windows.

**Prevention:**
- Move log parsing to a stream: read the file in chunks using `fs.createReadStream`, emit parsed events back to the renderer progressively via `sender.send()`, and let the renderer update the UI incrementally.
- Alternatively, spawn a worker thread (`worker_threads`) in the main process for synchronous parsing, keeping the event loop free.
- Add file size check before read: if file exceeds a configurable threshold (suggest 50 MB), prompt the user or automatically switch to streaming mode.
- In the short term: replace `readFileSync` with `fs.promises.readFile` so the event loop is not blocked while the OS reads the file.

**Phase:** Log Parser phase — streaming must be designed upfront. Retrofitting a streaming parser into a synchronous design is a near-rewrite.

---

### Pitfall 2.3: Log Encoding Issues on Windows (Moderate)

**What goes wrong:** T&L is a Korean-developed game. Combat logs may contain non-ASCII characters (skill names in localized clients, player names with accented characters, Korean/Japanese characters in international builds). Windows applications that write logs may default to the system ANSI codepage (CP1252 or CP949) rather than UTF-8. `fs.readFileSync(path, 'utf-8')` will silently corrupt or throw on non-UTF-8 bytes.

**Why it happens:** Node.js `readFileSync` with `'utf-8'` encoding throws on invalid byte sequences in some Node versions, and in others silently replaces them with the replacement character `\uFFFD`. Either outcome corrupts skill name matching.

**Warning sign:** Skill names appear as `???` or contain garbled characters. Some log files fail to load with no clear error message.

**Prevention:**
- Read as `Buffer` first, then use `iconv-lite` to detect and convert encoding. Start with UTF-8 and fall back to CP1252 if decoding fails.
- Add a BOM check: if the file starts with `EF BB BF` (UTF-8 BOM) or `FF FE` (UTF-16 LE), handle accordingly.
- Validate the encoding assumption against actual log samples from the Korean client before shipping.

**Phase:** Log Parser phase.

---

### Pitfall 2.4: Pull Detection Gap Tuning (Minor)

**What goes wrong:** The current `PULL_GAP_MS = 15000` constant defines what counts as a new combat pull. This value was chosen by inspection. For raid bosses with long transition phases or open-world farming sessions, 15 seconds may be too short (splitting one pull into many) or too long (merging separate pulls into one).

**Why it happens:** Pull gap is inherently content-dependent. There is no universal correct value.

**Warning sign:** Users report that long boss fights (e.g. world bosses with 30-second phases) appear split into multiple pulls. Or that back-to-back trash pulls are merged.

**Prevention:**
- Make `PULL_GAP_MS` configurable in Settings, not a hardcoded constant.
- Expose it as an advanced setting with a reasonable default (15s) and a brief explanation.

**Phase:** Log Parser phase — expose as a setting from day one, not a follow-up.

---

## Module 3: Rotation Builder

### Pitfall 3.1: Skill Data Staleness (Critical)

**What goes wrong:** `skillsDB.ts` is a manually maintained static list. Throne & Liberty adds and renames skills in patches. The DB will diverge from reality within one or two major updates. When log events reference a skill name not in the DB, `getWeaponBySkill` returns `undefined` / `"Desconhecido"`, corrupting DPS attribution in the Log Reader and breaking rotation suggestions that depend on the skill catalogue.

**Why it happens:** There is no automated source for skill data. The DB was hand-curated from the current game state. There is no mechanism to detect when it goes stale.

**Warning sign:** Log Reader shows a large and growing "Desconhecido" category after a patch. Rotation Builder does not offer skills that the community knows exist.

**Prevention:**
- Add a game version field to `skillsDB.ts` exports (e.g. `export const SKILLS_DB_VERSION = "2025-Q1"`). Surface this in the app's Settings page so users can compare against the current patch.
- Design the skills DB format to be JSON-loadable from `userData`, not compiled into the bundle, so it can be updated by pushing a new JSON file rather than releasing a new app version.
- When `getWeaponBySkill` returns unknown, log the raw skill name to a deduplicated set in the store — expose this set in Settings as "Unknown skills (please report)".

**Phase:** Rotation Builder phase — the JSON-loadable format decision must be made at the start of the phase, not retrofitted later.

---

### Pitfall 3.2: Combinatorial Explosion in Rotation Search (Moderate)

**What goes wrong:** A full rotation search over N skills with M cooldown slots produces O(N!) combinations naively. With T&L's typical 8-12 active skills per weapon plus off-weapon skills, an exhaustive search is computationally infeasible in the renderer thread.

**Why it happens:** DPS optimization is NP-hard in the general case (it reduces to knapsack). A greedy heuristic works for most practical cases but may miss non-obvious synergies (e.g. skill A buffs skill B, so stacking them matters).

**Warning sign:** UI freezes for seconds when the user changes a skill parameter. CPU pegs at 100% in the renderer process.

**Prevention:**
- Do not run rotation optimization in the renderer thread. Use a Web Worker or spawn a Node.js worker thread from the main process.
- Implement greedy-first: sort skills by DPS contribution from `calcSkillDps`, then apply constraints. This is fast and good enough for practical recommendations.
- Cap the search space explicitly: max N skills evaluated, max iteration count. Return the best-found result with a note if the cap was hit.
- The current `rankItemUpgrades` function in `gearScorer.ts` is O(N) (one simulation per candidate item) and is a safe pattern to follow — rotation optimization should not be more complex than necessary.

**Phase:** Rotation Builder phase.

---

### Pitfall 3.3: Stat Weight Hardcoding (Minor)

**What goes wrong:** `STAT_WEIGHTS` in `gearScorer.ts` is a hardcoded map (`critHitChance: 1.2`, etc.). These weights are based on current meta and will be wrong after patches that change skill interactions. A user with a non-standard playstyle (e.g. a tank prioritizing threat-per-second over DPS) gets wrong recommendations.

**Why it happens:** Hardcoded weights are a quick first approximation. They are easy to introduce and hard to remove once users rely on them.

**Prevention:**
- Expose stat weights as user-configurable values in Settings, stored in `settings.json`.
- Provide presets ("DPS meta", "tanky", "custom") instead of a single hardcoded weight set.
- Document clearly in the UI that weights reflect a specific playstyle and patch, not universal truth.

**Phase:** Rotation Builder or Gear Scorer phase, whichever touches `STAT_WEIGHTS` first.

---

## Module 4: IPC Security

### Pitfall 4.1: `sandbox: false` Widens the Blast Radius (Critical)

**What goes wrong:** `createWindow()` sets `sandbox: false`. This allows the preload script to use synchronous Node.js APIs (required for some `@electron-toolkit/preload` features). However, it means that if a renderer XSS or a malicious dependency somehow executes code in the preload context, it has full Node.js access — not just the sandboxed subset. The current `contextIsolation: true` provides the primary barrier, but defense-in-depth requires the sandbox.

**Why it happens:** `sandbox: false` is often set because native modules or synchronous IPC patterns require it. The cost is accepting a wider failure mode.

**Warning sign:** Any future addition of a Web content panel (e.g. embedding a Questlog preview in a `webview` or `BrowserView`) immediately becomes a high-severity risk.

**Prevention:**
- Audit whether `sandbox: false` is truly required for current preload usage or if it was a default that was never revisited. Electron 20+ defaults to `sandbox: true`.
- If native module usage prevents enabling sandbox, document this explicitly and add a comment in `index.ts` explaining why.
- Never embed external web content (Questlog page, wiki, etc.) in the same `BrowserWindow` that has `sandbox: false`. Use a separate sandboxed `BrowserWindow` with no preload for external content.

**Phase:** IPC Security phase — must audit `sandbox: false` decision first.

---

### Pitfall 4.2: IPC Handlers Lack Sender Frame Validation (Moderate)

**What goes wrong:** Every `ipcMain.handle` in `index.ts` accepts requests from `_event.sender` without checking which frame the message came from. In the current app this is fine because there is only one renderer. If a `webview`, iframe, or child window is ever added, those frames can also invoke `data:write`, `combatlog:delete-file`, or `questlog:import-python` — including arbitrary URLs that could be passed to the scraper subprocess.

**Why it happens:** Single-window apps naturally skip frame validation because there is only one sender. The check is easy to forget when the app grows.

**Warning sign:** A future developer adds a Questlog preview panel as a `webview` with `webpreferences` that allow IPC. Suddenly the embedded page can delete combat logs or write arbitrary data to `builds.json`.

**Prevention:**
- Add sender validation to all destructive handlers: `if (event.senderFrame.routingId !== mainFrameRoutingId) return`. Store the main frame ID at window creation.
- At minimum, add a comment block above every `ipcMain.handle` stating the trust assumptions for that handler.
- The IPC Security phase should enumerate every handler and classify it as: read-only, write-local, or destructive — and apply appropriate validation to each tier.

**Phase:** IPC Security phase.

---

### Pitfall 4.3: URL Passed Directly to Python Subprocess Without Validation (Moderate)

**What goes wrong:** `questlog:import-python` receives a `url: string` from the renderer and passes it directly as a CLI argument to the Python scraper: `spawn(pythonBin, [scriptPath, url], ...)`. If `url` contains shell metacharacters, this is not exploitable via `spawn()` (array args bypass shell interpretation) — but if the scraper internally uses the URL in a shell command (`subprocess.run(f"curl {url}", shell=True)`), it becomes an injection vector. Additionally, a malformed URL with very long content or special Unicode could crash the scraper in unexpected ways.

**Why it happens:** `spawn` with an array is safe at the Node.js level, so this risk is easy to dismiss. The risk is in the Python side, which is not audited at the same time.

**Warning sign:** Passing a URL like `https://questlog.gg/build/123 && calc.exe` causes unexpected behavior (Windows `spawn` with array args prevents this, but the Python scraper's internals may not).

**Prevention:**
- Validate the URL in the main process before spawning: assert it matches `^https://questlog\.gg/` with a strict regex. Reject anything that does not match.
- The IPC Security phase must audit the Python scraper's internal URL handling, not just the Node.js spawn call.
- Add a maxLength check on the URL (e.g. 500 characters) to prevent buffer-related crashes in the scraper.

**Phase:** IPC Security phase, with a cross-reference to the scraper codebase.

---

### Pitfall 4.4: `electronAPI` Exposure Without Restriction (Moderate)

**What goes wrong:** `preload/index.ts` exposes `electronAPI` from `@electron-toolkit/preload` via `contextBridge.exposeInMainWorld('electron', electronAPI)`. The `electronAPI` object from this toolkit includes several Electron internal helpers. If a future Electron toolkit version adds more methods to `electronAPI`, they are automatically exposed to the renderer without a conscious security review.

**Why it happens:** Importing a convenience object and re-exporting it is simpler than constructing a minimal API surface. The risk grows silently as the toolkit evolves.

**Warning sign:** `window.electron` in the renderer has more methods than the app intentionally exposed. A developer uses `window.electron.shell.openExternal(userInput)` from the renderer, bypassing main-process validation.

**Prevention:**
- Replace `contextBridge.exposeInMainWorld('electron', electronAPI)` with an explicit minimal object exposing only the properties actually used (e.g. `ipcRenderer.on`, `ipcRenderer.removeAllListeners`). Do not re-export the entire toolkit object.
- The IPC Security phase should audit what `electronAPI` actually contains in the current toolkit version and decide which members are intentionally public.

**Phase:** IPC Security phase.

---

### Pitfall 4.5: Missing Schema Validation on `data:write` Payload (Minor)

**What goes wrong:** `data:write` accepts `(filename: string, data: unknown)` and writes `JSON.stringify(data)` to `DATA_DIR`. The `filename` is sanitized (`sanitizeDataFilename`), but `data` is written verbatim. A renderer bug (or future renderer code that incorrectly calls `data:write`) could overwrite `builds.json` with partial, structurally invalid JSON — corrupting all saved builds permanently.

**Why it happens:** The main process trusts that the renderer sends well-formed data. This is reasonable for a single-developer app but is fragile.

**Warning sign:** After a crash or a renderer-side bug during a write, `builds.json` contains partial data and the app silently starts with no builds.

**Prevention:**
- For known schemas (`builds.json`, `settings.json`), validate the payload structure in the main process before writing. A minimal check (e.g. `typeof data === 'object' && data !== null`) prevents the most common corruption scenarios.
- The atomic tmp-then-rename pattern (already in place) prevents partial writes, but it does not prevent a structurally wrong payload from replacing a correct one.

**Phase:** IPC Security phase.

---

## Phase-Specific Summary

| Phase | Top Pitfall to Address First |
|-------|------------------------------|
| Gear Scorer ML | Version-stamp training corpus before first scrape; set corpus size gate before training |
| Log Parser | Implement streaming read before building any parse logic; add format-validation as first parser step |
| Rotation Builder | Decide JSON-loadable skill DB format before writing any rotation logic; run optimization in a worker |
| IPC Security | Audit `sandbox: false` decision; enumerate all handlers by trust tier; validate URL before subprocess spawn |

---

## Sources

- [Electron Security Official Docs](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox/)
- [The Risks of Misusing Electron IPC — DEV Community](https://dev.to/code-nit-whit/the-risks-of-misusing-electron-ipc-2jii)
- [Element Desktop RCE (CVE-2022-23597) — Electrovolt](https://blog.electrovolt.io/posts/element-rce/)
- [Bishop Fox: Reasonably Secure Electron](https://bishopfox.com/blog/reasonably-secure-electron)
- [Penetration Testing of Electron Applications — Deepstrike](https://deepstrike.io/blog/penetration-testing-of-electron-based-applications)
- [Shipping Large ML Models with Electron — acreom blog](https://acreom.com/blog/shipping-large-ml-models-with-electron)
- [ONNX Runtime: onnxruntime-node Electron crash issue](https://github.com/microsoft/onnxruntime/issues/13086)
- [AI Model Drift and Retraining Guide — SmartDev](https://smartdev.com/ai-model-drift-retraining-a-guide-for-ml-system-maintenance/)
- [5 Critical Feature Engineering Mistakes — KDnuggets](https://www.kdnuggets.com/5-critical-feature-engineering-mistakes-that-kill-machine-learning-projects)
- [Python subprocess stdout buffering — Python docs](https://docs.python.org/3/library/subprocess.html)
- [Processing subprocess output in real-time — tbrink.science](https://tbrink.science/blog/2017/04/30/processing-the-output-of-a-subprocess-with-python-in-realtime/)
