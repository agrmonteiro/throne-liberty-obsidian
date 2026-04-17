# Testing Patterns

**Analysis Date:** 2026-04-11

## Test Framework

**Runner:** None installed.

No test framework is present in the project. `package.json` lists zero testing dependencies — no Jest, Vitest, Playwright, Cypress, or Testing Library packages exist in either `dependencies` or `devDependencies`.

**Test scripts in `package.json`:**

```json
"scripts": {
  "dev":     "electron-vite dev",
  "build":   "electron-vite build",
  "package": "electron-vite build && electron-builder --win",
  "preview": "electron-vite preview"
}
```

There is no `test`, `test:watch`, or `test:coverage` script.

**Test files found:** Zero. No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files exist anywhere in the project.

**Assertion library:** None.
**Mocking framework:** None.
**E2E framework:** None.

---

## Current Coverage

**100% untested.** No automated tests of any kind exist for this codebase.

---

## What Should Be Tested (Priority Order)

### 1. Engine — `src/engine/calculator.ts` (HIGH priority)

This is the core business logic. All functions are pure — they take plain objects and return numbers or arrays. They are the easiest and highest-value testing targets.

**Functions to test:**

- `critChanceFromStat(stat)` — boundary: `stat <= 0` returns 0, positive values return `stat / (stat + 1000)`
- `heavyChanceFromStat(stat)` — identical contract to above
- `calcAverageDPS(stats: BuildStats)` — the main formula; test with known inputs against expected DPS values
- `calcResult(stats, baselineAvg)` — produces `DamageResult`; verify all fields including `gainPct` against baseline
- `calcModifiers(stats)` — verify `minBase` and `maxCrit` computations
- `calcSensitivity(stats)` — verify output is sorted by weight descending, weights sum to ~100, returns correct number of entries
- `calcElasticity(stats, iterations)` — verify iteration count, gainPct monotonicity for increasing stats, output array length

**Example test structure (Vitest):**

```typescript
import { describe, it, expect } from 'vitest'
import { critChanceFromStat, calcAverageDPS } from '../src/engine/calculator'
import { DEFAULT_STATS } from '../src/engine/types'

describe('critChanceFromStat', () => {
  it('returns 0 for zero or negative stat', () => {
    expect(critChanceFromStat(0)).toBe(0)
    expect(critChanceFromStat(-50)).toBe(0)
  })
  it('returns stat / (stat + 1000)', () => {
    expect(critChanceFromStat(1000)).toBeCloseTo(0.5)
    expect(critChanceFromStat(500)).toBeCloseTo(0.333, 2)
  })
})

describe('calcAverageDPS', () => {
  it('returns 0 for empty stats', () => {
    expect(calcAverageDPS(DEFAULT_STATS)).toBe(0)
  })
  it('increases DPS when critHitChance increases', () => {
    const base  = { ...DEFAULT_STATS, maxWeaponDmg: 1000, minWeaponDmg: 800 }
    const withCrit = { ...base, critHitChance: 500 }
    expect(calcAverageDPS(withCrit)).toBeGreaterThan(calcAverageDPS(base))
  })
})
```

### 2. Parser — `src/engine/questlogParser.ts` (HIGH priority)

`parseQuestlogResult` transforms external API payloads into `Build` objects. This is fragile because the input schema (the Questlog API) can change without notice. Testing this with fixture data would catch regressions.

**What to test:**
- Correct extraction of `minWeaponDmg` / `maxWeaponDmg` from range stat entries
- Fallback priority: `Magic Critical Hit Chance` → `Melee Critical Hit Chance` → `Ranged`
- `heavyAttackDmgComp` > 100 normalization
- `weaponCombo` construction from `weapon_types`
- Graceful handling of missing / null stats fields

**Fixtures needed:** JSON snapshots of real API responses — both the Questlog tRPC format (`QuestlogApiResult`) and the Python scraper format.

### 3. Store — `src/store/useBuilds.ts` (MEDIUM priority)

The Zustand store has complex logic that is difficult to unit test because it calls `window.dataAPI` (Electron IPC). Testing requires either:
- Mocking `window.dataAPI` per test
- Testing the private helpers (`parsePythonBuild`, `parseNewScraperFormat`, `parseOldFormat`) directly if exported

**What to test without mocking Electron:**
- `parsePythonBuild` internal logic for new scraper format vs old format detection
- `createEmpty` — produces valid `Build` with correct defaults
- `parseOldFormat` stat extraction

**What requires mocking `window.dataAPI`:**
- `loadFromDisk`, `saveBuild`, `deleteBuild`, `importFromUrl`, `importFromFile`

### 4. React Components (LOW priority for unit tests)

Component logic is thin — mostly connecting store state to JSX. The meaningful logic lives in the engine layer. Shallow render tests would add marginal value.

However, integration-level E2E tests (Playwright) would be valuable for:
- Importing a build from a URL (happy path + error path)
- Switching active build and verifying DPS panels update
- Calculator field edits propagating to results

---

## Recommended Setup

**Recommended framework: Vitest**

Vitest integrates natively with the existing Vite/electron-vite build chain, requires minimal config, and supports TypeScript out of the box.

**Install:**
```bash
npm install -D vitest @vitest/coverage-v8
```

**Minimal `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',   // engine tests don't need a DOM
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
    },
  },
})
```

**Add to `package.json`:**
```json
"scripts": {
  "test":          "vitest run",
  "test:watch":    "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Recommended test file locations:**
- `src/engine/calculator.test.ts`
- `src/engine/questlogParser.test.ts`

Co-locate test files next to the source files they test. No separate `__tests__` directory needed given the small surface area.

---

## Coverage Gaps Summary

| Area | File | Test Priority | Testability |
|------|------|--------------|-------------|
| DPS engine formulas | `src/engine/calculator.ts` | HIGH | Pure functions — trivial |
| Questlog parser | `src/engine/questlogParser.ts` | HIGH | Pure function — needs fixtures |
| Python build parser | `src/store/useBuilds.ts` (private) | MEDIUM | Pure but unexported |
| Zustand store actions | `src/store/useBuilds.ts` | MEDIUM | Requires `window.dataAPI` mock |
| React pages | `src/pages/*.tsx` | LOW | Logic-thin, E2E preferred |
| Electron IPC handlers | `electron/main/index.ts` | LOW | Requires Electron test harness |

---

*Testing analysis: 2026-04-11*
