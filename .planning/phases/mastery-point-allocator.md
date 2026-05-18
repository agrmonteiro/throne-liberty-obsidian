# Fase: Alocador de Pontos de Maestria

**Status:** PLANEJADO  
**Prioridade:** Alta  
**Estimativa:** 3–4 sessões

---

## Objetivo

Transformar a página de Maestrias de exibição estática em um alocador interativo de pontos.  
O usuário escolhe uma arma, distribui até 200 pontos entre os nós da árvore e vê em tempo real:

1. **Atributos totais** — soma numérica de todos os stats concedidos pelos nós alocados
2. **Efeitos modificadores** — lista de efeitos qualitativos ativos (skill nodes e Hero nodes)

Esses outputs alimentam diretamente o Calculador de Dano e a Rotação, eliminando entrada manual duplicada.

---

## Contexto de dados

### Arquivos existentes

| Arquivo | Conteúdo | Limitações |
|---|---|---|
| `src/data/masteryTrees.ts` | Posições dos nós: weapon, branch, column, tipo, nome | Sem valores de stats |
| `src/data/weaponMasteries.ts` | Stats level-10, descrição, grade, weapon | Sem posição; campo `weapon` diverge para 3 armas |

### Métricas dos dados

- **9 armas** × **52 nós** = **468 nós** total em masteryTrees
- weaponMasteries: ~484 entradas (inclui 22 prefixo `WM` = nós genéricos compartilhados)
- **Distribuição por branch:** branch 3 = 144, branch 2 = 144, branch 1 = 144, branch 5 = 36
- **Tipos de nó por arma:** 48 nós regulares (16/branch × 3 tiers) + 4 nós Hero (branch 5)
- **Skill nodes** (ID `20xxx`, `isSkillNode: true`): 12 por arma (4 por branch), sem stats numéricos
- **Stat labels únicos** em weaponMasteries: 102 labels (inclui ~5 strings de lixo de scraping)

### Mapeamento de tiers

```
masteryTrees.branch  →  grade em weaponMasteries  →  ID prefix exemplo
──────────────────────────────────────────────────────────────────────
branch 3 (inner)     →  Common                    →  Bow_Normal_*
branch 2 (mid)       →  Uncommon                  →  Bow_High_*
branch 1 (outer)     →  Rare                      →  Bow_Rare_*
branch 5 (hero)      →  Epic                      →  Bow_Hero_*
```

### Cross-reference entre os dois arquivos

Não há chave direta. O join deve ser feito **por nome do nó** (campo `name`), considerando:

1. `masteryTrees[n].name` ≈ `weaponMasteries[m].name.en` (inglês)
2. Mesmo weapon (após normalizar nomes — ver tabela abaixo)
3. Mesmo grade/tier (derivado do branch)

**Normalização de weapon name:**

| ID prefix | weapon_name em masteryTrees | weapon: em weaponMasteries |
|---|---|---|
| `Bow_` | `Longbow` | `Longbow` |
| `Crossbow_` | `Crossbows` | `Crossbow` |
| `Dagger_` | `Daggers` | — (diverge, precisa checar) |
| `Spear_` | `Spear` | `Spear` |
| `Staff_` | `Staff` | `Staff` |
| `Sword2h_` | `Greatsword` | `Greatsword` |
| `Sword_` | `Sword` | — (diverge, precisa checar) |
| `Wand_` | `Wand` | — (diverge, precisa checar) |
| `Orb_` | `Orb` | `Orb` |
| `WM_` | (todos) | — nós genéricos (sem weapon específico) |

### Scaling de stats

- **Regra geral:** `valor_por_level = valor_lv10 / 10` (linear)
- **Exceção — threshold:** alguns nós têm stat que só ativa a partir do Lv X  
  - Ex: "Max Damage increases from Lv. 4" → os 3 primeiros levels não concedem Max Damage  
  - Pattern na descrição: `/increases from Lv\. (\d)/`
- **Hero nodes** (`hasPassiveLevels: true`): scaling especial descrito no texto  
  - masteryTrees tem valor lv1 na `description`; weaponMasteries tem valor lv10  
  - MVP: interpolação linear entre lv1 e lv10
