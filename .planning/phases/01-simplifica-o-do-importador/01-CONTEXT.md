# Phase 1: Simplificação do Importador — Context

**Gathered:** 2026-04-11
**Status:** Ready for planning
**Source:** discuss-phase session

<domain>
## Phase Boundary

Remover completamente o caminho de importação via tRPC direto (chamada HTTP à API do Questlog). Após esta fase, o único mecanismo de importação por URL é o scraper Python (`questlog_scraper_standalone.py`). O app mantém importação por arquivo JSON (não afetada). Adicionar validação de URL antes de disparar o scraper, feedback de progresso granular e classificação acionável de erros.

Escopo desta fase: `electron/main/index.ts`, `electron/preload/index.ts`, `src/store/useBuilds.ts`, `src/pages/Builds.tsx`.

Fora do escopo desta fase: modelo de dados com `sourceUrl` e `_edited` (Fase 2), tela de preview (Fase 3), timeout configurável e log de erros persistente (Fase 4).

</domain>

<decisions>
## Implementation Decisions

### Remoção do tRPC (IMP-01)
- Remover completamente o handler `questlog:import-url` de `electron/main/index.ts` — incluindo `trpcGet`, `extractSlugAndBuildId`, e a constante `TRPC_BASE`
- Remover `questlogImport` do `dataAPI` em `electron/preload/index.ts`
- Remover `importFromUrl` da store `useBuilds.ts` e da interface `BuildsState`
- Remover declaração `questlogImport` da interface `Window.dataAPI`
- Remover `usePython` state, checkbox e toda lógica condicional de `handleUrlImport` em `Builds.tsx`
- `handleUrlImport` chama diretamente `importFromUrlPython` — sem alternância

### Validação de URL (IMP-02)
- Validação antes de disparar IPC, no renderer (`Builds.tsx`)
- Critério: URL deve começar com `https://questlog.gg/` e conter `character-builder` no pathname
- Feedback: exibir mensagem de erro no status inline imediatamente (sem disparar IPC)
- Claude's Discretion: implementação exata do regex/parse

### Feedback de Progresso (IMP-03)
- **Texto dinâmico inline** — o campo de status existente muda conforme o scraper avança
- Estados progressivos: `"⏳ Iniciando scraper..."` → `"🔍 Extraindo stats..."` → `"✅ {nome} importado"`
- Implementação via IPC events: main emite `questlog:progress` com payload `{ stage: 'starting' | 'extracting' | 'done' }` usando `webContents.send`; renderer escuta via listener no preload
- Claude's Discretion: timing exato de quando emitir cada evento (ex: `starting` logo ao spawnar, `extracting` ao receber primeiros bytes no stdout)

### Classificação de Erros (IMP-04)
- **Mensagem direta por categoria** — sem card expandível, sem detalhe técnico visível ao usuário
- Categorias e mensagens mapeadas:

| Situação | Mensagem exibida |
|----------|-----------------|
| URL não passa validação | `"URL inválida — cole o link completo do Questlog (questlog.gg/...character-builder/...)"` |
| Scraper Python não encontrado | `"Scraper não encontrado — verifique a instalação do throne_and_liberty_agent"` |
| Python não está no PATH | `"Python não encontrado no PATH — verifique a instalação do Python"` |
| Timeout (futuro, Fase 4) | reservado para Fase 4 |
| Parse falhou (JSON inválido) | `"Scraper retornou dados inválidos — tente novamente ou reporte o erro"` |
| Output vazio / código não-zero | `"Scraper encerrou sem dados (código {N}) — verifique o link e tente novamente"` |
| Campos obrigatórios ausentes | `"Build importada com dados incompletos — campos obrigatórios ausentes"` |

- A mensagem técnica raw (stderr, stack trace) vai para `console.error` apenas — nunca exibida ao usuário

### Nota sobre Python/Playwright (IMP-01 / UX)
- **Remover completamente** qualquer texto/nota sobre requisitos de Python ou Playwright da UI
- Python é um requisito de instalação do app, não uma opção — não precisa de aviso
- A ausência do scraper é tratada como erro com mensagem acionável (categoria acima)

### Validação de Schema (IMP-05)
- Output do scraper validado antes de salvar: campos obrigatórios ausentes → erro explícito, sem salvar build corrompida
- Campos obrigatórios mínimos: pelo menos um de `meta.character_name` ou `character_name` (fallback), e `stats` não-vazio
- Claude's Discretion: definição completa dos campos obrigatórios e mecanismo de validação (inline vs. função dedicada)

### Claude's Discretion
- Implementação exata dos IPC progress events (estrutura do payload, nome do canal)
- Timing de quando emitir `extracting` vs. `starting`
- Regex/parse exato para validação de URL
- Quais campos do output do scraper são obrigatórios para schema validation
- Se `parsePythonBuild` continua inline na store ou é movida para `engine/`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lógica de importação (código a remover/modificar)
- `electron/main/index.ts` — IPC handlers: `questlog:import-url` (remover), `questlog:import-python` (manter e evoluir)
- `electron/preload/index.ts` — Bridge `dataAPI`: remover `questlogImport`, manter `questlogImportPython`, adicionar canal de progresso
- `src/store/useBuilds.ts` — Store: remover `importFromUrl`, evoluir `importFromUrlPython`, validação de schema
- `src/pages/Builds.tsx` — UI: remover checkbox `usePython`, simplificar `handleUrlImport`, adicionar validação de URL

### Tipos e estrutura de dados
- `src/engine/types.ts` — `Build`, `BuildStats`, `DEFAULT_STATS` — não modificar nesta fase

### Design system (para qualquer ajuste UI)
- `src/styles/globals.css` — CSS vars e classes `tl-*`

</canonical_refs>

<specifics>
## Specific Ideas

- Status text já existe como `status` state + `showStatus()` em `Builds.tsx` — reutilizar para os estados progressivos (não criar novo componente)
- Os estados de progresso chegam do main process via IPC events — a store não precisa saber dos estados intermediários, apenas o componente `Builds.tsx` atualiza o `status` ao receber cada evento
- O `parsePythonBuild` + `parseNewScraperFormat` + `parseOldFormat` em `useBuilds.ts` permanecem intactos nesta fase

</specifics>

<deferred>
## Deferred Ideas

- Timeout configurável para o scraper → Fase 4 (QUA-01)
- Log de erros persistente em arquivo → Fase 4 (QUA-05)
- Separação formal de stdout/stderr com Zod validation → Fase 4 (QUA-02, QUA-03)
- `sourceUrl` armazenado no modelo de dados → Fase 2 (DAT-01)

</deferred>

---

*Phase: 01-simplifica-o-do-importador*
*Context gathered: 2026-04-11 via discuss-phase*
