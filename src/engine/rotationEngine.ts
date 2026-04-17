/**
 * Rotation Engine — cálculo de DPS por skill e DoT
 *
 * Fórmulas derivadas da planilha "Staff-Wand Invocator Damage Calculations by Aragon"
 * e validadas contra STATS_REFERENCE.md
 *
 * Modelo de dano por skill:
 *   baseNonCrit = weaponAvg × skillDmgPct/100 + bonusBaseDmg   (usa média min+max)
 *   baseCrit    = weaponMax × skillDmgPct/100 + bonusBaseDmg   (crit usa MAX)
 *   dmgBase     = baseNonCrit×(1−critChance) + baseCrit×(1+critDmg%)×critChance
 *   dmgMult     = (1+dmgBonus)×(1+monsterBonus)×sdbMult×speciesMult×(1+dmgBoost)
 *   avgPerHit   = 4 cenários independentes (normal/crit/heavy/crit+heavy) + bonusDamage
 *   DPS         = avgPerHit × hits / finalCD
 */

import type {
  RotationCharacter,
  RotationSkill,
  RotationDot,
  Rotation,
  RotationResult,
  RotationSkillResult,
  RotationDotResult,
} from './types'

const DR = 1000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stellariteMult(s: string): number {
  if (s === 'common') return 0.10
  if (s === 'rare')   return 0.15
  return 0
}

/** Cooldown final após CDR com diminishing returns e cap 120% */
function applyCD(baseCD: number, cdrPct: number): number {
  const capped = Math.min(cdrPct, 120)
  return baseCD / (1 + capped / 100)
}

/** Média e máximo de dano da arma com stellarite (só arma principal recebe stellarite) */
function weaponStats(char: RotationCharacter, weapon: 'main' | 'off'): { avg: number; max: number } {
  if (weapon === 'main') {
    const mult = 1 + stellariteMult(char.stellarite)
    return {
      avg: ((char.weaponMainDmgMin + char.weaponMainDmgMax) / 2) * mult,
      max: char.weaponMainDmgMax * mult,
    }
  }
  return {
    avg: (char.weaponOffDmgMin + char.weaponOffDmgMax) / 2,
    max: char.weaponOffDmgMax,
  }
}

/** Multiplicadores globais do personagem (SDB + Species + dmgBoost) */
function charMultipliers(char: RotationCharacter): number {
  const sdbMult     = char.skillDmgBoost   > 0 ? 1 + char.skillDmgBoost   / (char.skillDmgBoost   + DR) : 1
  const speciesMult = char.speciesDmgBoost > 0 ? 1 + char.speciesDmgBoost / (char.speciesDmgBoost + DR) : 1
  return sdbMult * speciesMult * (1 + char.dmgBoost)
}

/** Crit e Heavy chances efetivos */
function chancesFromChar(char: RotationCharacter): {
  critChance: number
  heavyChance: number
  critDmgMult: number
  heavyMult: number
} {
  const critStat     = char.critChanceBase + char.critChanceBoss
  const heavyStat    = char.heavyChanceBase + char.heavyChanceBoss
  const effectiveCrit = Math.max(0, critStat - char.targetEndurance)

  return {
    critChance:  effectiveCrit > 0 ? effectiveCrit / (effectiveCrit + DR) : 0,
    heavyChance: heavyStat    > 0 ? heavyStat    / (heavyStat    + DR) : 0,
    critDmgMult: 1 + char.critDmgPct  / 100,
    heavyMult:   1 + char.heavyDmgPct / 100,
  }
}

// ─── Skill DPS ────────────────────────────────────────────────────────────────

export function calcSkillDps(skill: RotationSkill, char: RotationCharacter): number {
  if (!skill.enabled || skill.cooldown <= 0 || skill.hits <= 0) return 0

  const { avg: wAvg, max: wMax } = weaponStats(char, skill.weapon)
  const { critChance, heavyChance, critDmgMult, heavyMult } = chancesFromChar(char)
  const charMult = charMultipliers(char)

  const pct = skill.skillDmgPct / 100

  // Base de dano por hit: non-crit usa média, crit usa MAX (confirmado na planilha)
  const baseNonCrit = wAvg * pct + skill.bonusBaseDmg
  const baseCrit    = wMax * pct + skill.bonusBaseDmg

  // Multiplicadores de skill
  const skillMult = (1 + skill.dmgBonus) * (1 + skill.monsterBonus) * charMult

  // 4 cenários independentes
  const normalChance    = (1 - critChance) * (1 - heavyChance)
  const critOnlyChance  =      critChance  * (1 - heavyChance)
  const heavyOnlyChance = (1 - critChance) *      heavyChance
  const critHeavyChance =      critChance  *      heavyChance

  const avgPerHit =
    normalChance    * (baseNonCrit * skillMult) +
    critOnlyChance  * (baseCrit    * skillMult * critDmgMult) +
    heavyOnlyChance * (baseNonCrit * skillMult * heavyMult) +
    critHeavyChance * (baseCrit    * skillMult * critDmgMult * heavyMult) +
    char.bonusDamage  // true damage entra após todos os multiplicadores

  const dmgPerCast = Math.max(0, avgPerHit) * skill.hits
  const cd = applyCD(skill.cooldown, char.cdrPct)
  return dmgPerCast / cd
}