- **Skill nodes** (`isSkillNode: true`, ID `20xxx`): efeitos qualitativos, sem stats numéricos  
  - Ativados como milestone (20 pts no branch), não têm levels individuais

---

## Regras de negócio

### Orçamento de pontos

- **200 pontos** por arma (budget fixo)
- Cada level de nó custa **1 ponto**; máximo **10 levels** por nó regular
- Hero nodes: máximo **1 level** cada (ativação binária)

### Gates de tier (unlock)

```
Tier         | Condição de desbloqueio
─────────────┼──────────────────────────────────────────
Common       | Sempre disponível
Uncommon     | ≥ 30 pts investidos em Common
Rare         | ≥ 30 pts investidos em Uncommon
Epic/Hero    | ≥ 80 pts total (qualquer combinação de tiers)
```

### Skill nodes (milestone)

Skill nodes (colunas 1, 3, 5, 7 de cada branch) são **ativados automaticamente** ao investir
**20 pts** no mesmo branch/tier. Não custam pontos extras. Ficam travados abaixo do milestone.

### Fórmula de totalizador

```
stat_total = Σ (valor_lv10[nó] / 10) × levels_alocados[nó]
```

Para stats com threshold (ex: "from Lv. 4"):
```
stat_total = Σ max(0, levels_alocados[nó] - (threshold-1)) × (valor_lv10 / (11 - threshold))
```

Stats negativos (Intensity nodes) entram com sinal negativo na soma — são **debuffs** reais.

---

## Schema de saída do sistema de maestrias

Esta é a parte central da fase. As maestrias alocadas produzem **dois tipos de output** que o resto
da aplicação consome.

### 1. Atributos totais — `MasteryAttributes`

Soma numérica completa de todos os stats concedidos pelos nós alocados.  
Cobre tanto stats relevantes para DPS quanto stats de utilidade/defesa.

