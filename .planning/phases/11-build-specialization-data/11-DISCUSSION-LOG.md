# Phase 11: Build Specialization Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — este log preserva as alternativas consideradas.

**Date:** 2026-04-25
**Phase:** 11-build-specialization-data
**Areas discussed:** Foco da fase, Fonte de dados, Modelo da Build, Acesso do scraper, Split de fases, Entrega da Phase 11, Efeitos das maestrias

---

## Foco da fase

| Option | Description | Selected |
|--------|-------------|----------|
| Layout do comparativo | Side-by-side de duas rotações | |
| Redefinição de escopo | Foco em construir rotação baseada em habilidades/maestrias da build | ✓ |

**User's choice:** O usuário redirecionou o foco — o principal não é o comparativo, mas construir a rotação a partir dos dados reais da build (skills, especializações, maestrias). Hoje a Build não armazena esses dados.

---

## Fonte de dados e modelo

| Option | Description | Selected |
|--------|-------------|----------|
| Questlog expõe skills/specs via export JSON | Confirmar o que está disponível | ✓ |
| Dados vão dentro do tipo Build | Campos opcionais `specialization[]`, `weaponMain`, `weaponOff` | ✓ |
| Rotation Builder pré-preenche ao importar build | Skills equipadas viram skills iniciais | ✓ |

**Notes:** Questlog tem botão "Export to Share" que gera JSON com `mainHand`, `offHand`, `specialization: [{id, lvl}]`. Skills ativas NÃO estão no export — só maestrias/specs.

---

## Estrutura do T&L (esclarecimento do usuário)

O usuário esclareceu a estrutura do jogo:
- Cada arma tem: **skills ativas** + **skills passivas** + **maestrias** (árvore circular separada)
- Maestrias = círculos de especialização com 4 níveis (Lv 130, 260, 390, 520), cada nó tem até 10 pontos
- O export do Questlog contém apenas as **especializações/maestrias**, não as skills ativas

Exemplo do JSON exportado:
```json
{
  "name": "Staff+Wand DPS t3 staff",
  "mainHand": "staff",
  "offHand": "wand",
  "specialization": [
    {"id": "Wand_Normal_Tactic_11", "lvl": 10},
    {"id": "Staff_Normal_Attack_01", "lvl": 10}
  ]
}
```

---

## Acesso do scraper

| Option | Description | Selected |
|--------|-------------|----------|
| API direta (endpoint JSON) | Endpoint /api/builds/{id} | |
| Simular export (Playwright/Selenium) | Clicar no botão de export | ✓ |
| Já conhece o endpoint | URL específica já conhecida | |

**Notes:** Scraper já usa Playwright — adicionar passo de clicar no botão "Export to Share".

---

## Split de fases

| Option | Description | Selected |
|--------|-------------|----------|
| Inserir Phase 11 nova, atual vira 12 | Fase de dados antes do Rotation Builder | ✓ |
| Phase 10.1 inserida | Fase decimal sem renumerar | |
| Claude decide | — | |

**Notes:** Phase 11 = scraper + modelo de dados. Phase 12 = Rotation Builder (era Phase 11).

---

## Entrega da Phase 11

| Option | Description | Selected |
|--------|-------------|----------|
| Build salva maestrias + Rotation mostra elas | Scraper + modelo + UI básica | |
| Só salvar os dados (sem UI) | Infraestrutura pura | |
| Maestrias afetam o cálculo de DPS | Integração com rotation engine | ✓ |

**Notes:** A intenção final é que maestrias afetem DPS. Porém, a interpretação dos efeitos de cada nó fica para Phase 12 — Phase 11 só salva IDs e níveis.

---

## Efeitos das maestrias

| Option | Description | Selected |
|--------|-------------|----------|
| Questlog exibe o efeito de cada nó | Scrape automático de efeitos | |
| Mapeamento manual | Banco de efeitos mantido à mão | |
| Deixa pra Phase 12 (só salvar agora) | Infraestrutura agora, interpretação depois | ✓ |

---

## Claude's Discretion

- Estrutura exata de navegação Playwright para o botão de export
- Tratamento de erro quando o export falha
- Mapeamento de formato de weapon (lowercase Questlog → capitalizado Rotation engine)

## Deferred Ideas

- Interpretação de efeitos de maestria no DPS (Phase 12)
- UI de maestrias na Rotation (Phase 12)
- Side-by-side de duas rotações (Phase 12, era ROT-02)
- Skills ativas equipadas — investigar se outro endpoint as expõe
