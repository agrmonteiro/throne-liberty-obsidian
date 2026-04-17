# Codebase Structure

**Analysis Date:** 2026-04-11

## Directory Layout

```
throne_and_liberty_node/
├── electron/                     # Electron process source (compiled to dist-electron/)
│   ├── main/
│   │   └── index.ts              # Main process entry — IPC handlers, window, app lifecycle
│   └── preload/
│       └── index.ts              # Preload bridge — exposes dataAPI via contextBridge
│
├── src/                          # Renderer process source (compiled to dist/)
│   ├── main.tsx                  # React bootstrap — mounts <App /> into #root
│   ├── App.tsx                   # App shell — page routing state, loads builds on mount
│   ├── env.d.ts                  # Vite/Electron type augmentations
│   │
│   ├── components/
│   │   └── Sidebar.tsx           # Left navigation panel with grouped nav items
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx         # War Room — KPI cards + DPS bar chart + active build panel
│   │   ├── Builds.tsx            # Build manager — import/create/edit/delete/export
│   │   ├── Calculator.tsx        # 4-column DPS calculator with elasticity chart
│   │   ├── Comparator.tsx        # Multi-build radar chart + side-by-side table
│   │   └── Sensitivity.tsx       # Stat sensitivity ranking — which stat gains most DPS/unit
│   │
│   ├── engine/
│   │   ├── types.ts              # All domain types: BuildStats, Build, BuildMap, DamageResult, etc.
│   │   ├── calculator.ts         # Pure damage math: calcAverageDPS, calcResult, calcSensitivity, calcElasticity
│   │   └── questlogParser.ts     # Converts raw tRPC API response to normalized Build object
│   │
│   ├── store/
│   │   └── useBuilds.ts          # Zustand store — all build state + async IPC actions + Python build parsers
│   │
│   └── styles/
│       └── globals.css           # Design tokens (CSS vars), base reset, all tl-* utility classes
│
├── dist-electron/                # Compiled Electron processes (git-ignored in practice)
│   ├── main/
│   │   └── index.js              # Compiled main process
│   └── preload/
│       └── index.js              # Compiled preload script
│
├── dist/                         # Compiled renderer (Vite output)
│   ├── index.html                # Renderer HTML entry
│   └── assets/                   # Bundled JS/CSS chunks
│
├── out/                          # electron-vite intermediate output (also used for preview)
│   ├── main/
│   └── preload/
│
├── index.html                    # Root HTML — loads /src/main.tsx as ESM module
├── electron.vite.config.ts       # Build config for all 3 processes (main, preload, renderer)
├── package.json                  # Scripts: dev, build, package (NSIS installer)
├── tsconfig.json                 # Root tsconfig — references node and web configs
├── tsconfig.node.json            # TypeScript config for electron/ (ES2022, no DOM)
├── tsconfig.web.json             # TypeScript config for src/ (ES2022 + DOM, JSX, @/* alias)
├── tailwind.config.js            # Tailwind config (content paths for purging)
└── postcss.config.js             # PostCSS config (autoprefixer + tailwindcss)
```

## Directory Purposes

**`electron/main/`:**
- Purpose: The privileged Node.js process. Everything that needs file system, native OS dialogs, HTTP, or child processes lives here.
- Contains: One file (`index.ts`) with IPC handler registrations, `createWindow()`, `ensureDataDir()`, and the tRPC + Python scraper import logic.
- Key files: `electron/main/index.ts`

**`electron/preload/`:**
- Purpose: Security boundary. Runs in a sandboxed context with access to both `ipcRenderer` and the DOM — bridges the two.
- Contains: One file (`index.ts`) that assembles `dataAPI` and calls `contextBridge.exposeInMainWorld`.
- Key files: `electron/preload/index.ts`

**`src/engine/`:**
- Purpose: Domain logic with zero framework dependencies. Pure TypeScript functions that can be unit-tested without Electron or React.
- Contains: Type definitions, damage formulas, and the Questlog API response parser.
- Key files: `src/engine/types.ts`, `src/engine/calculator.ts`, `src/engine/questlogParser.ts`

**`src/store/`:**
- Purpose: The single state container for the renderer. Acts as the anti-corruption layer between the IPC API and the React UI.
- Contains: One Zustand store file that also includes inline parsers for both Python scraper output formats (new and old).
- Key files: `src/store/useBuilds.ts`

**`src/pages/`:**
- Purpose: Full-screen page views. Each page is a self-contained React component that reads from the Zustand store and calls engine functions directly.
- Contains: 5 pages — Dashboard, Builds, Calculator, Comparator, Sensitivity.
- Key files: all files in `src/pages/`

**`src/components/`:**
- Purpose: Shared UI components used across multiple pages.
- Contains: Currently only `Sidebar.tsx`. Intended for future shared widgets.
- Key files: `src/components/Sidebar.tsx`

**`src/styles/`:**
- Purpose: Global CSS — design tokens, reset, and the full `tl-*` component class system.
- Contains: `globals.css` — imported once in `src/main.tsx`.
- Key files: `src/styles/globals.css`