```ts
// src/engine/masteryTypes.ts

export interface MasteryAttributes {
  // ── Ofensivos (alimentam o Calculador e a Rotação) ──────────────────
  critHitChanceRanged:    number  // "Ranged Critical Hit Chance"
  critHitChanceMelee:     number  // "Melee Critical Hit Chance"
  critHitChanceMagic:     number  // "Magic Critical Hit Chance"
  critDmgPct:             number  // "Critical Damage" (valor em %, ex: 3.0)
  heavyAttackChanceRanged:number  // "Ranged Heavy Attack Chance"
  heavyAttackChanceMelee: number  // "Melee Heavy Attack Chance"
  heavyAttackChanceMagic: number  // "Magic Heavy Attack Chance"
  skillDmgBoost:          number  // "Skill Damage Boost"
  attackSpeedPct:         number  // "Attack Speed"
  cdrPct:                 number  // "Cooldown Speed"
  baseDmg:                number  // "Base Damage" (flat pre-skill%)
  bonusDmg:               number  // "Bonus Damage" (flat post-calc)
  bossBonusDmg:           number  // "Boss Bonus Damage"
  maxDmg:                 number  // "Max Damage" (incrementa teto de weapon dmg)
  hitChanceRanged:        number  // "Ranged Hit Chance"
  hitChanceMelee:         number  // "Melee Hit Chance"
  hitChanceMagic:         number  // "Magic Hit Chance"
  offHandAttackChance:    number  // "Off-Hand Weapon Attack Chance"
  rangeDmgBoost:          number  // "Ranged Damage Boost"
  meleeDmgBoost:          number  // "Melee Damage Boost"
  magicDmgBoost:          number  // "Magic Damage Boost"
  // Species
  humanoidDmgBoost:       number  // "Humanoid Damage Boost"
  constructDmgBoost:      number  // "Construct Damage Boost"
  demonDmgBoost:          number  // "Demon Damage Boost"
  undeadDmgBoost:         number  // "Undead Damage Boost"
  wildkinDmgBoost:        number  // "Wildkin Damage Boost"

  // ── Utilidade ───────────────────────────────────────────────────────
  buffDurationPct:        number  // "Buff Duration"
  debuffDurationPct:      number  // "Debuff Duration"
  manaCostEfficiency:     number  // "Mana Cost Efficiency" (%)
  manaRegen:              number  // "Mana Regen"
  maxMana:                number  // "Max Mana"
  maxHealth:              number  // "Max Health"
  maxStamina:             number  // "Max Stamina"
  healthRegen:            number  // "Health Regen"
  movementSpeed:          number  // "Movement Speed"
  range:                  number  // "Range" / "Attack Range"
  perception:             number  // "Perception"
  strength:               number  // "Strength"
  dexterity:              number  // "Dexterity"
  wisdom:                 number  // "Wisdom"
  fortitude:              number  // "Fortitude"

  // ── Defensivos ──────────────────────────────────────────────────────
  meleeEndurance:         number  // "Melee Endurance" (pode ser negativo em Intensity)
  rangedEndurance:        number  // "Ranged Endurance"
  magicEndurance:         number  // "Magic Endurance"
  meleeDefense:           number  // "Melee Defense"
  rangedDefense:          number  // "Ranged Defense"
  magicDefense:           number  // "Magic Defense"
  meleeEvasion:           number  // "Melee Evasion"
  rangedEvasion:          number  // "Ranged Evasion"
  magicEvasion:           number  // "Magic Evasion"
  heavyAttackEvasionMelee: number
  heavyAttackEvasionRanged: number
  heavyAttackEvasionMagic:  number
  critDmgResistance:      number  // "Critical Damage Resistance" (%)
  skillDmgResistance:     number  // "Skill Damage Resistance"
  damageReduction:        number  // "Damage Reduction"
  healingReceived:        number  // "Healing Received"
  potionHealing:          number  // "Potion Healing"
  shieldHealth:           number  // "Shield Health"
  shieldBlockChance:      number  // "Shield Block Chance"

  // ── CC ofensivo ─────────────────────────────────────────────────────
  bindChance:             number  // "Bind Chance"
  stunChance:             number  // "Stun Chance"
  sleepChance:            number  // "Sleep Chance"
  silenceChance:          number  // "Silence Chance"
  fearChance:             number  // "Fear Chance"
  petrificationChance:    number  // "Petrification Chance"
  collisionChance:        number  // "Collision Chance"
  bindDurationBonus:      number  // "Bind Duration" (s)
  stunDurationBonus:      number  // "Stun Duration" (s)

  // ── CC defensivo ────────────────────────────────────────────────────
  bindResistance:         number
  stunResistance:         number
  sleepResistance:        number
  silenceResistance:      number
  fearResistance:         number
  weakeningResistance:    number
  petrificationResistance:number
  collisionResistance:    number
}

export const EMPTY_MASTERY_ATTRIBUTES: MasteryAttributes = {
  /* todos os campos = 0 */
}
```

### 2. Efeitos modificadores — `MasteryEffect`

Efeitos qualitativos de skill nodes (20xxx) e Hero nodes ativos.  
**Não são somáveis** — cada um é um modificador único de comportamento de skill.

```ts
// src/engine/masteryTypes.ts

export type MasteryEffectSource = 'skillNode' | 'hero'

export interface MasteryEffect {
  nodeId:      number              // treeId do nó (ex: 20041)
  source:      MasteryEffectSource
  weaponId:    number
  nameEn:      string              // ex: "Roxie's Arrow Storm"
  namePt:      string
  descriptionEn: string            // texto completo do efeito
  descriptionPt: string
  isActive:    boolean             // milestone atingido / Hero alocado
  level:       number              // 0 ou 1 para skill nodes; 1-10 para Hero
}
```

### 3. Output consolidado — `MasteryOutput`

Produzido pelo store ao chamar `getOutput(weaponId)`:

```ts
export interface MasteryOutput {
  weaponId:    number
  weaponName:  string
  pointsSpent: number              // total alocado (0-200)
  attributes:  MasteryAttributes   // todos os campos numéricos somados
  effects:     MasteryEffect[]     // apenas efeitos com isActive: true
  tierPoints: {
    common:    number
    uncommon:  number
    rare:      number
    hero:      number
  }
}
```

