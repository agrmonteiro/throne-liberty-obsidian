/**
 * Throne & Liberty Damage Engine — TypeScript
 * Port fiel das fórmulas Python (Maxroll / DamageCalculatorFixed).
 *
 * Fórmulas de referência:
 *   Crit chance  = (stat - targetEndurance) / (stat - targetEndurance + 1000) → [0,1]
 *   Heavy chance = stat / (stat + 1000)   → sem endurance, fórmula simples
 *   Skill damage = (weaponBase × skill% / 100) + skillFlat
 *   skillDmgBoost e bonusDmg são dividores com DR: boost / (boost + 1000)
 *   Dano médio   = baseDmg × (1 + critChance × critDmgMult)
 *                         × (1 + heavyChance × heavyMult)
 *                         × monsterBoostMult × dmgBuffMult
 */

import type {
  BuildStats,
  DamageResult,
  SensitivityEntry,
  ElasticityPoint,
} from './types'

const DR = 1000   // divisor padrão de diminishing returns

// ─── Core probability formulas ────────────────────────────────────────────────

export function critChanceFromStat(stat: number, endurance = 0): number {
  const effective = stat - endurance
  if (effective <= 0) return 0
  return effective / (effective + DR)   // [0, 1]
}

export function heavyChanceFromStat(stat: number): number {
  if (stat <= 0) return 0
  return stat / (stat + DR)   // sem endurance — fórmula simples
}

// ─── Base skill damage (before multipliers) ───────────────────────────────────

function baseSkillDamage(stats: BuildStats, useMin: boolean): number {
  const weapon = useMin ? stats.minWeaponDmg : stats.maxWeaponDmg
  return (weapon * (stats.skillBaseDamagePct / 100)) + stats.skillBonusBaseDmg
}

// ─── Multipliers with diminishing returns ────────────────────────────────────

function skillBoostMultiplier(boost: number): number {
  // Additive inside base, then multiplied: same divisor DR
  if (boost <= 0) return 1
  return 1 + boost / DR
}

function bonusDmgMultiplier(bonus: number): number {
  if (bonus <= 0) return 1
  return 1 + bonus / DR
}

function speciesBoostMultiplier(boost: number): number {
  if (boost <= 0) return 1
  return 1 + boost / DR
}

// ─── Full average DPS ─────────────────────────────────────────────────────────

export function calcAverageDPS(stats: BuildStats): number {
  const critChance  = critChanceFromStat(stats.critHitChance, stats.targetEndurance)
  const heavyChance = heavyChanceFromStat(stats.heavyAttackChance)

  // Average base (between min and max weapon)
  const minBase = baseSkillDamage(stats, true)
  const maxBase = baseSkillDamage(stats, false)
  const avgBase = (minBase + maxBase) / 2

  // Skill damage boost multiplier (DR)
  const skillBoost = skillBoostMultiplier(stats.skillDmgBoost)

  // Bonus / species (DR)
  const bonusMult   = bonusDmgMultiplier(stats.bonusDmg)
  const speciesMult = speciesBoostMultiplier(stats.speciesDmgBoost)

  // Flat % buffs (no DR)
  const monsterMult = 1 + stats.monsterDmgBoostPct / 100
  const dmgBuff     = 1 + stats.dmgBuffPct / 100

  // Critical damage multiplier (+100% base crit is already baked in)
  const critMult  = stats.critDmgPct / 100  // extra on top of the 1.0 base crit

  // Heavy damage: base heavy adds +100%; complement adds extra
  // total heavy multiplier = 1 + 1.0 + heavyComp/100 = 2 + heavyComp/100
  const heavyMult = 1 + (1.0 + stats.heavyAttackDmgComp / 100)

  // Compose damage
  const baseDmg = avgBase * skillBoost * bonusMult * speciesMult * monsterMult * dmgBuff

  // Expected value with crit and heavy
  //  E = baseDmg × (normalHits + critHits + heavyHits)
  //  where P(normal) = 1 - critChance - heavyChance (clamped)
  const totalEventChance = Math.min(critChance + heavyChance, 0.999)
  const normalPct = 1 - totalEventChance
  const critPct   = critChance
  const heavyPct  = heavyChance

  const normalDmg = baseDmg
  const critDmgAbs   = baseDmg * (1 + critMult)
  const heavyDmgAbs  = baseDmg * heavyMult

  return normalPct * normalDmg + critPct * critDmgAbs + heavyPct * heavyDmgAbs
}

// ─── Min / Max single-hit values ─────────────────────────────────────────────

export function calcModifiers(stats: BuildStats): { minBase: number; maxCrit: number } {
  const minBase = baseSkillDamage(stats, true)
  const maxBase = baseSkillDamage(stats, false)
  const maxCrit = maxBase * (1 + stats.critDmgPct / 100)
  return { minBase, maxCrit }
}

// ─── Full result ──────────────────────────────────────────────────────────────

