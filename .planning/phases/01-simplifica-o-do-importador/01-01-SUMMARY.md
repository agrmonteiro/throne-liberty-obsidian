---
phase: 01-simplifica-o-do-importador
plan: 01
subsystem: electron-ipc
tags: [cleanup, dead-code, trpc-removal, ipc, security]
dependency_graph:
  requires: []
  provides: [main-process-sem-trpc, preload-sem-questlogImport, store-sem-importFromUrl]
  affects: [electron/main/index.ts, electron/preload/index.ts, src/store/useBuilds.ts]
tech_stack:
  added: []
  patterns: [ipc-handler-removal, interface-cleanup]
key_files:
  modified:
    - electron/main/index.ts
    - electron/preload/index.ts
    - src/store/useBuilds.ts
decisions:
  - "Remoção cirúrgica do bloco tRPC — sem refactoring adicional. Apenas dead code eliminado."
  - "net removido do import de electron pois era usado exclusivamente por trpcGet."
metrics:
  duration: "~8 minutos"
  completed: "2026-04-12"
  tasks_completed: 2
  files_modified: 3
---

# Phase 01 Plan 01: Remoção do Caminho tRPC Summary

**One-liner:** Remoção completa do handler `questlog:import-url` e código tRPC auxiliar — três arquivos limpos, único caminho de importação agora é o scraper Python.

## O Que Foi Feito

### Tarefa 1 — electron/main/index.ts (commit 039bc40)

Removido o bloco completo "Questlog tRPC import" (originalmente linhas 92–156):

- Constante `TRPC_BASE = 'https://questlog.gg/throne-and-liberty/api/trpc/'`
- Função `extractSlugAndBuildId(url)` — extraía slug e buildId de URL
- Função `trpcGet(method, input)` — chamada HTTP via `net.fetch` ao endpoint tRPC
- Handler `ipcMain.handle('questlog:import-url', ...)` — handler IPC que orquestrava a importação via tRPC

Removido `net` do import destrutivo de `electron` na linha 1 (era usado exclusivamente por `trpcGet`).

O handler `questlog:import-python`, a função `findPythonScraper` e a constante `PYTHON_SCRAPER` foram mantidos intactos.

### Tarefa 2 — electron/preload/index.ts + src/store/useBuilds.ts (commit e7980f6)

**electron/preload/index.ts:**
- Removida a linha `questlogImport: (url: string) => ipcRenderer.invoke('questlog:import-url', url)` do objeto `dataAPI`
- `questlogImportPython` permanece no objeto

**src/store/useBuilds.ts:**
- Removidos imports: `import { parseQuestlogResult } from '../engine/questlogParser'` e `import type { QuestlogApiResult } from '../engine/questlogParser'`
- Removida declaração `importFromUrl: (url: string) => Promise<Build | { error: string }>` da interface `BuildsState`
- Removida declaração `questlogImport: (url: string) => Promise<QuestlogApiResult>` da interface `Window.dataAPI`
- Removida implementação da action `importFromUrl` (chamava `window.dataAPI.questlogImport` e `parseQuestlogResult`)
- `parsePythonBuild`, `parseNewScraperFormat`, `parseOldFormat` mantidos intactos para uso de `importFromUrlPython`

## Verificação Final

Buscas no projeto após as remoções — todas retornaram vazio:

| Padrão buscado | Resultado |
|---|---|
| `questlog:import-url` em `electron/` e `src/` | VAZIO |
| `importFromUrl` (sem sufixo Python) em `src/store/` | VAZIO |
| `questlogImport` (sem sufixo Python) em `src/` e `electron/` | VAZIO |
| `questlogParser` em `src/` | VAZIO |
| `TRPC_BASE`, `trpcGet`, `extractSlugAndBuildId` em `electron/` | VAZIO |

`npm run build` retornou código 0 sem erros TypeScript em ambas as tarefas.

## Commits

| Task | Commit | Descrição |
|---|---|---|
| Tarefa 1 | 039bc40 | feat(01-01): remover bloco tRPC do main process |
| Tarefa 2 | e7980f6 | feat(01-01): remover questlogImport do preload e interface Window |

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito.

## Known Stubs

Nenhum. As remoções não introduziram stubs — eliminaram código morto.

## Threat Flags

Nenhum. As remoções eliminam a superfície de ataque descrita no threat model (T-01-01-01, T-01-01-02, T-01-01-03), não criam nova superfície.

## Self-Check: PASSED

- `electron/main/index.ts` existe e não contém `TRPC_BASE`, `trpcGet`, `questlog:import-url` ou `net.`
- `electron/preload/index.ts` existe e não contém `questlogImport:` (apenas `questlogImportPython`)
- `src/store/useBuilds.ts` existe e não importa `questlogParser`
- Commits 039bc40 e e7980f6 existem no repositório
- `npm run build` passou com código 0
