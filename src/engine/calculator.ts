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

/** Cast time efetivo após redução pelo Attack Speed (cap 150%) */
export function effectiveCastTime(baseCastTime: number, attackSpeedPct: number): number {
  const capped = Math.min(attackSpeedPct, 150)
  return baseCastTime / (1 + capped / 100)
}

/** Cooldown efetivo após CDR com cap 120% */
export function effectiveCooldown(baseCooldown: number, cdrPct: number): number {
  const capped = Math.min(cdrPct, 120)
  return baseCooldown / (1 + capped / 100)
}

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
// Fórmulas Maxroll/Reddit: ((Weapon * Skill%) + FlatSkillBonus)

function baseSkillDamage(weapon: number, stats: BuildStats): number {
  return (weapon * (stats.skillBaseDamagePct / 100)) + stats.skillBonusBaseDmg
}

// ─── Full average DPS ─────────────────────────────────────────────────────────
// Fórmula Oficial: ( (Base Damage * [Multipliers]) * Heavy Attack ) + Bonus Damage - Damage Reduction

export function calcAverageDPS(stats: BuildStats): number {
  const critChance  = critChanceFromStat(stats.critHitChance + (stats.bossCritChance ?? 0), stats.targetEndurance)
  const heavyChance = heavyChanceFromStat(stats.heavyAttackChance + (stats.bossHeavyChance ?? 0))

  // 1. Hit Normal vs Hit Crítico exigem bases diferentes:
  //    Hit Crítico usa SEMPRE Max Weapon Damage.
  //    Hit Normal usa a média de (Min + Max).
  const avgWeapon = (stats.minWeaponDmg + stats.maxWeaponDmg) / 2
  const baseNormal = baseSkillDamage(avgWeapon, stats)
  const baseCrit   = baseSkillDamage(stats.maxWeaponDmg, stats)

  // 2. Agrupar os Multiplicadores (Defense, SDB, Species, PvE, DmgBuff)
  const defReduction = stats.targetDefense > 0 ? stats.targetDefense / (stats.targetDefense + 2500) : 0
  const defMult      = 1 - defReduction
  
  const sdbMult      = stats.skillDmgBoost > 0 ? 1 + stats.skillDmgBoost / (stats.skillDmgBoost + DR) : 1
  const speciesMult  = 1 + stats.speciesDmgBoost / (stats.speciesDmgBoost + DR)
  const monsterMult  = 1 + stats.monsterDmgBoostPct / 100
  const dmgBuff      = 1 + stats.dmgBuffPct / 100

  // Multiplicador Global
  const baseMult = defMult * sdbMult * speciesMult * monsterMult * dmgBuff

  // Multiplicadores adicionais por condição
  const critDmgMult = 1 + stats.critDmgPct / 100
  const heavyMult   = 2.0 + stats.heavyAttackDmgComp / 100

  // 3. Os Quatro Cenários possíveis
  // Cenário 1: Hit Normal
  const dmgNormal = baseNormal * baseMult
  
  // Cenário 2: Crítico puro
  const dmgCrit = baseCrit * baseMult * critDmgMult
  
  // Cenário 3: Heavy puro
  const dmgHeavy = baseNormal * baseMult * heavyMult
  
  // Cenário 4: Crit + Heavy SIMULTÂNEOS
  const dmgCritHeavy = baseCrit * baseMult * critDmgMult * heavyMult

  // 4. Probabilidades Independentes
  const normalChance    = (1 - critChance) * (1 - heavyChance)
  const critOnlyChance  = critChance        * (1 - heavyChance)
  const heavyOnlyChance = (1 - critChance)  * heavyChance
  const critHeavyChance = critChance        * heavyChance

  const avgPreBonus = normalChance    * dmgNormal +
                      critOnlyChance  * dmgCrit +
                      heavyOnlyChance * dmgHeavy +
                      critHeavyChance * dmgCritHeavy

  // 5. Bonus Damage é adicionado pós-cálculo de todos os multiplicadores (e do Heavy Attack)
  const finalDamage = Math.max(0, avgPreBonus + stats.bonusDmg)
  return finalDamage
}

