---
phase: 01-simplifica-o-do-importador
plan: 02
subsystem: electron-ipc, react-ui
tags: [progress-events, url-validation, ui-cleanup, ipc, security]
dependency_graph:
  requires: [01-01-PLAN.md]
  provides: [handler-com-progresso, validacao-url-questlog, ui-sem-checkbox-python]
  affects: [electron/main/index.ts, electron/preload/index.ts, src/store/useBuilds.ts, src/pages/Builds.tsx]
tech_stack:
  added: []
  patterns: [ipc-push-events, useEffect-listener-cleanup, url-validation-inline]
key_files:
  modified:
    - electron/main/index.ts
    - electron/preload/index.ts
    - src/store/useBuilds.ts
    - src/pages/Builds.tsx
decisions:
  - "Evento questlog:progress emitido por sender guardado antes do spawn — evita crash se janela fechar durante scraping"
  - "isValidQuestlogUrl usa new URL() nativo — sem dependência extra, validação antes do IPC"
  - "useEffect com cleanup offProgress garante que apenas um listener ativo por vez"
  - "Mensagens de erro do handler sem stderr raw — apenas console.error para debug"
metrics:
  duration: "~10 minutos"
  completed: "2026-04-12"
  tasks_completed: 2
  files_modified: 4
---

# Phase 01 Plan 02: UI Simplificada e Progresso do Scraper Summary

**One-liner:** Handler Python instrumentado com eventos de progresso IPC (starting/extracting), validação de URL Questlog inline no renderer, e UI limpa sem checkbox usePython nem nota de rodapé sobre Python/Playwright.

## O Que Foi Feito

### Tarefa 1 — electron/main/index.ts + electron/preload/index.ts + src/store/useBuilds.ts (commit d1ccf01)

**electron/main/index.ts:**
- Handler `questlog:import-python` reescrito com eventos de progresso
- `_event.sender` guardado em `sender` antes de qualquer operação assíncrona
- `emitProgress('starting')` chamado imediatamente antes do `spawn`
- `emitProgress('extracting')` emitido no primeiro chunk de stdout via flag `extractingEmitted`
- `sender.isDestroyed()` verificado antes de cada `sender.send()`
- Mensagens de erro categorizadas por tipo (scraper não encontrado, Python não no PATH, dados inválidos, código de saída != 0) — stderr apenas para `console.error`

**electron/preload/index.ts:**
- Adicionados `onProgress` e `offProgress` ao objeto `dataAPI`
- `onProgress` registra listener em `ipcRenderer.on('questlog:progress', ...)`
- `offProgress` chama `ipcRenderer.removeAllListeners('questlog:progress')`

**src/store/useBuilds.ts:**
- Interface `Window.dataAPI` ampliada com `onProgress` e `offProgress` tipados

### Tarefa 2 — src/pages/Builds.tsx (commit d2b527a)

- Adicionado `useEffect` ao import do React
- Removido `importFromUrl` do destructuring do `useBuilds()`
- Removido estado `usePython` / `setUsePython`
- Adicionada função `isValidQuestlogUrl(raw)` usando `new URL()` — valida hostname `questlog.gg` e pathname com `character-builder`
- `handleUrlImport` refatorado: valida URL antes de disparar IPC, chama `importFromUrlPython` diretamente sem bifurcação condicional
- `useEffect` registra `window.dataAPI.onProgress` com mensagens progressivas ("⏳ Iniciando scraper..." / "🔍 Extraindo stats...") e cleanup via `offProgress`
- Removido bloco JSX do checkbox "Scraper Python (Playwright — stats completos)"
- Removido bloco JSX condicional da nota de rodapé sobre Python/Playwright
- Header do painel simplificado: `justifyContent: 'space-between'` removido, apenas `tl-eyebrow` sem wrapper flex desnecessário

## Fluxo de Progresso Implementado

```
Usuário cola URL → isValidQuestlogUrl() →
  [URL inválida] → showStatus(erro, true) — sem IPC
  [URL válida]   → setUrlLoading(true) →
                   importFromUrlPython(url) →
                     main emite questlog:progress { stage: 'starting' }
                       → renderer: "⏳ Iniciando scraper..."
                     spawn Python + aguarda stdout
                     main emite questlog:progress { stage: 'extracting' } (primeiro chunk)
                       → renderer: "🔍 Extraindo stats..."
                     proc.close → resolve(JSON) →
                   setUrlLoading(false) →
                   showStatus("✅ [nome] importado", false)
```

## Verificação Final

| Padrão verificado | Resultado |
|---|---|
| `usePython\|setUsePython` em `src/pages/Builds.tsx` | VAZIO |
| `importFromUrl[^P]` em `src/pages/Builds.tsx` | VAZIO |
| `isValidQuestlogUrl` em `src/pages/Builds.tsx` | ENCONTRADO (linhas 144, 189) |
| `questlog:progress` em `electron/main/index.ts` | ENCONTRADO (linha 127) |
| `onProgress\|offProgress` em `electron/preload/index.ts` | ENCONTRADO (linhas 12, 15) |

`npm run build` retornou código 0 sem erros TypeScript em ambas as tarefas.

## Commits

| Task | Commit | Descrição |
|---|---|---|
| Tarefa 1 | d1ccf01 | feat(01-02): instrumentar handler Python com eventos de progresso |
| Tarefa 2 | d2b527a | feat(01-02): simplificar Builds.tsx — remover usePython, adicionar validação e listener de progresso |

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito.

## Known Stubs

Nenhum. As modificações introduzem funcionalidades completas e operacionais.

## Threat Flags

Nenhum. As mitigações do threat model foram todas implementadas:

| Threat ID | Mitigação | Status |
|---|---|---|
| T-01-02-01 | URL como argumento posicional no spawn — sem interpolação shell | Implementado |
| T-01-02-02 | `isValidQuestlogUrl()` valida antes do IPC | Implementado |
| T-01-02-03 | stderr apenas em `console.error`, usuário vê mensagem categorizada | Implementado |
| T-01-02-04 | `offProgress()` no cleanup do useEffect | Implementado |
| T-01-02-05 | `sender` guardado pré-spawn, `isDestroyed()` verificado antes de send | Implementado |

## Self-Check: PASSED

- `electron/main/index.ts` contém `emitProgress('starting')` e `sender.isDestroyed()`
- `electron/preload/index.ts` contém `onProgress` e `offProgress`
- `src/store/useBuilds.ts` declara `onProgress` e `offProgress` na interface `Window.dataAPI`
- `src/pages/Builds.tsx` contém `isValidQuestlogUrl`, `useEffect` com listener, `handleUrlImport` sem `usePython`
- Commits d1ccf01 e d2b527a existem no repositório
- `npm run build` passou com código 0
