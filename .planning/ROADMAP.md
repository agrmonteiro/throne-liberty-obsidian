# Roadmap: Throne & Liberty — Obsidian Command

## Overview

Partindo de uma base Electron funcional com motor de cálculo e importação via scraper Python, este roadmap endurece o pipeline de importação, adiciona modelo de dados com rastreamento de edições, entrega uma tela de preview editável antes de salvar, reforça a qualidade de extração do scraper, e finaliza com fluxo completo de re-importação (diff visual). A fonte global é corrigida como etapa independente. Cada fase entrega uma capacidade verificável por um humano usando o app.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Simplificação do Importador** - Importador unificado exclusivamente via scraper Python, sem caminho tRPC
- [ ] **Phase 2: Modelo de Dados Estendido** - Build armazena `sourceUrl` e metadata `_edited` por campo, com migração graciosa
- [ ] **Phase 3: Preview & Edição Pré-save** - Tela de preview com dados extraídos, nome e stats editáveis antes de salvar
- [ ] **Phase 4: Qualidade de Extração** - Timeout configurável, separação stdout/stderr, validação dual-format, log persistente
- [ ] **Phase 5: Trigger de Re-importação** - Botão "Atualizar build" para builds com `sourceUrl`, re-executa scraper com URL armazenada
- [ ] **Phase 6: Diff Visual no Update** - Tela de diff com aceitar/rejeitar por campo, campos `_edited` destacados com explicação
- [ ] **Phase 7: Fonte Global de UI** - Base 16px, tabelas nunca abaixo de 14px, hierarquia tipográfica preservada

## Phase Details

### Phase 1: Simplificação do Importador
**Goal**: Importador aceita apenas scraper Python — tRPC direto removido da UI e do código, com validação de URL e feedback de progresso
**Depends on**: Nothing (first phase)
**Requirements**: IMP-01, IMP-02, IMP-03, IMP-04, IMP-05
**Success Criteria** (what must be TRUE):
  1. A UI não exibe nenhum checkbox ou opção para importar via tRPC direto — somente scraper Python
  2. Ao colar uma URL malformada, o campo exibe erro imediato antes de disparar qualquer processo
  3. Durante a execução do scraper, o usuário vê estados de progresso: iniciando → extraindo → concluído (ou erro)
  4. Quando o scraper falha, a mensagem exibida identifica a causa (URL inválida, scraper não encontrado, timeout, parse falhou)
  5. Builds com output inválido do scraper são rejeitadas com erro explícito — nunca salvas silenciosamente com dados corrompidos
**Plans**: TBD

Plans:
- [ ] 01-01: Remover código tRPC do main process (handler IPC `questlog:import-url`) e da store
- [ ] 01-02: Validação de URL no renderer antes de disparar IPC + feedback de progresso via eventos IPC
- [ ] 01-03: Classificação de erros do scraper em categorias acionáveis + validação de schema no output
**UI hint**: yes

### Phase 2: Modelo de Dados Estendido
**Goal**: O tipo `Build` suporta `sourceUrl` e metadata `_edited` por campo; builds existentes carregam sem quebrar
**Depends on**: Phase 1
**Requirements**: DAT-01, DAT-02, DAT-03
**Success Criteria** (what must be TRUE):
  1. Builds importadas com URL armazenam a URL de origem visível nos dados persistidos em `builds.json`
  2. Cada campo editável de `BuildStats` pode carregar `_edited: true` sem erro de tipo no TypeScript
  3. O app inicia sem crash com um `builds.json` antigo que não tem `sourceUrl` nem metadata de edição
  4. Builds migradas silenciosamente recebem valores padrão (`sourceUrl: null`, sem campos `_edited`) sem intervenção manual
**Plans**: TBD

Plans:
- [ ] 02-01: Estender `Build` e `BuildStats` em `types.ts` com `sourceUrl` e estrutura `_edited` por campo
- [ ] 02-02: Migração graciosa no carregamento: `readBuilds()` normaliza builds antigas para o novo schema
- [ ] 02-03: Atualizar parsers (`parsePythonBuild`) para popular `sourceUrl` a partir da URL passada

### Phase 3: Preview & Edição Pré-save
**Goal**: Após importação bem-sucedida, usuário vê e pode editar os dados extraídos antes de confirmar o salvamento
**Depends on**: Phase 2
**Requirements**: PRV-01, PRV-02, PRV-03, PRV-04, PRV-05, PRV-06
**Success Criteria** (what must be TRUE):
  1. Após scraper terminar com sucesso, uma tela de preview exibe todos os campos extraídos antes de qualquer escrita em disco
  2. O usuário pode editar o nome da build no preview e o nome salvo reflete a edição
  3. O usuário pode alterar qualquer stat numérico no preview; o valor salvo reflete a edição
  4. Campos alterados manualmente exibem destaque visual permanente (badge/ícone/cor diferente) em toda a aplicação
  5. Hover em campo destacado exibe tooltip "valor editado manualmente"
  6. Clicar "Cancelar" no preview descarta tudo — nenhuma build é salva e nenhum dado é escrito em disco
**Plans**: TBD