export function calcResult(stats: BuildStats, baselineAvg: number): DamageResult {
  const critChancePct  = critChanceFromStat(stats.critHitChance, stats.targetEndurance) * 100
  const heavyChancePct = heavyChanceFromStat(stats.heavyAttackChance) * 100
  const { minBase, maxCrit } = calcModifiers(stats)

  const tgtEv  = stats.targetEvasion
  const missChancePct = tgtEv > 0
    ? Math.max(0, Math.min(95, (tgtEv / (tgtEv + Math.max(1, stats.critHitChance))) * 100))
    : 0

  const avgDamage = calcAverageDPS(stats)
  const gainPct = baselineAvg > 0 ? ((avgDamage - baselineAvg) / baselineAvg) * 100 : 0

  return {
    avgDamage,
    minDamage:     minBase,
    maxCritDamage: maxCrit,
    critChancePct,
    heavyChancePct,
    missChancePct,
    gainPct,
  }
}

// ─── Sensitivity (weight) ────────────────────────────────────────────────────

const SENSITIVITY_DELTAS: Array<[keyof BuildStats, string, number]> = [
  ['critHitChance',       'Crit Hit Chance',       100],
  ['critDmgPct',          'Crit Damage %',          1],
  ['heavyAttackChance',   'Heavy Attack Chance',    100],
  ['heavyAttackDmgComp',  'Heavy Damage Compl.',    1],
  ['skillDmgBoost',       'Skill Dmg Boost',        100],
  ['bonusDmg',            'Bonus Damage',           10],
  ['speciesDmgBoost',     'Species Dmg Boost',      10],
]

export function calcSensitivity(stats: BuildStats): SensitivityEntry[] {
  const baseDmg = calcAverageDPS(stats)
  if (baseDmg <= 0) return SENSITIVITY_DELTAS.map(([attr, label, delta]) => ({ attr, label, weight: 0, delta }))

  const raw = SENSITIVITY_DELTAS.map(([attr, label, delta]) => {
    const variant = { ...stats, [attr]: (stats[attr] as number) + delta }
    const newDmg  = calcAverageDPS(variant)
    const sens    = Math.abs((newDmg - baseDmg) / delta)
    return { attr, label, sens, delta }
  })

  const total = raw.reduce((s, r) => s + r.sens, 0) || 1
  return raw.map(({ attr, label, sens, delta }) => ({
    attr,
    label,
    weight: (sens / total) * 100,
    delta,
  })).sort((a, b) => b.weight - a.weight)
}

// ─── Elasticity ───────────────────────────────────────────────────────────────

type ElasticityTest = {
  key:   string
  label: string
  run:   (base: BuildStats, i: number) => BuildStats
}

const ELASTICITY_TESTS: ElasticityTest[] = [
  {
    key:   'crit_chance',
    label: 'Crit Chance (+100/iter)',
    run:   (b, i) => ({ ...b, critHitChance: b.critHitChance + 100 * i }),
  },
  {
    key:   'heavy_chance',
    label: 'Heavy Chance (+100/iter)',
    run:   (b, i) => ({ ...b, heavyAttackChance: b.heavyAttackChance + 100 * i }),
  },
  {
    key:   'max_weapon',
    label: 'Max Weapon Dmg (+10/iter)',
    run:   (b, i) => ({ ...b, maxWeaponDmg: b.maxWeaponDmg + 10 * i }),
  },
  {
    key:   'skill_boost',
    label: 'Skill Dmg Boost (+50/iter)',
    run:   (b, i) => ({ ...b, skillDmgBoost: b.skillDmgBoost + 50 * i }),
  },
  {
    key:   'crit_over_heavy',
    label: 'Crit > Heavy (swap)',
    run:   (b, i) => ({
      ...b,
      critHitChance:      Math.max(0, b.critHitChance + 100 * i),
      heavyAttackChance:  Math.max(0, b.heavyAttackChance - 100 * i),
    }),
  },
  {
    key:   'heavy_over_crit',
    label: 'Heavy > Crit (swap)',
    run:   (b, i) => ({
      ...b,
      heavyAttackChance:  Math.max(0, b.heavyAttackChance + 100 * i),
      critHitChance:      Math.max(0, b.critHitChance - 100 * i),
    }),
  },
]

export function calcElasticity(stats: BuildStats, iterations: number): ElasticityPoint[] {
  const baseDmg  = calcAverageDPS(stats)
  const rows: ElasticityPoint[] = []
  for (let i = 0; i <= Math.max(1, iterations); i++) {
    for (const test of ELASTICITY_TESTS) {
      const variant = test.run(stats, i)
      const avg     = calcAverageDPS(variant)
      const gainPct = baseDmg > 0 ? ((avg - baseDmg) / baseDmg) * 100 : 0
      rows.push({
        iter:      i,
        test:      test.key,
        label:     test.label,
        avgDamage: avg,
        gainPct,
        newValue:  i,
        stats:     variant,
      })
    }
  }
  return rows
}
