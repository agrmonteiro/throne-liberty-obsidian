# Requirements: Throne & Liberty — Obsidian Command v2.0 Game Intelligence

**Defined:** 2026-04-17
**Core Value:** Transformar o app de importador de build em ferramenta completa de otimização de personagem — com análise de logs, gerador de rotação com dados reais de skills, scoring de gear com ML e pipeline de dados sustentável.

## v2 Requirements

### Log Parser

- [ ] **LOG-01**: Usuário pode abrir dois logs simultaneamente em split view, comparando DPS e métricas lado a lado

### Skill Importer

- [ ] **SKI-01**: Script standalone scrapa múltiplas fontes web e produz `skillsDB.json` com nome, arma, categoria, cooldown, damage%, hits por skill
- [ ] **SKI-02**: `skillsDB.json` gerado pelo script é a fonte de verdade — app carrega em runtime (substituindo o `skillsDB.ts` hardcoded)
- [ ] **SKI-03**: Script detecta e reporta conflitos entre fontes (dados divergentes para a mesma skill)
- [ ] **SKI-04**: Script tem modo incremental: só reprocessa skills novas ou modificadas desde o último run

### Rotation Builder

- [ ] **ROT-01**: Campo de skill no builder oferece autocomplete com skills do `skillsDB.json` e stats pré-preenchidos (CD, damage%, hits)
- [ ] **ROT-02**: Usuário pode criar e visualizar duas rotações side-by-side com DPS de cada exibido simultaneamente

### Gear Scorer UI

- [ ] **GS-01**: App tem página GearScorer que exibe ranking de itens candidatos por DPS delta, usando o engine `rankItemUpgrades` já implementado
- [ ] **GS-02**: Página GearScorer organiza recomendações por slot (head, chest, hands, legs, feet, acessórios, armas)

### Gear Scorer ML

- [ ] **ML-01**: Script Python coleta builds públicas do Questlog em massa para corpus de treino, com versão de patch registrada por lote
- [ ] **ML-02**: Script de treino produz modelo sklearn exportado como artefato ONNX versionado (ex: `gear_v1.3.2.onnx`)
- [ ] **ML-03**: App spawna subprocess Python para inference do modelo ONNX, recebe scores via stdout JSON — mesmo padrão do scraper existente
- [ ] **ML-04**: Ciclo de retreinamento scriptado e documentado: coletar dados → treinar → exportar ONNX → substituir artefato

### IPC Security

- [ ] **SEC-01**: Handler `questlog:import-python` valida que URL começa com `https://questlog.gg/` antes de spawnar subprocess
- [ ] **SEC-02**: Todos handlers de file I/O resolvem paths dentro de `AppData/Roaming/throne-liberty/` e rejeitam path traversal
- [ ] **SEC-03**: Handler `data:write` valida estrutura mínima do payload antes de gravar (builds.json requer array de builds)
- [ ] **SEC-04**: Erros nos handlers IPC nunca incluem stack traces ou caminhos do filesystem na resposta ao renderer

## Backlog (deferred — post v2.0)

- **LOG-BK-01**: Streaming de arquivos de log grandes (substituir `readFileSync` — bloqueia com 100MB+)
- **ROT-BK-01**: Detecção de combos de skills (grafo de combo por arma — alta complexidade)
- **GS-BK-01**: Comparação head-to-head de dois itens específicos
- **ML-BK-01**: UI de retraining dentro do app (progresso, log, versão do modelo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Scraping em tempo real de itens do jogo | T&L não tem API pública de itens |
| Tier list genérica de itens sem contexto de build | Scoring sem build é inútil — sempre relativo à rotação ativa |
| Log tailing em tempo real (estilo ACT) | Alta complexidade, fora do padrão local-only |
| Métricas de heal/tank | App foca em DPS — fora do escopo |
| Multi-usuário / cloud sync | App é local-only |
| Skill combo solver automático | Explosão combinatória — usuário define manualmente via timeline |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOG-01 | TBD | Pending |
| SKI-01 | TBD | Pending |
| SKI-02 | TBD | Pending |
| SKI-03 | TBD | Pending |
| SKI-04 | TBD | Pending |
| ROT-01 | TBD | Pending |
| ROT-02 | TBD | Pending |
| GS-01 | TBD | Pending |
| GS-02 | TBD | Pending |
| ML-01 | TBD | Pending |
| ML-02 | TBD | Pending |
| ML-03 | TBD | Pending |
| ML-04 | TBD | Pending |
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| SEC-04 | TBD | Pending |

**Coverage:**
- v2 requirements: 17 total
- Mapped to phases: TBD (roadmapper will fill)

---
*Requirements defined: 2026-04-17*
