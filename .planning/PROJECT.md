# Throne & Liberty — Obsidian Command

## What This Is

App desktop Electron para análise e otimização de personagens do Throne & Liberty. Importa builds via scraper Python a partir de links do Questlog, exibe preview editável antes de salvar, armazena o link de origem para re-importação futura com diff visual. Motor de cálculo de dano puro e determinístico alimenta páginas de análise (Calculator, Comparator, Sensitivity, Dashboard). Scoring de gear com ML (modelo treinado sobre builds do Questlog, inference via subprocess Python), gerador assistido de rotação de skills e parser de combat logs completam a suite de otimização.

## Current Milestone: v2.0 Game Intelligence

**Goal:** Adicionar análise de combate ao vivo, gerador de rotação assistido e scoring de gear com ML — transformando o app de importador de build em ferramenta completa de otimização de personagem.

**Target features:**
- Rotation Builder — banco de skills T&L, seleção interativa, rotação otimizada (`rotation-builder` agent)
- Gear Scorer ML — scraping em massa do Questlog → treinamento de modelo (sklearn/ONNX) → inference via Python subprocess; ciclo de retreinamento a cada update do jogo (`gear-scorer` agent)
- Log Parser — parsing de combat logs, timeline de dano, métricas por skill (`log-parser` agent)
- IPC Security — auditoria e hardening dos handlers IPC (`ipc-security` agent, fase dedicada)

**Key decisions:**
- Gear Scorer usa ML: dados do Questlog → modelo serializado vai a produção → subprocess Python faz inference (mesmo padrão do scraper existente)
- Retreinamento é parte do ciclo de dev: nova versão do jogo = novos dados + possível retreinamento do modelo

## Core Value

Importação de build 100% confiável — extração do scraper deve ser completa e validada, com erros surfaçados claramente na UI, porque todo o restante do app depende de dados corretos.

## Requirements

### Validated

- ✓ Motor de cálculo de dano (`calcAverageDPS`, `calcResult`, `calcSensitivity`, `calcElasticity`) — existente
- ✓ Persistência de builds em JSON local (`AppData/Roaming/throne-liberty/data/builds.json`) — existente
- ✓ 5 páginas de análise: Builds, Calculator, Comparator, Sensitivity, Dashboard — existente
- ✓ Arquitetura IPC segura: main process para I/O, renderer isolado via `window.dataAPI` — existente
- ✓ Scraper Python como mecanismo de importação (`questlog_scraper_standalone.py`) — existente (base a refinar)

### Active

- [ ] REQ-01: Importador unificado exclusivamente via scraper Python — remover caminho tRPC direto
- [ ] REQ-02: Tela de preview pós-importação com edição de nome da build e stats individuais antes de salvar
- [ ] REQ-03: Rastrear edições manuais por campo (metadata `_edited: true` por campo), destacar visualmente no app
- [ ] REQ-04: Armazenar URL de origem por build (`sourceUrl`) no modelo de dados
- [ ] REQ-05: Fluxo de re-importação (update): scrape pelo `sourceUrl` → diff view mostrando o que mudou, campos com edição manual destacados com explicação visual do porquê
- [ ] REQ-06: Qualidade de extração 100% — validação rigorosa do output do scraper, mensagens de erro acionáveis na UI, fallbacks quando campos faltam
- [ ] REQ-07: Aumento global de fonte em todo o app (tabelas, labels, sidebar, inputs)

### Out of Scope

- Importação via tRPC direto (URL sem scraper) — removido em favor do único caminho Python
- Merge silencioso sem diff na re-importação — usuário deve ver explicitamente o que mudou
- Backend remoto / sync na nuvem — app é local-only
- Multi-usuário / contas — fora do escopo

## Context

- Codebase existente: Electron 31 + React 18 + TypeScript + Zustand + Recharts + Tailwind
- Scraper Python já existe como projeto irmão (`throne_and_liberty_agent`) — spawned como child process pelo main Electron
- Dois formatos de output do scraper já tratados: `{meta, attributes, stats}` (novo) e `{stats, character_name}` (legado)
- Edições manuais precisam de metadata no modelo de dados — `BuildStats` atual não tem campos de tracking
- A UI usa design system "data nerd": dark, monospace, paleta purple+cyan — aumentar fonte sem quebrar a estética

## Constraints

- **Tech stack**: Electron + React + TypeScript — sem mudança de stack
- **Local-only**: Sem servidor, sem banco de dados remoto, persistência via JSON no AppData
- **Scraper externo**: O Python scraper não está neste repo — IPC chama o executável via `child_process`
- **Compatibilidade**: Builds salvas no formato atual devem migrar graciosamente para o novo modelo com `sourceUrl` e metadata de edição

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scraper Python como único caminho de importação | Qualidade de extração superior ao tRPC direto; unifica e simplifica o fluxo | — Pending |
| Metadata de edição por campo (`_edited`) no modelo de dados | Permite highlight persistente de campos editados manualmente sem depender de estado de sessão | — Pending |
| Diff visual na re-importação em vez de merge silencioso | Usuário precisa ver explicitamente o que mudou e o que ele havia editado | — Pending |
| `sourceUrl` armazenado por build | Habilita update one-click sem repassar o link | — Pending |

## Evolution

Este documento evolui a cada transição de fase e milestone.

**Após cada transição de fase** (via `/gsd-transition`):
1. Requirements invalidados? → Mover para Out of Scope com motivo
2. Requirements validados? → Mover para Validated com referência de fase
3. Novos requirements emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se derivou

**Após cada milestone** (via `/gsd-complete-milestone`):
1. Revisão completa de todas as seções
2. Core Value check — ainda é a prioridade certa?
3. Auditoria de Out of Scope — motivos ainda válidos?
4. Atualizar Context com estado atual

---
*Last updated: 2026-04-17 — Milestone v2.0 iniciado*
