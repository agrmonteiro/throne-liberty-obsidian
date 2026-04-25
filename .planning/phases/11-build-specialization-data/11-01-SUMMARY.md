---
phase: 11-build-specialization-data
plan: "01"
subsystem: data-model
tags: [typescript, build-model, scraper-parser, specialization]
dependency_graph:
  requires: []
  provides: [Build.specialization, Build.weaponMain, Build.weaponOff]
  affects: [src/engine/types.ts, src/store/useBuilds.ts]
tech_stack:
  added: []
  patterns: [type-guard-inline, optional-fields, iife-filter]
key_files:
  created: []
  modified:
    - src/engine/types.ts
    - src/store/useBuilds.ts
decisions:
  - "Campos specialization/weaponMain/weaponOff são opcionais na interface Build para retrocompatibilidade com builds antigas"
  - "Type guard inline com reduce em parseNewScraperFormat filtra itens malformados silenciosamente (T-11-01)"
  - "weaponMain/weaponOff usam typeof === 'string' guard simples (T-11-02)"
  - "parseOldFormat não toca nos novos campos — apenas parseNewScraperFormat os extrai"
metrics:
  duration: "~2 minutos"
  completed: "2026-04-25"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 11 Plan 01: Build Specialization Data Model — Summary

**One-liner:** Interface Build estendida com 3 campos opcionais de especialização (Questlog format) e extração com type guards em parseNewScraperFormat.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Estender interface Build em types.ts | 8a51e53 | src/engine/types.ts |
| 2 | Extrair specialization/weaponMain/weaponOff em parseNewScraperFormat | ca7f7bd | src/store/useBuilds.ts |

## What Was Built

### Task 1 — Interface Build estendida (types.ts, linha 74-76)

Três campos opcionais adicionados ao final da interface `Build`, após `rawStats?:`:

```typescript
specialization?: Array<{ id: string; lvl: number }>
weaponMain?:     string   // ex: "staff" (lowercase, formato Questlog)
weaponOff?:      string   // ex: "wand" (lowercase, formato Questlog)
```

Campos opcionais garantem que builds antigas carregadas do disco não quebrem — os campos ficam `undefined` implicitamente.

### Task 2 — Extração em parseNewScraperFormat (useBuilds.ts, linhas 332-360)

Variáveis adicionadas antes do `return` final da função:

- `rawSpec = raw.specialization` — captura o array bruto não tipado
- IIFE com `reduce` que filtra item a item: só aceita `{ id: string, lvl: number }` — itens malformados são descartados silenciosamente (mitiga T-11-01)
- Array vazio após filtro retorna `undefined` (sem serializar array vazio)

No objeto de retorno (linha 358-360):
```typescript
specialization,
weaponMain: typeof raw.weaponMain === 'string' ? raw.weaponMain : undefined,
weaponOff:  typeof raw.weaponOff  === 'string' ? raw.weaponOff  : undefined,
```

## Verification Results

### npx tsc --noEmit
```
(exit code 0 — sem erros)
```

### npm run build
```
877 modules transformed
dist-electron/renderer/index.html      0.42 kB
dist-electron/renderer/assets/index.css   25.60 kB
dist-electron/renderer/assets/index.js  1,996.13 kB
✓ built in 4.13s
```

### Structural Checks
- `src/engine/types.ts` linha 74: `specialization?: Array<{ id: string; lvl: number }>`
- `src/engine/types.ts` linha 75: `weaponMain?:     string`
- `src/engine/types.ts` linha 76: `weaponOff?:      string`
- `parseOldFormat`: 0 ocorrências de specialization/weaponMain/weaponOff
- `validateScraperOutput`: não alterada

## Decisions Made

1. **Campos opcionais na interface Build** — retrocompatibilidade total com builds antigas já no disco do usuário; nenhuma migração necessária
2. **Type guard via reduce (não filter+map)** — permite descartar silenciosamente itens malformados em uma única passagem sem double-iteration
3. **IIFE para specialization** — mantém a lógica de filtragem encapsulada inline sem criar função auxiliar separada, consistente com o estilo do arquivo
4. **weaponMain/weaponOff distintos de RotationCharacter.weaponMainType/weaponOffType** — documentado em comentário inline para evitar confusão futura (D-06 do contexto)

## Deviations from Plan

None — plano executado exatamente conforme especificado.

## Known Stubs

None — nenhum dado mockado ou placeholder. Os campos são opcionais e `undefined` quando o scraper não fornece os dados; isso é comportamento correto, não um stub.

## Threat Flags

Nenhuma nova superfície de segurança introduzida além do que já estava no threat model do plano (T-11-01 a T-11-04 todos cobertos).

## Self-Check: PASSED

- [x] `src/engine/types.ts` modificado — FOUND (commit 8a51e53)
- [x] `src/store/useBuilds.ts` modificado — FOUND (commit ca7f7bd)
- [x] `npx tsc --noEmit` exit code 0 — CONFIRMED
- [x] `npm run build` sucesso — CONFIRMED
- [x] `parseOldFormat` sem novos campos — CONFIRMED (0 ocorrências)
