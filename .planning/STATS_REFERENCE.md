# Throne & Liberty — Referência de Fórmulas de Stats

Fonte: https://maxroll.gg/throne-and-liberty/resources/in-depth-stats-guide  
Capturado em: 2026-04-15  
Status: Parcial — campos marcados com `[TBD]` precisam de verificação empírica ou fonte adicional.

---

## Fórmulas Confirmadas

### Chance Crítica
```
critChance = (Crit - EnemyEndurance) / (Crit - EnemyEndurance + 1000) × 100
```
- Se `Crit - EnemyEndurance <= 0`, chance = 0%
- Exemplo: 1800 Crit vs 1400 Endurance → (400 / 1400) × 100 = **28.6%**
- Cura (healing crit): `Crit / (Crit + 6000)`

### Heavy Attack (Pesado)
```
heavyChance = Heavy / (Heavy + 1000) × 100
```
- **Nota:** Heavy NÃO desconta Endurance do alvo (diferente de Crit)
- Boss Heavy Chance é aditivo ao Heavy base antes da fórmula:
  `effectiveHeavy = heavyBase + heavyBoss`

### Skill Damage Boost (SDB / Dano de Espécie)
```
sdbMultiplier = SDB / (SDB + 1000)
```
- Healing: `SDB / (SDB + 3000)`
- **Nota do usuário:** funciona similar a Spell Damage — é um stat flat que alimenta essa fórmula, não um % direto

### Skill Damage Resistance (SDR)
```
sdrReduction = SDR / (SDR + 700) × 100
```

### Evasão
```
evasionChance = (Evasion - EnemyHit) / (Evasion - EnemyHit + 1000) × 100
```
- Se `Evasion - EnemyHit <= 0`, evasão tende a 0%

### Cooldown Reduction (CDR)
```
effectiveCDR = 1 - (1 / (1 + cooldownSpeed / 100))
finalCD      = baseCD × (1 - effectiveCDR)
```
- Retornos decrescentes (diminishing returns) — fórmula hiperbólica
- **Hard cap: 120%** de cooldown speed como input máximo
- Validado empiricamente com múltiplos pontos:

| CDR input % | Redução efetiva % |
|-------------|-------------------|
| 1.0         | 0.990             |
| 1.5         | 1.478             |
| 2.0         | 1.961             |
| 2.5         | 2.439             |
| 8.5         | 7.834             |
| 34.7        | 25.761            |
| 50.2        | 33.422            |
| 76.5        | 43.311            |
| 82.1        | 45.085            |
| 120.0       | 54.545 (cap)      |

### Duração de Buff
```
finalDuration = baseDuration × (1 + buffDurationStat)
```

### Bonus Damage (True Damage)
```
finalDamage = scaledDamage + bonusDamage
```
- **Não escala** com nenhum multiplicador (arma, crit, stellarite, SDB)
- Soma **flat** a cada hit individual
- **Não afeta DoT** (damage-over-time)
- Exemplo: skill causa 3000 de dano escalado + 100 bonus = **3100 total**
- Efetivo em armas multi-hit (soma por hit, não por skill)

---

## Stats com Hard Cap

| Stat | Input Máximo | Observação |
|------|-------------|------------|
| Cooldown Speed | 120% | Fórmula com diminishing returns |
| Attack Speed | 150% | Linear, sem diminishing returns |
| Advantage Duration | 150% | Linear, sem diminishing returns |

---

## Fórmulas Pendentes `[TBD]`

### Attack Speed
```
finalAS = baseAS × (1 + min(attackSpeedPct, 150) / 100)
```
- **Sem diminishing returns** — escala linear até o cap
- **Hard cap: 150%** de input máximo
- Exemplo: base 1.0 + 80% AS → 1.0 × 1.80 = 1.80 ataques/s
- Exemplo no cap: base 1.0 + 150% AS → 1.0 × 2.50 = 2.50 ataques/s

### Advantage Duration (Duração de Vantagem)
```
finalAdvDur = baseDuration × (1 + min(advDurPct, 150) / 100)
```
- **Sem diminishing returns** — escala linear até o cap (igual a Attack Speed)
- **Hard cap: 150%**

### Stellarite (Pedras de Aprimoramento)
```
weaponAvgEff = ((weaponDmgMin + weaponDmgMax) / 2) × (1 + stellariteMult)
onde stellariteMult = 0.10 (comum) | 0.15 (rara) | 0.00 (nenhuma)
```
- Slots compartilhados — escolha uma ou nenhuma
- **Validado empiricamente:** sem stellarite = 939 dmg, com 15% = 1049 dmg
- Aplica sobre a média do dano base da arma antes de qualquer outro cálculo

### Species Damage Boost (Dano de Espécie)
```
speciesMult = 1 + speciesBoost / (speciesBoost + 1000)
```
- Stat flat (ex: 150.8) — NÃO é um percentual direto
- Usa a mesma estrutura do Skill Damage Boost — confirmado pela fórmula da planilha
- Aplicado como multiplicador sobre o dano já escalado pela skill
- Exemplo: speciesBoost=150.8 → 1 + 150.8/1150.8 = **×1.131**

