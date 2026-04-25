# Roadmap: Throne & Liberty — Obsidian Command

## Overview

Partindo de uma base Electron funcional com motor de cálculo e importação via scraper Python, este roadmap endurece o pipeline de importação, adiciona modelo de dados com rastreamento de edições, entrega uma tela de preview editável antes de salvar, reforça a qualidade de extração do scraper, e finaliza com fluxo completo de re-importação (diff visual). A fonte global é corrigida como etapa independente. Cada fase entrega uma capacidade verificável por um humano usando o app.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Simplificação do Importador** - Importador unificado exclusivamente via scraper Python, sem caminho tRPC
- [x] **Phase 2: Modelo de Dados Estendido** - Build armazena `sourceUrl` e metadata `_edited` por campo, com migração graciosa
- [x] **Phase 3: Preview & Edição Pré-save** - Tela de preview com dados extraídos, nome e stats editáveis antes de salvar
- [x] **Phase 4: Qualidade de Extração** - Timeout configurável, separação stdout/stderr, validação dual-format, log persistente
- [x] **Phase 5: Trigger de Re-importação** - Botão "Atualizar build" para builds com `sourceUrl`, re-executa scraper com URL armazenada
- [x] **Phase 6: Diff Visual no Update** - Tela de diff com aceitar/rejeitar por campo, campos `_edited` destacados com explicação
- [x] **Phase 7: Fonte Global de UI** - Base 16px, tabelas nunca abaixo de 14px, hierarquia tipográfica preservada

---

## Milestone: v2.0 Game Intelligence

**Goal:** Transformar o app de importador de build em ferramenta completa de otimização de personagem — análise de logs, gerador de rotação com dados reais de skills, scoring de gear com ML e pipeline de dados sustentável.

### v2.0 Phase Checklist

- [ ] **Phase 8: IPC Security** - Hardening de todos os handlers IPC com validação Zod, URL check antes de subprocess e sanitização de paths
- [ ] **Phase 9: Skill Importer** - Script standalone produz `skillsDB.json` carregado em runtime, substituindo o TypeScript hardcoded
- [ ] **Phase 10: Log Parser Split View** - Usuário abre dois logs simultaneamente e compara DPS e métricas lado a lado
- [ ] **Phase 11: Build Specialization Data** - Scraper captura maestrias do Questlog; Build persiste specialization, weaponMain e weaponOff
- [ ] **Phase 12: Gear Scorer UI** - Página GearScorer com ranking por slot usando o engine `rankItemUpgrades` existente
- [ ] **Phase 13: Gear Scorer ML** - Pipeline sklearn → ONNX, inference via subprocess Python, ciclo de retreinamento documentado

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
**Plans**: 3 planos

Plans:
- [x] 01-01-PLAN.md — Remover bloco tRPC do main, preload e store (IMP-01)
- [x] 01-02-PLAN.md — Validação de URL no renderer + eventos de progresso IPC (IMP-02, IMP-03)
- [x] 01-03-PLAN.md — Classificação de erros no handler + validateScraperOutput na store (IMP-04, IMP-05)
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

---

### Phase 8: IPC Security
**Goal**: Todos os handlers IPC existentes e futuros validam entradas com Zod, URLs de subprocess são verificadas no main process e respostas de erro nunca vazam dados internos para o renderer
**Depends on**: Nothing (v2.0 first phase — hardening de código existente)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Passar uma URL que não comece com `https://questlog.gg/` ao handler de importação retorna erro imediato sem spawnar nenhum processo Python
  2. Uma tentativa de path traversal (ex: `../../etc/passwd`) em qualquer handler de file I/O é rejeitada com erro — nenhum arquivo fora de `AppData/Roaming/throne-liberty/` é lido ou escrito
  3. Enviar um payload malformado ao handler `data:write` (ex: objeto arbitrário em vez de array de builds) retorna erro de validação sem gravar nada em disco
  4. Forçar um erro em qualquer handler IPC produz uma resposta de erro genérica no renderer — nenhum stack trace, nenhum caminho de filesystem, nenhum detalhe interno é exposto
**Plans**: TBD
**UI hint**: no

### Phase 9: Skill Importer
**Goal**: Um script standalone scrapa fontes web, produz `skillsDB.json` com metadados completos por skill, e o app carrega esse arquivo em runtime como fonte de verdade — eliminando o TypeScript hardcoded
**Depends on**: Phase 8 (novos handlers devem nascer já seguindo os padrões de segurança estabelecidos)
**Requirements**: SKI-01, SKI-02, SKI-03, SKI-04
**Success Criteria** (what must be TRUE):
  1. Rodar o script standalone produz um `skillsDB.json` com nome, arma, categoria, cooldown, damage% e hits para cada skill — sem intervenção manual
  2. O app carrega `skillsDB.json` do userData em runtime; se o arquivo não existe, usa o bundle compilado como fallback sem erro
  3. Quando o script detecta dados divergentes para a mesma skill em fontes diferentes, ele reporta o conflito com skill ID, fontes e valores em conflito — sem resolver silenciosamente
  4. Rodar o script uma segunda vez sem mudanças nas fontes completa em menos tempo que o run inicial — apenas skills novas ou modificadas são reprocessadas
**Plans**: TBD

