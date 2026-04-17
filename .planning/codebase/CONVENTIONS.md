# Coding Conventions

**Analysis Date:** 2026-04-11

## TypeScript Usage

**Strict Mode:** Enabled in both `tsconfig.web.json` and `tsconfig.node.json` (`"strict": true`).

**Target:** ES2022 for both renderer and main process.

**Type imports:** `import type` is consistently used for type-only imports, keeping runtime bundles clean.

```typescript
// Correct pattern used throughout
import type { Build, BuildStats } from '../engine/types'
import type { QuestlogApiResult } from '../engine/questlogParser'
```

**Interface vs type alias:**
- `interface` for object shapes (data models, prop contracts, store shapes): `BuildStats`, `Build`, `DamageResult`, `BuildsState`, `NavItem`
- `type` for union types and aliases: `Page = 'dashboard' | 'calculator' | ...`, `StatKey = keyof BuildStats`

**No `any`:** Not observed anywhere in `src/`. In Electron code only `unknown` is used for IPC payloads, with narrowing via type guards before use.

**Exported constants from modules:**
- `DEFAULT_STATS` exported from `src/engine/types.ts` — used as spread baseline everywhere stats are constructed.

**Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.web.json`). In practice, relative imports are used throughout the renderer — the alias is available but not actively used.

## React Component Conventions

**All components are named function exports** (not default exports, except `App.tsx`):

```typescript
// Correct: named export
export function Dashboard(): React.ReactElement { ... }
export function Sidebar({ active, onChange }: Props): React.ReactElement { ... }

