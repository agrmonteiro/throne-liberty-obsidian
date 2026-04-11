# Requirements: Throne & Liberty — Obsidian Command

**Defined:** 2026-04-11
**Core Value:** Importação de build 100% confiável — extração do scraper deve ser completa e validada, com erros surfaçados claramente na UI, porque todo o restante do app depende de dados corretos.

## v1 Requirements

### Importador

- [ ] **IMP-01**: Importador aceita apenas scraper Python — caminho tRPC direto é removido da UI e do código
- [ ] **IMP-02**: Campo de URL da build do Questlog com validação de formato antes de disparar scraper
- [ ] **IMP-03**: Feedback de progresso durante execução do scraper (estado: iniciando → extraindo → concluído / erro)
- [ ] **IMP-04**: Erros do scraper são capturados, classificados e exibidos com mensagem acionável (ex: "URL inválida", "Scraper não encontrado", "Timeout", "Parse falhou em campo X")
- [ ] **IMP-05**: Output do scraper é validado contra schema esperado antes de qualquer processamento — campos obrigatórios ausentes geram erro explícito

### Preview & Edição

- [ ] **PRV-01**: Após importação bem-sucedida, exibe tela de preview com todos os dados extraídos antes de salvar
- [ ] **PRV-02**: Campo de nome da build editável no preview (pré-preenchido com nome extraído do scraper)
- [ ] **PRV-03**: Stats individuais editáveis no preview — cada campo numérico pode ser corrigido manualmente
- [ ] **PRV-04**: Campos editados manualmente são marcados com metadata (`_edited: true`) persistida junto com a build
- [ ] **PRV-05**: Campos com `_edited: true` são destacados visualmente de forma permanente no app (badge, cor, ícone) com tooltip explicando "valor editado manualmente"
- [ ] **PRV-06**: Botões "Salvar" e "Cancelar" no preview — cancelar descarta sem salvar

### Modelo de Dados

- [ ] **DAT-01**: Build armazena `sourceUrl` (URL usada na importação)
- [ ] **DAT-02**: Cada campo editável da build suporta metadata `_edited: boolean` no modelo de dados
- [ ] **DAT-03**: Builds existentes sem `sourceUrl` e sem metadata de edição migram graciosamente (campos ausentes = valores padrão sem quebrar)

### Re-importação (Update)

- [ ] **UPD-01**: Builds com `sourceUrl` exibem botão "Atualizar build" na listagem e/ou na página de detalhes
- [ ] **UPD-02**: "Atualizar build" executa scraper com o `sourceUrl` armazenado — sem precisar colar URL novamente
- [ ] **UPD-03**: Após re-scrape, exibe tela de diff mostrando: valor atual vs. valor novo para cada campo que mudou
- [ ] **UPD-04**: No diff, campos com `_edited: true` são destacados com explicação visual: "Você editou este campo manualmente — o scraper trouxe um valor diferente"
- [ ] **UPD-05**: Usuário pode aceitar ou rejeitar mudanças individualmente no diff antes de confirmar update
- [ ] **UPD-06**: Após confirmar, campos aceitos do scraper perdem o `_edited`, campos rejeitados mantêm `_edited`

### Qualidade de Extração

- [ ] **QUA-01**: Scraper é invocado com timeout configurável — processo morto após limite e erro exibido
- [ ] **QUA-02**: Stdout e stderr do scraper são separados corretamente — debug lines do Python não contaminam o JSON parseado
- [ ] **QUA-03**: Ambos os formatos de output do scraper são validados (`{meta, attributes, stats}` novo e `{stats, character_name}` legado)
- [ ] **QUA-04**: Campos numéricos extraídos são validados como número — strings não numéricas geram aviso no preview (não bloqueiam, mas alertam)
- [ ] **QUA-05**: Log de erro estruturado persiste localmente para diagnóstico (não só toast efêmero)

### UI / Apresentação

- [ ] **UI-01**: Tamanho de fonte global aumentado — base de `14px` → `16px` (ou equivalente em Tailwind: `text-sm` → `text-base` como padrão)
- [ ] **UI-02**: Tabelas de stats com fonte legível em todos os monitores (nunca abaixo de `14px` para valores)
- [ ] **UI-03**: Hierarquia tipográfica mantida após aumento de fonte (labels, headers, valores continuam distintos)

## v2 Requirements

### Importador

- **IMP-V2-01**: Suporte a múltiplas builds importadas de uma vez (batch import via lista de URLs)
- **IMP-V2-02**: Histórico de importações com timestamp e status

### Re-importação

- **UPD-V2-01**: Atualização em batch de todas as builds com `sourceUrl` (refresh all)
- **UPD-V2-02**: Agendamento automático de re-importação

### Qualidade

- **QUA-V2-01**: Score de confiança por campo extraído (baseado em parsing heurístico do scraper)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Importação via tRPC direto (sem scraper) | Removido — único caminho é scraper Python para garantir qualidade de extração |
| Merge silencioso sem diff na re-importação | Usuário deve ver explicitamente o que mudou antes de aceitar |
| Sync na nuvem / backend remoto | App é local-only, sem servidor |
| Multi-usuário / contas | Fora do escopo atual |
| Editor de build do zero (sem importar) | Caso de uso não solicitado — builds vêm do Questlog |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMP-01 | Fase 1 | Pending |
| IMP-02 | Fase 1 | Pending |
| IMP-03 | Fase 1 | Pending |
| IMP-04 | Fase 1 | Pending |
| IMP-05 | Fase 1 | Pending |
| DAT-01 | Fase 2 | Pending |
| DAT-02 | Fase 2 | Pending |
| DAT-03 | Fase 2 | Pending |
| PRV-01 | Fase 3 | Pending |
| PRV-02 | Fase 3 | Pending |
| PRV-03 | Fase 3 | Pending |
| PRV-04 | Fase 3 | Pending |
| PRV-05 | Fase 3 | Pending |
| PRV-06 | Fase 3 | Pending |
| QUA-01 | Fase 4 | Pending |
| QUA-02 | Fase 4 | Pending |
| QUA-03 | Fase 4 | Pending |
| QUA-04 | Fase 4 | Pending |
| QUA-05 | Fase 4 | Pending |
| UPD-01 | Fase 5 | Pending |
| UPD-02 | Fase 5 | Pending |
| UPD-03 | Fase 6 | Pending |
| UPD-04 | Fase 6 | Pending |
| UPD-05 | Fase 6 | Pending |
| UPD-06 | Fase 6 | Pending |
| UI-01 | Fase 7 | Pending |
| UI-02 | Fase 7 | Pending |
| UI-03 | Fase 7 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-11*
*Last updated: 2026-04-11 após inicialização*