Plans:
- [ ] 03-01: Componente `ImportPreview` com formulário de edição de nome e stats
- [ ] 03-02: Integração do preview no fluxo de importação: store retém dados do scraper antes de salvar
- [ ] 03-03: Metadata `_edited` gravada ao salvar campos alterados + indicador visual em toda a UI
**UI hint**: yes

### Phase 4: Qualidade de Extração
**Goal**: O pipeline scraper→renderer é robusto: timeout mata processos travados, stdout/stderr são separados, ambos os formatos validados, erros persistem em log
**Depends on**: Phase 1
**Requirements**: QUA-01, QUA-02, QUA-03, QUA-04, QUA-05
**Success Criteria** (what must be TRUE):
  1. Um scraper que trava por mais de N segundos é encerrado automaticamente e o usuário recebe mensagem "Timeout"
  2. Linhas de debug Python no stderr nunca aparecem no JSON parseado — stdout e stderr são coletados separadamente
  3. O app aceita corretamente tanto o formato novo `{meta, attributes, stats}` quanto o legado `{stats, character_name}` sem erro
  4. Um campo numérico extraído como string não-numérica gera aviso visível no preview, mas não bloqueia o salvamento
  5. Após qualquer falha de importação, o erro fica registrado em arquivo local de log — não desaparece com o toast
**Plans**: TBD

Plans:
- [ ] 04-01: Timeout configurável no `child_process.spawn` + kill ao expirar + separação correta de stdout/stderr
- [ ] 04-02: Validação Zod (ou equivalente) para ambos os formatos do scraper + avisos de campo numérico no preview
- [ ] 04-03: Log de erro estruturado persistente em `AppData/Roaming/throne-liberty/data/import-errors.json`

### Phase 5: Trigger de Re-importação
**Goal**: Builds com `sourceUrl` expõem botão "Atualizar build" que re-executa o scraper sem pedir URL novamente
**Depends on**: Phase 2
**Requirements**: UPD-01, UPD-02
**Success Criteria** (what must be TRUE):
  1. Builds importadas com URL exibem botão "Atualizar build" na listagem ou página de detalhes
  2. Builds sem `sourceUrl` (importadas por arquivo ou criadas manualmente) não exibem o botão
  3. Clicar "Atualizar build" dispara o scraper com a URL armazenada — sem caixa de diálogo pedindo URL
  4. O progresso do re-scrape usa o mesmo feedback visual da importação original
**Plans**: TBD

Plans:
- [ ] 05-01: Botão "Atualizar build" condicional no `BuildCard` / página de detalhes
- [ ] 05-02: Action `updateBuild(buildId)` na store que lê `sourceUrl` e invoca `questlogImportPython`
**UI hint**: yes

### Phase 6: Diff Visual no Update
**Goal**: Após re-scrape, usuário vê exatamente o que mudou e pode aceitar ou rejeitar cada mudança individualmente antes de confirmar
**Depends on**: Phase 5
**Requirements**: UPD-03, UPD-04, UPD-05, UPD-06
**Success Criteria** (what must be TRUE):
  1. Após re-scrape bem-sucedido, uma tela de diff exibe lado a lado: valor atual vs. valor novo para cada campo alterado
  2. Campos com `_edited: true` são destacados no diff com aviso "Você editou este campo manualmente"
  3. O usuário pode aceitar ou rejeitar cada mudança individualmente com controles por linha
  4. Campos aceitos do scraper perdem o `_edited`; campos rejeitados mantêm `_edited` e conservam o valor editado
  5. Confirmar sem aceitar nenhuma mudança fecha o diff sem alterar a build
**Plans**: TBD

Plans:
- [ ] 06-01: Componente `UpdateDiff` com comparação campo-a-campo e estado de aceitar/rejeitar por campo
- [ ] 06-02: Lógica de merge na store: aplica apenas campos aceitos, preserva `_edited` em rejeitados
- [ ] 06-03: Integração do diff no fluxo de update (substituindo salvamento direto)
**UI hint**: yes

### Phase 7: Fonte Global de UI
**Goal**: Toda a tipografia do app usa base 16px; tabelas nunca ficam abaixo de 14px; hierarquia visual é preservada
**Depends on**: Nothing (can execute independently)
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. O texto base da aplicação (parágrafos, labels, inputs) renderiza em 16px ou equivalente Tailwind `text-base`
  2. Valores em tabelas de stats são legíveis em monitores 1080p — nenhum valor menor que 14px
  3. Headers, labels e valores continuam visualmente distintos após o aumento (hierarquia não achatada)
**Plans**: TBD

Plans:
- [ ] 07-01: Atualizar `globals.css` e `tailwind.config.js` com base 16px e escala tipográfica consistente
- [ ] 07-02: Auditar e corrigir todos os componentes de tabela para garantir mínimo de 14px em valores
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7
(Phase 4 depends only on Phase 1; Phase 7 is independent — pode ser paralelizado)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Simplificação do Importador | 0/3 | Not started | - |
| 2. Modelo de Dados Estendido | 0/3 | Not started | - |
| 3. Preview & Edição Pré-save | 0/3 | Not started | - |
| 4. Qualidade de Extração | 0/3 | Not started | - |
| 5. Trigger de Re-importação | 0/2 | Not started | - |
| 6. Diff Visual no Update | 0/3 | Not started | - |
| 7. Fonte Global de UI | 0/2 | Not started | - |