// Exception: root entry
export default function App(): React.ReactElement { ... }
```

**Return type is always declared explicitly** as `React.ReactElement`.

**Props are typed via local `interface Props`** defined inline above the component:

```typescript
interface Props {
  active:   Page
  onChange: (page: Page) => void
}
export function Sidebar({ active, onChange }: Props): React.ReactElement { ... }
```

**Hooks used:** `useState`, `useEffect`, `useMemo`. `useCallback` is not used.

**`useMemo` is applied consistently** for derived data from store state:

```typescript
const buildList = useMemo(() => Object.values(builds), [builds])
const dpsData   = useMemo(() => buildList.map(...).sort(...), [buildList])
```

**Event handlers** are plain functions defined inside the component body (not arrow functions assigned to variables at module level):

```typescript
function applySource(colIdx: number, buildId: string) { ... }
function updateField(colIdx: number, key: StatKey, value: number) { ... }
```

**`React.StrictMode`** is enabled in `src/main.tsx`.

## Naming Conventions

**Files:**
- Pages: PascalCase matching component name — `Dashboard.tsx`, `Calculator.tsx`, `Comparator.tsx`
- Components: PascalCase — `Sidebar.tsx`
- Engine/logic: camelCase — `calculator.ts`, `questlogParser.ts`, `useBuilds.ts`
- Type definitions: lowercase — `types.ts`

**Components:** PascalCase — `Dashboard`, `Sidebar`, `Calculator`

**Functions (engine/helpers):** camelCase — `calcAverageDPS`, `critChanceFromStat`, `parseQuestlogResult`, `numVal`, `pick`

**Variables:** camelCase — `buildList`, `dpsData`, `activeDps`, `critChance`

**Constants (module-level):** SCREAMING_SNAKE_CASE — `COLORS`, `NAV`, `GROUPS`, `FIELDS`, `DR`, `COLS`, `FILE`, `SENSITIVITY_DELTAS`, `ELASTICITY_TESTS`

**Interfaces:** PascalCase without `I` prefix — `BuildStats`, `Build`, `DamageResult`, `NavItem`

**Type aliases:** PascalCase — `Page`, `StatKey`, `BuildMap`

**Store hooks:** `use` prefix, PascalCase subject — `useBuilds`

**IPC channel names:** `namespace:action` format — `data:read`, `data:write`, `questlog:import-url`

## Styling Approach

**Hybrid strategy: custom CSS classes + inline styles.** Tailwind is installed and configured but barely used in component JSX. The dominant pattern is:

1. **Custom semantic CSS classes** defined in `src/styles/globals.css` using CSS custom properties:
   - `.tl-panel`, `.tl-card`, `.tl-stat-card` — container variants
   - `.tl-btn`, `.tl-btn-ghost` — button variants
   - `.tl-input` — form inputs
   - `.tl-tag`, `.tl-tag-gold`, `.tl-tag-violet`, `.tl-tag-cyan`, `.tl-tag-green`, `.tl-tag-red` — badges
   - `.tl-eyebrow` — section label typography
   - `.tl-hero` — page header block
   - `.tl-divider` — horizontal rule

2. **CSS custom properties (design tokens)** defined on `:root` in `globals.css`:
   - `--bg`, `--bg-panel`, `--bg-card`, `--bg-hover`, `--bg-input`
   - `--gold`, `--gold-l`, `--gold-dim`, `--gold-glow`
   - `--violet`, `--violet-dim`, `--cyan`, `--cyan-dim`
   - `--text`, `--text-soft`, `--text-muted`
   - `--border`, `--border-gold`, `--border-violet`

3. **Inline `style={}` props** for layout and one-off overrides (spacing, grid columns, flex, dimension values). Color values are sometimes repeated as hex literals in inline styles rather than using the CSS tokens.

4. **Tailwind utilities** used sparingly and only from the global font utilities: `font-mono`, `font-serif` (defined as `.font-mono { font-family: 'JetBrains Mono' }` via Tailwind's `@layer utilities` or direct class).

**Rule:** Use `tl-*` classes for reusable UI primitives. Use inline styles only for layout dimensions, spacing, and grid definitions that vary per usage.

**Fonts:**
- `Inter` — body/UI text (default)
- `Noto Serif` — headings and build names (`.font-serif` / `fontFamily: 'Noto Serif, serif'`)
- `JetBrains Mono` — numeric data, inputs, chart ticks (`.font-mono`)

## Import Organization

Imports are grouped without blank lines between groups — order observed:

1. React (always first): `import React, { useState, useMemo } from 'react'`
2. Third-party libraries: `recharts`, `zustand`
3. Internal engine/store: `'../engine/calculator'`, `'../store/useBuilds'`
4. Internal types (with `import type`): `'../engine/types'`

No barrel `index.ts` files in `src/`. All imports use direct file paths.

## Code Style & Formatting

**No ESLint or Prettier config files found** at the project root. There is no `.eslintrc*`, `eslint.config.*`, or `.prettierrc*`.

**Visual alignment:** Object properties and type fields are manually aligned using spaces for readability — a consistent house style applied throughout:

```typescript
interface BuildStats {
  skillBaseDamagePct:   number  // e.g. 595
  skillBonusBaseDmg:    number  // e.g. 602
  minWeaponDmg:         number
}

const dataAPI = {
  read:       (filename: string) => ipcRenderer.invoke('data:read', filename),
  write:      (filename: string, data: unknown) => ...,
  importFile: () => ...,
}
```

**Section separators:** Decorative comments used to divide logical sections within files:

```typescript
// ─── Core probability formulas ────────────────────────────────────────────────
// ─── Build stat model ─────────────────────────────────────────────────────────
```

**Format helpers** are module-level constants named `fmt` and `fmtP`, repeated in each page file:

```typescript
const fmt  = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const fmtP = (n: number) => `${n.toFixed(1)}%`
```

These are duplicated across `Dashboard.tsx`, `Builds.tsx`, `Calculator.tsx`, `Comparator.tsx`, `Sensitivity.tsx` rather than shared from a utility module.

## Function Design

**Pure functions in engine:** All functions in `src/engine/calculator.ts` are pure — no side effects, no external state. Private helpers are unexported `function` declarations.

**Guard clauses at top:** Engine functions use early returns for edge cases:

```typescript
export function critChanceFromStat(stat: number): number {
  if (stat <= 0) return 0
  return stat / (stat + DR)
}
```

**Zustand store actions** are defined inline in the `create()` call and are async where I/O is involved.

---

*Convention analysis: 2026-04-11*