### 4. Mapeamento label → campo de `MasteryAttributes`

```ts
// src/engine/masteryTypes.ts
export const STAT_LABEL_MAP: Record<string, keyof MasteryAttributes> = {
  'Ranged Critical Hit Chance':  'critHitChanceRanged',
  'Melee Critical Hit Chance':   'critHitChanceMelee',
  'Magic Critical Hit Chance':   'critHitChanceMagic',
  'Critical Damage':             'critDmgPct',
  'Ranged Heavy Attack Chance':  'heavyAttackChanceRanged',
  'Melee Heavy Attack Chance':   'heavyAttackChanceMelee',
  'Magic Heavy Attack Chance':   'heavyAttackChanceMagic',
  'Skill Damage Boost':          'skillDmgBoost',
  'Attack Speed':                'attackSpeedPct',
  'Cooldown Speed':              'cdrPct',
  'Base Damage':                 'baseDmg',
  'Bonus Damage':                'bonusDmg',
  'Boss Bonus Damage':           'bossBonusDmg',
  'Max Damage':                  'maxDmg',
  'Ranged Hit Chance':           'hitChanceRanged',
  'Melee Hit Chance':            'hitChanceMelee',
  'Magic Hit Chance':            'hitChanceMagic',
  'Hit Chance':                  'hitChanceMelee',  // fallback genérico
  'Off-Hand Weapon Attack Chance': 'offHandAttackChance',
  'Ranged Damage Boost':         'rangeDmgBoost',
  'Melee Damage Boost':          'meleeDmgBoost',
  'Magic Damage Boost':          'magicDmgBoost',
  'Humanoid Damage Boost':       'humanoidDmgBoost',
  'Construct Damage Boost':      'constructDmgBoost',
  'Demon Damage Boost':          'demonDmgBoost',
  'Undead Damage Boost':         'undeadDmgBoost',
  'Wildkin Damage Boost':        'wildkinDmgBoost',
  'Buff Duration':               'buffDurationPct',
  'Debuff Duration':             'debuffDurationPct',
  'Mana Cost Efficiency':        'manaCostEfficiency',
  'Mana Regen':                  'manaRegen',
  'Max Mana':                    'maxMana',
  'Max Health':                  'maxHealth',
  'Max Stamina':                 'maxStamina',
  'Health Regen':                'healthRegen',
  'Movement Speed':              'movementSpeed',
  'Range':                       'range',
  'Perception':                  'perception',
  'Strength':                    'strength',
  'Dexterity':                   'dexterity',
  'Wisdom':                      'wisdom',
  'Fortitude':                   'fortitude',
  'Melee Endurance':             'meleeEndurance',
  'Ranged Endurance':            'rangedEndurance',
  'Magic Endurance':             'magicEndurance',
  'Melee Defense':               'meleeDefense',
  'Ranged Defense':              'rangedDefense',
  'Magic Defense':               'magicDefense',
  'Melee Evasion':               'meleeEvasion',
  'Ranged Evasion':              'rangedEvasion',
  'Magic Evasion':               'magicEvasion',
  'Melee Heavy Attack Evasion':  'heavyAttackEvasionMelee',
  'Ranged Heavy Attack Evasion': 'heavyAttackEvasionRanged',
  'Magic Heavy Attack Evasion':  'heavyAttackEvasionMagic',
  'Critical Damage Resistance':  'critDmgResistance',
  'Skill Damage Resistance':     'skillDmgResistance',
  'Damage Reduction':            'damageReduction',
  'Healing Received':            'healingReceived',
  'Potion Healing':              'potionHealing',
  'Shield Health':               'shieldHealth',
  'Shield Block Chance':         'shieldBlockChance',
  'Bind Chance':                 'bindChance',
  'Stun Chance':                 'stunChance',
  'Sleep Chance':                'sleepChance',
  'Silence Chance':              'silenceChance',
  'Fear Chance':                 'fearChance',
  'Petrification Chance':        'petrificationChance',
  'Collision Chance':            'collisionChance',
  'Bind Duration':               'bindDurationBonus',
  'Stun Duration':               'stunDurationBonus',
  'Bind Resistance':             'bindResistance',
  'Stun Resistance':             'stunResistance',
  'Sleep Resistance':            'sleepResistance',
  'Silence Resistance':          'silenceResistance',
  'Fear Resistance':             'fearResistance',
  'Weaken Resistance':           'weakeningResistance',
  'Petrification Resistance':    'petrificationResistance',
  'Collision Resistance':        'collisionResistance',
  // Labels de lixo de scraping (ignorar silenciosamente):
  // "Any idea of what these skills do?"
  // "wtf is a survival skill?"
  // "Does not work with Wand heals..."
}
```