## Key File Locations

**Entry Points:**
- `electron/main/index.ts`: Main process entry — first code Electron executes
- `electron/preload/index.ts`: Preload script — injected before renderer loads
- `src/main.tsx`: Renderer entry — React `createRoot` + global CSS import
- `index.html`: HTML shell that Vite/Electron loads for the renderer

**Configuration:**
- `electron.vite.config.ts`: Vite build config for all 3 targets (main, preload, renderer). Defines output directories and the `@/` path alias for the renderer.
- `tsconfig.node.json`: TypeScript for `electron/` — targets ES2022, no DOM types
- `tsconfig.web.json`: TypeScript for `src/` — targets ES2022 + DOM, JSX enabled, `@/*` → `src/*` alias
- `package.json`: npm scripts (`dev`, `build`, `package`), electron-builder config for Windows NSIS installer

**Core Logic:**
- `src/engine/types.ts`: Canonical type definitions — start here when understanding the domain model
- `src/engine/calculator.ts`: All DPS math — `calcAverageDPS` is the central formula
- `src/store/useBuilds.ts`: All state mutations — the only place that calls `window.dataAPI`

**Styling:**
- `src/styles/globals.css`: All CSS custom properties and utility classes — reference this before writing any UI code

## Naming Conventions

**Files:**
- React components: PascalCase matching the exported component name (`Dashboard.tsx`, `Sidebar.tsx`)
- Engine/store modules: camelCase (`calculator.ts`, `questlogParser.ts`, `useBuilds.ts`)
- Config files: kebab-case or framework convention (`electron.vite.config.ts`, `tailwind.config.js`)

**Directories:**
- Lowercase, purpose-named (`engine/`, `pages/`, `components/`, `store/`, `styles/`)

**CSS Classes:**
- All custom classes prefixed with `tl-` (`tl-card`, `tl-btn`, `tl-input`, `tl-panel`, `tl-stat-card`, `tl-hero`, `tl-eyebrow`, `tl-dmg`, `tl-tag`, `tl-tab`)
- Modifier classes use `-` separator (`tl-tag-gold`, `tl-tag-violet`, `tl-btn-ghost`, `tl-gain-pos`, `tl-gain-neg`)

**IPC Channel Names:**
- Format: `namespace:action` using kebab-case (`data:read`, `data:write`, `data:import-file`, `data:export-file`, `questlog:import-url`, `questlog:import-python`)

**Zustand Store:**
- Hook named `useBuilds` (exported from `src/store/useBuilds.ts`)
- Store state keys use camelCase (`activeBuildId`, `loadFromDisk`, `importFromUrl`)

## Where to Add New Code

**New page/view:**
- Implementation: `src/pages/NewPage.tsx` — export a named function component
- Register in `App.tsx`: add to the `Page` union type and the `PageComponent` map
- Add nav item in `src/components/Sidebar.tsx`: add entry to the `NAV` array with `id`, `icon`, `label`, `group`

**New engine formula:**
- Add to `src/engine/calculator.ts` — keep it a pure exported function
- If new input fields are needed, extend `BuildStats` in `src/engine/types.ts` and add defaults to `DEFAULT_STATS`

**New IPC channel:**
- Handler: add `ipcMain.handle('namespace:action', ...)` in `electron/main/index.ts`
- Bridge: add wrapper method to `dataAPI` object in `electron/preload/index.ts`
- Type: extend the `Window.dataAPI` interface declaration in `src/store/useBuilds.ts`

**New import format (scraper output):**
- Add a new parser function in `src/store/useBuilds.ts` (following the pattern of `parsePythonBuild` / `parseNewScraperFormat`)
- The parser must return a `Build` with a valid `BuildStats` object

**New shared UI component:**
- Implementation: `src/components/ComponentName.tsx`
- Use existing CSS design tokens from `src/styles/globals.css` (`var(--bg-card)`, `var(--gold)`, etc.) and `tl-*` classes

**New data file persisted to disk:**
- Add default value to the `defaults` map in `ensureDataDir()` in `electron/main/index.ts`
- Use `window.dataAPI.read('filename.json')` / `window.dataAPI.write('filename.json', data)` in the store

## Special Directories

**`dist-electron/`:**
- Purpose: Compiled output of `electron/main/` and `electron/preload/` — consumed by Electron at runtime
- Generated: Yes (by `electron-vite build`)
- Committed: Yes (present in repo based on directory listing — unusual but intentional for this project)

**`dist/`:**
- Purpose: Compiled renderer output — the React app as static files loaded by the Electron window
- Generated: Yes (by Vite / `electron-vite build`)
- Committed: Yes (same reasoning)

**`out/`:**
- Purpose: Intermediate electron-vite output used by `electron-vite preview`
- Generated: Yes
- Committed: Yes (present in repo)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No

**`.planning/`:**
- Purpose: GSD planning documents (phases, codebase analysis)
- Generated: No (manually maintained)
- Committed: Yes

---

*Structure analysis: 2026-04-11*