### Phase 10: Log Parser Split View
**Goal**: O usuário pode abrir dois combat logs simultaneamente e comparar DPS, timeline de dano e métricas por skill lado a lado na mesma tela
**Depends on**: Nothing (v2.0, self-contained — Log Parser base já existe)
**Requirements**: LOG-01
**Success Criteria** (what must be TRUE):
  1. A página de Log Reader exibe dois painéis independentes, cada um com seu próprio seletor de arquivo de log
  2. Com dois logs carregados, o usuário vê DPS total de cada log exibido simultaneamente na mesma tela
  3. As métricas por skill (dano, hits, DPS) de ambos os logs são exibidas lado a lado, permitindo comparação visual imediata
  4. Carregar um log em apenas um dos painéis não causa erro — o painel vazio permanece inativo sem quebrar a UI
**Plans**: TBD
**UI hint**: yes

### Phase 11: Build Specialization Data
**Goal**: O scraper Python captura o JSON de especialização (maestrias) do Questlog Build Editor; o tipo Build persiste specialization, weaponMain e weaponOff para consumo pela Phase 12 (Rotation Builder)
**Depends on**: Nothing (infraestrutura de dados — pode rodar em paralelo com Phase 9/10)
**Requirements**: ROT-01
**Success Criteria** (what must be TRUE):
  1. Ao re-importar uma build com URL que tem maestrias configuradas, builds.json contém specialization: [{id: ..., lvl: N}, ...], weaponMain e weaponOff
  2. Builds antigas (sem maestrias) carregam sem quebrar — campos ausentes chegam como undefined
  3. O scraper retorna normalmente sem specialization quando o botão de export não está disponível — nunca retorna erro por causa do export
**Plans**: 2 planos

Plans:
- [ ] 11-01-PLAN.md — Estender interface Build em types.ts + extrair campos em parseNewScraperFormat() (TypeScript)
- [ ] 11-02-PLAN.md — Implementar _try_export_specialization() e integrar em scrape() (Python Playwright)
**UI hint**: no

### Phase 12: Gear Scorer UI
**Goal**: O app tem uma página GearScorer funcional que exibe recomendações de upgrade organizadas por slot usando o engine determinístico `rankItemUpgrades` já implementado
**Depends on**: Phase 8 (handler `gearscore:infer` deve nascer com validação Zod)
**Requirements**: GS-01, GS-02
**Success Criteria** (what must be TRUE):
  1. Há uma página GearScorer acessível pela navegação do app que aceita uma build ativa e lista de itens candidatos como entrada
  2. A página exibe itens candidatos ordenados por DPS delta (maior ganho primeiro) usando o engine `rankItemUpgrades`
  3. As recomendações são agrupadas por slot (head, chest, hands, legs, feet, acessórios, armas) — o usuário pode filtrar por slot específico
  4. Quando nenhum modelo ML está disponível, um banner visível informa "Usando scorer determinístico" — sem crash, sem tela em branco
**Plans**: TBD
**UI hint**: yes

### Phase 13: Gear Scorer ML
**Goal**: Um pipeline completo de dados → treino → inference está operacional: script coleta builds do Questlog, produz artefato ONNX versionado, app spawna subprocess Python para inference e ciclo de retreinamento está documentado para cada patch do jogo
**Depends on**: Phase 12 (UI e interface IPC estabelecidos), Phase 8 (handler de inference deve seguir padrões de segurança)
**Requirements**: ML-01, ML-02, ML-03, ML-04
**Success Criteria** (what must be TRUE):
  1. Rodar o script de coleta produz um corpus de builds públicas do Questlog com patch ID registrado por lote — sem dados de treino misturados entre versões do jogo
  2. Rodar o script de treino sobre o corpus produz um arquivo `.onnx` versionado (ex: `gear_v1.3.2.onnx`) com menos de 10 MB que pode ser carregado pelo runtime ONNX
  3. A página GearScorer com modelo disponível exibe scores vindos do subprocess Python — o app spawna o processo, envia build via stdin JSON e recebe scores via stdout JSON dentro de 30 segundos
  4. O documento de retreinamento descreve os passos exatos: coletar dados → treinar → exportar ONNX → substituir artefato — executável por um dev sem conhecimento prévio do pipeline
**Plans**: TBD

## Progress

### v1.0 — Importador Confiável

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7
(Phase 4 depends only on Phase 1; Phase 7 is independent — pode ser paralelizado)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Simplificação do Importador | 3/3 | Complete | 2026-04-15 |
| 2. Modelo de Dados Estendido | 3/3 | Complete | 2026-04-15 |
| 3. Preview & Edição Pré-save | 3/3 | Complete | 2026-04-15 |
| 4. Qualidade de Extração | 3/3 | Complete | 2026-04-15 |
| 5. Trigger de Re-importação | 2/2 | Complete | 2026-04-15 |
| 6. Diff Visual no Update | 3/3 | Complete | 2026-04-15 |
| 7. Fonte Global de UI | 2/2 | Complete | 2026-04-15 |

### v2.0 — Game Intelligence

**Execution Order:**
8 → 9 → 11 (Phase 9 must precede 11; Phase 10 is independent; Phase 12 must precede 13)
Phase 10 can run in parallel with 9 or 11.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. IPC Security | 0/TBD | Not started | - |
| 9. Skill Importer | 0/TBD | Not started | - |
| 10. Log Parser Split View | 0/TBD | Not started | - |
| 11. Build Specialization Data | 0/2 | Not started | - |
| 12. Gear Scorer UI | 0/TBD | Not started | - |
| 13. Gear Scorer ML | 0/TBD | Not started | - |