Labels não mapeados são ignorados silenciosamente na computação (logados em dev).

### 5. Integração com o resto da aplicação

#### A. Calculador de Dano (`src/pages/Calculator.tsx`)

A calculadora usa `BuildStats`. Os campos relevantes de `MasteryAttributes` projetam assim:

```ts
// src/engine/masteryProjection.ts

export function masteryToCalcStats(ma: MasteryAttributes): Partial<BuildStats> {
  return {
    critHitChance:     ma.critHitChanceRanged + ma.critHitChanceMelee + ma.critHitChanceMagic,
    heavyAttackChance: ma.heavyAttackChanceRanged + ma.heavyAttackChanceMelee + ma.heavyAttackChanceMagic,
    critDmgPct:        ma.critDmgPct,
    skillDmgBoost:     ma.skillDmgBoost,
    attackSpeedPct:    ma.attackSpeedPct,
    cdrPct:            ma.cdrPct,
    bonusDmg:          ma.bonusDmg + ma.baseDmg,
    maxWeaponDmg:      ma.maxDmg,
    // speciesDmgBoost: soma de todos os species boosts (user escolhe qual se aplica)
  }
}
```

> **Nota:** `critHitChance` genérico vs Ranged/Melee/Magic específico — o calculador atual
> não distingue tipo. Por enquanto, somam todos. Uma futura versão pode filtrar por arma ativa.

#### B. Rotação (`src/pages/Rotation.tsx`)

`RotationCharacter` já tem os campos equivalentes. Projeção direta:

```ts
export function masteryToRotationCharacter(ma: MasteryAttributes): Partial<RotationCharacter> {
  return {
    critChanceBase:  ma.critHitChanceRanged + ma.critHitChanceMelee + ma.critHitChanceMagic,
    critDmgPct:      ma.critDmgPct,
    heavyChanceBase: ma.heavyAttackChanceRanged + ma.heavyAttackChanceMelee + ma.heavyAttackChanceMagic,
    skillDmgBoost:   ma.skillDmgBoost,
    attackSpeedPct:  ma.attackSpeedPct,
    cdrPct:          ma.cdrPct,
    bonusDamage:     ma.bonusDmg + ma.baseDmg,
  }
}
```

#### C. Página de Maestrias (exibição inline)

O totalizador na UI não usa projeção — exibe `MasteryAttributes` diretamente, agrupado
por categoria (Ofensivo / Defensivo / Utilidade / CC), ocultando campos zerados.

---

## Arquitetura proposta

### Fase 1 — Tipos e mapeamento (`src/engine/masteryTypes.ts`)

Definir `MasteryAttributes`, `MasteryEffect`, `MasteryOutput`, `STAT_LABEL_MAP` e funções
de projeção (`masteryToCalcStats`, `masteryToRotationCharacter`).

### Fase 2 — Data layer (`src/data/masteryIndex.ts`)

Script de build (`scripts/gen-mastery-index.mjs`) que faz o join por nome entre os dois
datasets e gera `MASTERY_INDEX: MasteryNodeFull[]`.

**Tipo `MasteryNodeFull`:**