export function calcSkillDmgPerCast(skill: RotationSkill, char: RotationCharacter): number {
  if (!skill.enabled || skill.hits <= 0) return 0
  const cd = applyCD(skill.cooldown, char.cdrPct)
  return calcSkillDps(skill, char) * cd
}

// ─── DoT total damage ────────────────────────────────────────────────────────

export function calcDotResult(
  dot: RotationDot,
  char: RotationCharacter,
  simulationSeconds = 60,
): { totalDmg: number; dps: number } {
  if (!dot.enabled || dot.ticks <= 0) return { totalDmg: 0, dps: 0 }

  const { avg: wAvg } = weaponStats(char, dot.weapon)
  const { critChance, heavyChance, critDmgMult, heavyMult } = chancesFromChar(char)
  const charMult = charMultipliers(char)

  const pct = dot.skillDmgPct / 100
  const baseDmg = wAvg * pct + dot.bonusBaseDmg
  const skillMult = (1 + dot.dmgBonus) * (1 + dot.monsterBonus) * charMult

  // DoTs usam modelo simplificado de crit/heavy (sem split min/max)
  const dotDmgPerTick = baseDmg * skillMult
    * (1 + critChance  * (critDmgMult - 1))
    * (1 + heavyChance * (heavyMult   - 1))

  const dmgPerApplication = Math.max(0, dotDmgPerTick) * dot.ticks

  // Se cooldown > 0, conta quantas vezes o DoT é reaplicado em simulationSeconds
  let totalDmg: number
  if (dot.cooldown > 0) {
    const effectiveCD  = applyCD(dot.cooldown, char.cdrPct)
    const applications = Math.max(1, Math.floor(simulationSeconds / effectiveCD))
    totalDmg = dmgPerApplication * applications
  } else {
    totalDmg = dmgPerApplication
  }

  const dps = simulationSeconds > 0 ? totalDmg / simulationSeconds : 0
  return { totalDmg, dps }
}

// ─── Rotation result ─────────────────────────────────────────────────────────

export function calcRotationResult(rotation: Rotation, simulationSeconds = 60): RotationResult {
  const char = rotation.character

  const skillResults: RotationSkillResult[] = rotation.skills
    .filter(s => s.enabled)
    .map(s => {
      const dps = calcSkillDps(s, char)
      const cd  = applyCD(s.cooldown, char.cdrPct)
      return {
        skillId:     s.id,
        skillName:   s.skillName,
        dps,
        dmgPerCast:  Math.max(0, dps * cd),
        castsPerMin: cd > 0 ? simulationSeconds / cd : 0,
        pctOfTotal:  0,
      }
    })

  const dotResults: RotationDotResult[] = rotation.dots
    .filter(d => d.enabled)
    .map(d => {
      const { totalDmg, dps } = calcDotResult(d, char, simulationSeconds)
      return { dotId: d.id, dotName: d.dotName, dps, totalDmg, pctOfTotal: 0 }
    })

  const totalDps = skillResults.reduce((s, r) => s + r.dps, 0)
               + dotResults.reduce((s, r) => s + r.dps, 0)

  skillResults.forEach(r => { r.pctOfTotal = totalDps > 0 ? (r.dps / totalDps) * 100 : 0 })
  dotResults.forEach(r =>   { r.pctOfTotal = totalDps > 0 ? (r.dps / totalDps) * 100 : 0 })

  return { totalDps, skillResults, dotResults }
}

// ─── CDR display helper ───────────────────────────────────────────────────────

export function effectiveCDRPct(cdrPct: number): number {
  const capped = Math.min(cdrPct, 120)
  return (1 - 1 / (1 + capped / 100)) * 100
}
