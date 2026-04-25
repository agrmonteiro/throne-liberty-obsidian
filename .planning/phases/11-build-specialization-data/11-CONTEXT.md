# Phase 11: Build Specialization Data - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase entrega a camada de dados de especialização (maestrias) no modelo de Build — scraper atualizado para capturar o JSON de especialização do Questlog, e Build persistindo esses dados para consumo pela Phase 12 (Rotation Builder).

**O que esta fase NÃO faz:**
- Não interpreta o efeito de cada nó de especialização no DPS (isso é Phase 12)
- Não exibe as maestrias em uma UI de rotação (isso é Phase 12)
- Não implementa o Rotation Builder side-by-side (isso é Phase 12)

**Renumeração do roadmap:** A atual Phase 11 (Rotation Builder) passa a ser Phase 12. Phases 12 e 13 passam a ser 13 e 14.

</domain>

<decisions>
## Implementation Decisions

### Scraper Python
- **D-01:** O scraper Python já usa Playwright — adicionar passo para clicar no botão "Export to Share" (ícone de upload) na página do Questlog e capturar o JSON resultante
- **D-02:** O JSON exportado pelo Questlog tem estrutura: `{ name, mainHand, offHand, specialization: [{id: string, lvl: number}] }` — o scraper deve extrair e retornar esses campos junto com os stats já extraídos
- **D-03:** O botão de export está na tela do Build Editor (não na página principal da build) — o scraper precisa navegar até a tela correta antes de clicar

### Modelo de Dados (Build)
- **D-04:** Adicionar campos opcionais ao tipo `Build`: `specialization?: Array<{id: string, lvl: number}>`, `weaponMain?: string`, `weaponOff?: string`
- **D-05:** Campos são opcionais — builds existentes carregam sem quebrar (migração graciosa = valores `undefined` são aceitos)
- **D-06:** `weaponMain`/`weaponOff` são strings livres que espelham os valores do Questlog (ex: `"staff"`, `"wand"`) — distintos dos `weaponMainType`/`weaponOffType` do Rotation engine que usam o formato capitalizado (`"Staff"`, `"Wand & Tome"`)

### Escopo da Phase 11
- **D-07:** Phase 11 é infraestrutura de dados — salvar IDs e níveis das especializações sem interpretar seus efeitos
- **D-08:** O que cada nó de especialização faz (ex: "+5% dano da skill X") fica para Phase 12 — Phase 11 não precisa de um banco de efeitos de maestria
- **D-09:** A entrega verificável: ao re-importar uma build com URL que tem maestrias configuradas, os dados de `specialization` aparecem persistidos no `builds.json`

### Claude's Discretion
- Estrutura exata de navegação Playwright para chegar ao botão de export (depende do DOM do Questlog)
- Tratamento de erro quando o build editor não está disponível ou o export falha (fallback gracioso sem maestrias)
- Mapeamento de `weaponMain`/`weaponOff` (formato Questlog lowercase) para `weaponMainType`/`weaponOffType` (formato Rotation engine) — pode ser uma função helper ou pode ficar para Phase 12

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Modelo de dados atual
- `src/engine/types.ts` — tipo `Build`, `BuildStats`, `RotationCharacter` — verificar campos de weapon existentes antes de adicionar novos
- `src/store/useBuilds.ts` — leitura/escrita de builds, incluindo migração graciosa

### Scraper Python
- `../throne_and_liberty_agent/questlog_scraper_standalone.py` (projeto irmão) — implementação atual do scraper com Playwright; verificar como a navegação está estruturada para entender onde adicionar o passo de export
- `.planning/phases/skilldb-rotation-integration.md` — contexto de integração SkillsDB, inclui decisões de UX relevantes para o Rotation Builder (Phase 12)

### Arquitetura IPC
- `electron/main/index.ts` — handler `questlog:import-python` — onde o output do scraper é recebido e processado antes de chegar à store
- `src/store/useBuilds.ts` — `parsePythonBuild()` — função que transforma o output do scraper no tipo `Build`

### Formato do export Questlog
- Exemplo de JSON exportado (coletado pelo usuário):
  ```json
  {
    "name": "Staff+Wand DPS t3 staff",
    "isPublic": true,
    "mainHand": "staff",
    "offHand": "wand",
    "specialization": [
      {"id": "Wand_Normal_Tactic_11", "lvl": 10},
      {"id": "Staff_Normal_Attack_01", "lvl": 10},
      {"id": "Staff_Normal_TacticAttack_12", "lvl": 10}
    ]
  }
  ```
- O ID de especialização segue padrão: `{Weapon}_{Type}_{SubType}_{Number}` — ex: `Staff_Normal_Tactic_11`
- Cada nó tem até 10 níveis (`lvl: 1-10`)
- A árvore de maestria tem 4 círculos de especialização por arma, acessados em Lv 130, 260, 390, 520

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `electron/main/index.ts` handler `questlog:import-python`: já spawna o scraper Python com Playwright — o passo de export se encaixa no mesmo fluxo Playwright existente
- `src/store/useBuilds.ts` `parsePythonBuild()`: função de parsing do output do scraper — adicionar extração dos campos `specialization`, `mainHand`, `offHand`
- Migração graciosa já existe para `sourceUrl` (Phase 2) — usar o mesmo padrão para os novos campos opcionais

### Established Patterns
- Output do scraper via stdout como JSON — o novo campo `specialization` deve ser adicionado ao JSON de output do scraper
- Migração graciosa: campos ausentes em builds antigas recebem `undefined`/`null` sem erro — padrão já estabelecido
- IPC seguro: validação Zod no handler (Phase 8) — incluir os novos campos no schema Zod de validação

### Integration Points
- `parsePythonBuild()` em `useBuilds.ts` é o ponto de entrada dos dados do scraper na store — adicionar extração aqui
- O tipo `Build` em `types.ts` é a fonte de verdade do modelo — extensão vai aqui primeiro
- Após Phase 11, a Phase 12 (Rotation Builder) lê `build.specialization`, `build.weaponMain`, `build.weaponOff` ao importar uma build para uma rotação

</code_context>

<specifics>
## Specific Ideas

- O usuário confirmou que o Questlog tem um botão "Export to Share" (ícone de upload) dentro do Build Editor que gera o JSON de especialização — o scraper simula esse clique
- Maestrias são "círculos de especialização" com 4 níveis de acesso por nível de personagem, cada nó tem até 10 pontos alocáveis
- Skills ativas e passivas por arma NÃO estão no JSON de export — só especializações (maestrias) + mainHand/offHand
- O scraper já está em projeto irmão (`throne_and_liberty_agent`) e já usa Playwright

</specifics>

<deferred>
## Deferred Ideas

- **Interpretação de efeitos de maestria no DPS** — mapeamento de `specialization[].id` para bônus numéricos de dano — fica para Phase 12
- **UI de visualização de maestrias na Rotation** — exibir quais nós estão ativos — Phase 12
- **Side-by-side de duas rotações** (ROT-02 original) — Phase 12
- **Skills ativas equipadas** (os ícones da build no topo do Questlog) — não estão no export atual; investigar se há outro endpoint que as expõe

</deferred>

---

*Phase: 11-build-specialization-data*
*Context gathered: 2026-04-25*
