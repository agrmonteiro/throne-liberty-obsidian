---
phase: 01-simplifica-o-do-importador
plan: 03
subsystem: store
tags: [validation, schema-guard, security, scraper-output]
dependency_graph:
  requires: [01-01-PLAN.md, 01-02-PLAN.md]
  provides: [validateScraperOutput, schema-guard-antes-de-parsePythonBuild]
  affects: [src/store/useBuilds.ts]
tech_stack:
  added: []
  patterns: [input-boundary-validation, fail-fast-before-parse]
key_files:
  modified:
    - src/store/useBuilds.ts
decisions:
  - "validateScraperOutput posicionada ANTES de parsePythonBuild — falha rápida na fronteira de entrada, nunca chega ao parser com dados incompletos"
  - "Mensagem de erro unificada 'Build importada com dados incompletos — campos obrigatórios ausentes' para todos os casos de validação falha"
  - "Fallback após parsePythonBuild retornar null usa categoria IMP-04 — sem detalhes técnicos expostos ao usuário"
metrics:
  duration: "~5 minutos"
  completed: "2026-04-12"
  tasks_completed: 1
  files_modified: 1
---

# Phase 01 Plan 03: Validação de Schema do Scraper Summary

**One-liner:** Função `validateScraperOutput` inserida na fronteira de entrada da store — rejeita output do scraper sem `stats` ou sem identifier antes de qualquer parse ou save, com mensagem de erro categorizada.

## O Que Foi Feito

### Tarefa 1 — src/store/useBuilds.ts (commit 10a32a2)

**Função `validateScraperOutput` adicionada antes de `parsePythonBuild`:**

Valida dois vetores obrigatórios antes de permitir que o output avance para parse ou save:

1. **stats presente e não-vazio** — `obj.stats` deve ser um objeto com pelo menos uma chave. Stats ausente, null, array, ou objeto vazio (`{}`) são rejeitados.

2. **Identifier presente** (por formato):
   - Formato novo (`obj.meta != null`): precisa de `meta.character_name` ou `meta.slug`
   - Formato antigo: precisa de `character_name` ou `folder_name` no nível raiz

Qualquer falha retorna a string `'Build importada com dados incompletos — campos obrigatórios ausentes'`.

**`importFromUrlPython` atualizado:**

```
raw → typeof check → obj.error check
  → validateScraperOutput(obj)   ← NOVO (linha 143)
      [erro] → return { error: validationError }
  → parsePythonBuild(obj)        ← linha 146
      [null] → return { error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' }
  → saveBuild + setActive → return build
```

A mensagem de fallback do `parsePythonBuild` retornando null foi atualizada de "Não foi possível parsear o resultado do scraper." para a categoria IMP-04 sem detalhes técnicos.

## Casos de Validação Cobertos

| Caso | Input | Resultado |
|------|-------|-----------|
| Stats ausente | `{ meta: {...} }` sem `stats` | Erro: campos obrigatórios ausentes |
| Stats vazio | `{ stats: {}, meta: {...} }` | Erro: campos obrigatórios ausentes |
| Stats é array | `{ stats: [], ... }` | Erro: campos obrigatórios ausentes |
| Formato novo sem identifier | `{ stats: {...}, meta: {} }` | Erro: campos obrigatórios ausentes |
| Formato antigo sem identifier | `{ stats: {...} }` sem character_name/folder_name | Erro: campos obrigatórios ausentes |
| Formato novo válido | `{ stats: {"CP": "5467"}, meta: { character_name: "X" } }` | null (pass) |
| Formato antigo válido | `{ stats: {...}, character_name: "X" }` | null (pass) |

## Verificação Final

| Verificação | Resultado |
|---|---|
| `validateScraperOutput` definida em useBuilds.ts (linha 183) | ENCONTRADO |
| Chamada em importFromUrlPython (linha 143) ANTES de parsePythonBuild (linha 146) | CONFIRMADO |
| `parseNewScraperFormat` e `parseOldFormat` intactos (grep -c retorna 4) | CONFIRMADO |
| `npm run build` código de saída 0 | PASSOU |

## Commits

| Task | Commit | Descrição |
|---|---|---|
| Tarefa 1 | 10a32a2 | feat(01-03): implementar validateScraperOutput e integrar em importFromUrlPython |

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito.

## Known Stubs

Nenhum. A validação é completa e operacional.

## Threat Flags

Nenhum. As mitigações do threat model foram implementadas:

| Threat ID | Mitigação | Status |
|---|---|---|
| T-01-03-01 | `validateScraperOutput` rejeita output sem `stats` ou sem identifier antes de `parsePythonBuild` | Implementado |
| T-01-03-02 | `Object.keys(stats).length > 0` — stats vazio rejeitado | Implementado |
| T-01-03-03 | Fallback após validação usa IMP-04 — sem detalhes técnicos do parser | Implementado |
| T-01-03-04 | `obj.error` do scraper aceito como está (aceito — risco baixo, fonte local controlada) | Aceito |

## Checkpoint Pendente

O plano 01-03 inclui um `checkpoint:human-verify` para verificação manual dos 5 success criteria da Fase 1 completa. O checkpoint deve ser verificado pelo usuário com `npm run dev`.

**5 Success Criteria da Fase 1:**
1. UI sem checkbox tRPC ou nota sobre Python/Playwright (implementado em 01-01 + 01-02)
2. URL malformada → erro inline sem disparar IPC (implementado em 01-02)
3. Durante scraping: estados visíveis iniciando → extraindo → concluído (implementado em 01-02)
4. Erros categorizados com causa identificável — não mensagem técnica raw (implementado em 01-02)
5. Output sem campos obrigatórios rejeitado explicitamente — build nunca salva com dados incompletos (implementado neste plano 01-03)

## Self-Check: PASSED

- `src/store/useBuilds.ts` existe e contém `validateScraperOutput` (linha 183)
- Chamada em `importFromUrlPython` na linha 143, antes de `parsePythonBuild` na linha 146
- `parseNewScraperFormat` e `parseOldFormat` intactos (grep -c retorna 4)
- Commit 10a32a2 existe no repositório
- `npm run build` passou com código 0