// ─── Min / Max single-hit values ─────────────────────────────────────────────

export function calcModifiers(stats: BuildStats): { minBase: number; maxCrit: number } {
  const defReduction = stats.targetDefense > 0 ? stats.targetDefense / (stats.targetDefense + 2500) : 0
  const baseMult = (1 - defReduction) 
                 * (stats.skillDmgBoost > 0 ? 1 + stats.skillDmgBoost / (stats.skillDmgBoost + DR) : 1)
                 * (1 + stats.speciesDmgBoost / (stats.speciesDmgBoost + DR))
                 * (1 + stats.monsterDmgBoostPct / 100)
                 * (1 + stats.dmgBuffPct / 100)
  
  const minHitBase = baseSkillDamage(stats.minWeaponDmg, stats)
  const maxHitBase = baseSkillDamage(stats.maxWeaponDmg, stats)
  
  const minHit = (minHitBase * baseMult) + stats.bonusDmg
  const maxCrit = (maxHitBase * baseMult * (1 + stats.critDmgPct / 100)) + stats.bonusDmg
  
  return { minBase: Math.max(0, minHit), maxCrit: Math.max(0, maxCrit) }
}

// ─── True DPS (por ciclo de skill) ───────────────────────────────────────────
// DPS real = avgDamage / max(castEfetivo, CDEfetivo)

export function calcTrueDps(stats: BuildStats): number {
  const avg       = calcAverageDPS(stats)
  const castEf    = effectiveCastTime(stats.skillCastTime ?? 2,  stats.attackSpeedPct ?? 0)
  const cdEf      = effectiveCooldown(stats.skillCooldown  ?? 12, stats.cdrPct        ?? 0)
  const cycleTime = Math.max(castEf, cdEf)
  return cycleTime > 0 ? avg / cycleTime : 0
}

// ─── Full result ──────────────────────────────────────────────────────────────

export function calcResult(stats: BuildStats, baselineAvg: number): DamageResult {
  const totalCrit  = stats.critHitChance  + (stats.bossCritChance  ?? 0)
  const totalHeavy = stats.heavyAttackChance + (stats.bossHeavyChance ?? 0)
  const critChancePct  = critChanceFromStat(totalCrit, stats.targetEndurance) * 100
  const heavyChancePct = heavyChanceFromStat(totalHeavy) * 100
  const { minBase, maxCrit } = calcModifiers(stats)

  const tgtEv  = stats.targetEvasion
  const missChancePct = tgtEv > 0
    ? Math.max(0, Math.min(95, (tgtEv / (tgtEv + Math.max(1, totalCrit))) * 100))
    : 0

  const avgDamage = calcAverageDPS(stats)
  const gainPct = baselineAvg > 0 ? ((avgDamage - baselineAvg) / baselineAvg) * 100 : 0

  // ── Dano em 60s ──────────────────────────────────────────────────────────
  const castEfetivo = effectiveCastTime(stats.skillCastTime ?? 2, stats.attackSpeedPct ?? 0)
  const cdEfetivo   = effectiveCooldown(stats.skillCooldown ?? 12, stats.cdrPct ?? 0)
  const cycleTime   = Math.max(castEfetivo, cdEfetivo)
  const casts60s    = cycleTime > 0 ? 60 / cycleTime : 0
  const totalDmg60s = casts60s * avgDamage
  const trueDps     = cycleTime > 0 ? avgDamage / cycleTime : 0

  return {
    avgDamage,
    minDamage:     minBase,
    maxCritDamage: maxCrit,
    critChancePct,
    heavyChancePct,
    missChancePct,
    gainPct,
    cycleTime,
    casts60s,
    totalDmg60s,
    trueDps,
  }
}