### Skill Damage Boost (SDB)
```
sdbMult = 1 + SDB / (SDB + 1000)
```
- Exemplo: SDB=1031 → 1 + 1031/2031 = **×1.508**
- Aplicado separadamente do Species, ambos multiplicativos sobre o dano escalado

---

## Estrutura do Cálculo de Dano (Confirmada pela Planilha)

Fonte: fórmula J17 da planilha "Throne and Liberty Staff-Wand Invocator Damage Calculations by Aragon"

```
Variáveis de referência:
  weaponMin     = dano mínimo da arma
  weaponMax     = dano máximo da arma
  skillPct      = % de dano da skill (ex: 5.10 = 510%)
  bonusBaseDmg  = bônus flat da skill (coluna D da planilha, por skill)
  critChance    = 1 - 1/(1 + critStat/1000)   [D5 na planilha]
  heavyChance   = 1 - 1/(1 + heavyStat/1000)  [D6 na planilha]
  critDmgPct    = % de dano crítico (ex: 0.44 = 44%)
  monsterBonus  = bônus inerente da skill (decimal, ex: 1.2 = +120%)
  dmgBonus      = bônus condicional por skill (decimal, ex: 0.4 = +40%)
  dmgBoost      = bônus de item por elemento (decimal, ex: 0.05 = +5%)
  SDB           = Skill Damage Boost (stat flat)
  species       = Species Damage Boost (stat flat)
  bonusDamage   = true damage do personagem (flat, ex: 44)
  hits          = número de hits da skill
  baseCD        = cooldown base em segundos
  cdrPct        = cooldown speed %

--- FÓRMULA PRINCIPAL (skill ativa com CDR) ---

1. Calcular dano por hit para a porção NÃO-CRIT (usa média min+max):
   baseNonCrit = (weaponMin × skillPct + bonusBaseDmg
               + weaponMax × skillPct + bonusBaseDmg) / 2
              = weaponAvg × skillPct + bonusBaseDmg

2. Porção CRIT (usa MAX weapon):
   baseCrit = weaponMax × skillPct + bonusBaseDmg

3. Combinar crit / non-crit:
   dmgBase = baseNonCrit × (1 - critChance)
           + baseCrit    × (1 + critDmgPct) × critChance

4. Aplicar multiplicadores (todos multiplicativos):
   dmgMult = dmgBase
           × (1 + dmgBonus)    // condicional por skill
           × (1 + dmgBoost)    // item/elemento
           × (1 + monsterBonus) // inerente da skill
           × (1 + SDB     / (SDB     + 1000))
           × (1 + species / (species + 1000))

5. Adicionar true damage e aplicar heavy:
   dmgFinal = (dmgMult + bonusDamage) × (1 + heavyChance)
   // heavy assume +100% nos procs → fator esperado = (1 + heavyChance)

6. DPS:
   effectiveCD = baseCD / (1 + min(cdrPct, 120) / 100)
   DPS = dmgFinal × hits / effectiveCD

--- FÓRMULA DOT (sem CDR, resultado = dano total do DoT) ---

   dotDmgTotal = (weaponAvg × skillPct + bonusBaseDmg)
               × (1 + dmgBonus)
               × (1 + monsterBonus)
               × (1 + SDB     / (SDB     + 1000))
               × (1 + species / (species + 1000))
               × (1 + heavyChance)
               × ticks
               × (1 + critChance × critDmgPct)   // crit em DoT = modelo simplificado
   // DoTs não dividem por cooldown — J column é dano total, não DPS
```

### Notas importantes da planilha

- **bonusBaseDmg (coluna D)**: flat por skill, diferente do `bonusDamage` do personagem ($C$8)
  - Entra ANTES da skill % de forma efetiva: `weaponAvg × skillPct + bonusBaseDmg`
  - O true damage do personagem ($C$8) entra DEPOIS de todos os multiplicadores

- **Heavy attack model**: planilha usa `(1 + heavyChance)` assumindo heavy = +100% dano nos procs
  - heavyChance = `1 - 1/(1 + heavyStat/1000)` (mesma fórmula que crit, sem desconto de Endurance)

- **Manaball Eruption**: escala com Mana Regen — fórmula especial: `hits × (manaRegen × 0.00024 + 0.05)`

- **Vampiric Onslaught**: `(somaSkills) × 0.174` — 17.4% do dano total de outras skills

- **Weaken: Burning**: escalável por stacks (1-10), dano multiplica linearmente com stacks

---

## Notas de Validação Empírica

Para calibrar o modelo, registrar aqui resultados de testes no jogo:

| Data | Skill | Params | Calculado | Observado | Desvio |
|------|-------|--------|-----------|-----------|--------|
| - | - | - | - | - | - |

---

## Referências Adicionais

- Maxroll In-Depth Stats Guide: https://maxroll.gg/throne-and-liberty/resources/in-depth-stats-guide
- Fórmulas do engine atual: `src/engine/calculator.ts`