```ts
export interface MasteryNodeFull {
  treeId:           number
  column:           number
  branch:           number       // 1=Rare, 2=Uncommon, 3=Common, 5=Hero
  weaponId:         number
  weaponName:       string
  isSkillNode:      boolean
  hasPassiveLevels: boolean
  masteryId?:       string       // ex: 'Bow_High_Attack_01' (undefined = sem match)
  nameEn:           string
  namePt:           string
  grade:            'Common' | 'Uncommon' | 'Rare' | 'Epic'
  category:         string
  descriptionEn:    string
  descriptionPt:    string
  stats:            MasteryStatFull[]
}

export interface MasteryStatFull {
  labelEn:        string
  labelPt:        string
  attrKey:        keyof MasteryAttributes | null  // null = label não mapeado
  valueAtLv10:    number
  isPercent:      boolean
  perLevel:       number
  levelThreshold: number  // 0 = linear; >0 = só ativa após este level
}
```

### Fase 3 — Store (`src/store/useMastery.ts`)

```ts
interface MasteryState {
  allocations: Record<number, Record<number, number>>  // weaponId → nodeId → levels

  allocate:          (weaponId: number, nodeId: number, levels: number) => void
  reset:             (weaponId: number) => void
  getOutput:         (weaponId: number) => MasteryOutput   // ← principal export
  getAllWeaponsStats: () => Partial<MasteryAttributes>      // soma de todas as armas
}
```

`getOutput` computa `MasteryAttributes` em tempo real:

```
Para cada nó alocado:
  Para cada stat do nó:
    levels_efetivos = max(0, levels - levelThreshold)
    contribuição = levels_efetivos × perLevel
    attributes[attrKey] += contribuição
```

`getAllWeaponsStats` soma os atributos de todas as armas (para injetar no calculador/rotação
quando o usuário tiver maestrias de múltiplas armas).

### Fase 4 — UI (`src/pages/MasteryTrees.tsx`)

#### 4a. Controles de nó

- **Click** → mini-popup com stepper `0 → 10`
- Anel SVG preenchido proporcional ao level (`stroke-dasharray`)
- Estados: travado (cinza + cadeado) / disponível (translúcido) / parcial / máximo (brilhante)
- Skill nodes: badge especial, sem stepper; indicador ativo/inativo

#### 4b. Painel de controle

```
[ Orçamento: 127/200 pts ]  [ Reset arma ]

Common:    28/30 pts  ████████░░  ✓ Uncommon desbloqueada
Uncommon:  40/30 pts  ██████████  ✓ Rare desbloqueada
Rare:      59/-- pts  ██████████
Hero:       0/4       (requer 80 pts total — atual: 127 ✓)
```

#### 4c. Totalizador de atributos (painel lateral colapsável)

Exibe `MasteryAttributes` agrupado, ocultando campos zerados:

```
═══ Atributos Totais ══════════════════
▼ OFENSIVO
  Ranged Crit Chance      +47
  Crit Damage             +2.1%
  Attack Speed            +30
  Cooldown Speed          +20%

▼ DEFENSIVO
  Melee Endurance         -45    ← vermelho

▼ EFEITOS MODIFICADORES (3 ativos)
  ● Roxie's Arrow Storm   — Roxie's Arrowhead tem 10% de chance...
  ● Lethal Stacks         — Deadly Marker aplica 10 acúmulos...
  ● Bullseye Hunter       — A cada Bullseye, Ranged Crit +30 por 3s...
```

---

## Plano de execução

### Tarefa 1 — `src/engine/masteryTypes.ts`

1. Definir interface `MasteryAttributes` com todos os campos zerados em `EMPTY_MASTERY_ATTRIBUTES`
2. Definir `MasteryEffect`, `MasteryOutput`
3. Implementar `STAT_LABEL_MAP` (label → attrKey)
4. Implementar `masteryToCalcStats` e `masteryToRotationCharacter`

**Critério:** TypeScript compila sem erros. Projeções cobrem os campos de `BuildStats` e `RotationCharacter` relevantes.

---

### Tarefa 2 — `scripts/gen-mastery-index.mjs` + `src/data/masteryIndex.ts`