// ─── Sensitivity (weight) ────────────────────────────────────────────────────

const SENSITIVITY_DELTAS: Array<[keyof BuildStats, string, number]> = [
  ['critHitChance',       'Chance de Acerto Crítico',      100],
  ['critDmgPct',          'Dano Crítico %',                  1],
  ['heavyAttackChance',   'Chance de Ataque Pesado',        100],
  ['heavyAttackDmgComp',  'Dano de Ataque Pesado',           1],
  ['skillDmgBoost',       'Ampliação de Dano de Habilidade',100],
  ['bonusDmg',            'Bônus de Dano',                  10],
  ['speciesDmgBoost',     'Bônus por Espécie',              10],
  ['maxWeaponDmg',        'Dano Máximo da Arma',            10],
  ['cdrPct',              'Velocidade de Recarga %',         1],
  ['attackSpeedPct',      'Velocidade de Ataque %',          1],
]

export function calcSensitivity(stats: BuildStats): SensitivityEntry[] {
  const baseDmg = calcTrueDps(stats)
  if (baseDmg <= 0) return SENSITIVITY_DELTAS.map(([attr, label, delta]) => ({ attr, label, weight: 0, delta }))

  const raw = SENSITIVITY_DELTAS.map(([attr, label, delta]) => {
    const variant = { ...stats, [attr]: (stats[attr] as number) + delta }
    const newDmg  = calcTrueDps(variant)
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

export type ElasticityTest = {
  key:       string
  label:     string
  run:       (base: BuildStats, i: number) => BuildStats
  stopWhen?: (base: BuildStats, i: number) => boolean
}

const ELASTICITY_TESTS: ElasticityTest[] = [
  {
    key:   'crit_chance',
    label: 'Chance de Acerto Crítico (+100/iter)',
    run:   (b, i) => ({ ...b, critHitChance: b.critHitChance + 100 * i }),
  },
  {
    key:   'heavy_chance',
    label: 'Chance de Ataque Pesado (+100/iter)',
    run:   (b, i) => ({ ...b, heavyAttackChance: b.heavyAttackChance + 100 * i }),
  },
  {
    key:   'max_weapon',
    label: 'Dano Máximo de Arma (+10/iter)',
    run:   (b, i) => ({ ...b, maxWeaponDmg: b.maxWeaponDmg + 10 * i }),
  },
  {
    key:   'skill_boost',
    label: 'Ampliação de Dano de Habilidade (+50/iter)',
    run:   (b, i) => ({ ...b, skillDmgBoost: b.skillDmgBoost + 50 * i }),
  },
  {
    key:   'crit_over_heavy',
    label: 'Crítico > Pesado (permuta)',
    run:   (b, i) => ({
      ...b,
      critHitChance:      Math.max(0, b.critHitChance + 100 * i),
      heavyAttackChance:  Math.max(0, b.heavyAttackChance - 100 * i),
    }),
  },
  {
    key:   'heavy_over_crit',
    label: 'Pesado > Crítico (permuta)',
    run:   (b, i) => ({
      ...b,
      heavyAttackChance:  Math.max(0, b.heavyAttackChance + 100 * i),
      critHitChance:      Math.max(0, b.critHitChance - 100 * i),
    }),
  },
]

export function calcElasticity(stats: BuildStats, iterations: number, tests: ElasticityTest[] = ELASTICITY_TESTS): ElasticityPoint[] {
  const baseDmg  = calcTrueDps(stats)
  const rows: ElasticityPoint[] = []
  const stopped = new Set<string>()
  for (let i = 0; i <= Math.max(1, iterations); i++) {
    for (const test of tests) {
      if (stopped.has(test.key)) continue
      if (test.stopWhen?.(stats, i)) { stopped.add(test.key); continue }
      const variant = test.run(stats, i)
      const avg     = calcTrueDps(variant)
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