1. Join por nome entre masteryTrees e weaponMasteries (normalizar weapon names)
2. Para cada stat: parsear value string → number, detectar `isPercent`, calcular `perLevel`, detectar `levelThreshold`
3. Aplicar `STAT_LABEL_MAP` para preencher `attrKey`
4. Logar nós sem match, labels não mapeados, strings de lixo de scraping
5. Exportar `MASTERY_INDEX`

**Critério:** < 5% de nós sem match. Todos os 9 weapons cobertos. Zero crashes em runtime.

---

### Tarefa 3 — `src/store/useMastery.ts`

1. Criar store Zustand com persistência (chave: `mastery-allocations`)
2. `allocate` com validações: budget 200 pts, tier gate, clamp 0-10
3. `getOutput` com cálculo completo de `MasteryAttributes` + `MasteryEffect[]`
4. `getAllWeaponsStats` — soma de todas as armas alocadas

**Critério:** testes manuais — alocar nós, verificar unlocks de tier, verificar totais.

---

### Tarefa 4 — UI: controles de nó (MasteryTrees.tsx)

1. Integrar `useMastery` no componente existente
2. Adicionar click handler → `NodeLevelPicker` (stepper popup)
3. Visual de anel SVG com preenchimento por level
4. Aplicar estados visuais (travado / disponível / parcial / máximo / skill node)

---

### Tarefa 5 — UI: painel de controle + totalizador

1. Barra de orçamento + breakdown por tier
2. Botão Reset por arma
3. Painel de `MasteryAttributes` agrupado (oculta zeros)
4. Lista de `MasteryEffect` ativos com descrição

---

### Tarefa 6 — Integração com Calculador e Rotação

1. Calculador: botão/toggle "Incluir bônus de maestrias" → injeta `masteryToCalcStats` nos stats base
2. Rotação: idem para `masteryToRotationCharacter`
3. Exibir separador visual nos campos afetados ("+ X de maestria")

---

## Riscos e decisões pendentes

| Item | Risco | Decisão sugerida |
|---|---|---|
| Join por nome pode falhar para nós renomeados | ~5% de nós sem match esperados | Nós sem match ficam sem stats, só descrição; logar para correção manual |
| Hero nodes com scaling não-linear | Linear é aproximação | MVP usa linear; v2 tem tabela hardcoded para os 36 Hero nodes |
| Skill nodes sem stats numéricos | Não entram em `MasteryAttributes` | Só entram em `MasteryEffect[]`; exibição qualitativa |
| `weapon:` divergente para Dagger/Sword/Wand | Join pode falhar para 3 armas | Normalizar com tabela de mapeamento hardcoded antes do join |
| Soma de Ranged+Melee+Magic crit em campo único | Calculador não distingue tipo de ataque | Comportamento atual preservado; issue separado para refinamento futuro |
| Labels de lixo de scraping (5 strings inválidas) | `STAT_LABEL_MAP` retorna `null` | Ignorar silenciosamente; logar em modo dev |
| `getAllWeaponsStats` soma armas diferentes | Jogador geralmente tem só 2 armas | Por ora soma tudo; v2 permite escolher quais armas considerar |
| MasteryTrees.tsx tem SVG radial complexo | Integrar alocação sem quebrar layout | Separar lógica (hook) de renderização (componente) |

---

## Dependências

- `src/data/masteryTrees.ts` — existente ✅
- `src/data/weaponMasteries.ts` — existente ✅
- `src/pages/MasteryTrees.tsx` — existente ✅ (vai ser modificado)
- `src/engine/types.ts` — existente ✅ (leitura apenas)
- `src/engine/masteryTypes.ts` — **novo** (Tarefa 1)
- `src/data/masteryIndex.ts` — **novo** (Tarefa 2)
- `scripts/gen-mastery-index.mjs` — **novo** (Tarefa 2)
- `src/store/useMastery.ts` — **novo** (Tarefa 3)

---

## Fora do escopo desta fase

- Salvar maestrias vinculadas a uma build específica
- Importar alocação de maestrias do quest log
- Filtrar crit Ranged/Melee/Magic por tipo de arma ativa
- Múltiplos perfis de maestria por arma
- Scaling exato dos 36 Hero nodes (MVP usa linear)
