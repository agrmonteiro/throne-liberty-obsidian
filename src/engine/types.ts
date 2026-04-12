// ─── Build stat model ─────────────────────────────────────────────────────────

export interface BuildStats {
  // Skill
  skillBaseDamagePct:   number  // e.g. 595
  skillBonusBaseDmg:    number  // e.g. 602
  // Weapon
  minWeaponDmg:         number
  maxWeaponDmg:         number
  // Offensive
  critHitChance:        number  // raw stat (not %)
  heavyAttackChance:    number  // raw stat (not %)
  heavyAttackDmgComp:   number  // complement over 100% base (e.g. 14 means game shows 114%)
  skillDmgBoost:        number
  monsterDmgBoostPct:   number
  dmgBuffPct:           number
  bonusDmg:             number
  critDmgPct:           number  // e.g. 50 means +50%
  speciesDmgBoost:      number
  // Target
  targetDefense:        number
  targetEvasion:        number
  targetEndurance:      number  // subtrai do crit/heavy stat antes do DR
}

export const DEFAULT_STATS: BuildStats = {
  skillBaseDamagePct:  595,
  skillBonusBaseDmg:   602,
  minWeaponDmg:        0,
  maxWeaponDmg:        0,
  critHitChance:       0,
  heavyAttackChance:   0,
  heavyAttackDmgComp:  0,
  skillDmgBoost:       0,
  monsterDmgBoostPct:  0,
  dmgBuffPct:          0,
  bonusDmg:            0,
  critDmgPct:          0,
  speciesDmgBoost:     0,
  targetDefense:       0,
  targetEvasion:       0,
  targetEndurance:     0,
}

// ─── Stored build model ───────────────────────────────────────────────────────

export interface Build {
  id:             string
  name:           string
  weaponCombo:    string
  stats:          BuildStats
  notes:          string
  importedAt:     string  // ISO date
  editedAt?:      string
  sourceUrl?:     string
  // All raw fields from the scraper (preserved for display + editing)
  rawAttributes?: Record<string, { total: number; display: string }>
  rawStats?:      Record<string, string>
}

export type BuildMap = Record<string, Build>

// ─── Calc result ──────────────────────────────────────────────────────────────

export interface DamageResult {
  avgDamage:      number
  minDamage:      number
  maxCritDamage:  number
  critChancePct:  number
  heavyChancePct: number
  missChancePct:  number
  gainPct:        number   // vs baseline (Build 1)
}

// ─── Sensitivity ──────────────────────────────────────────────────────────────

export interface SensitivityEntry {
  attr:     string
  label:    string
  weight:   number   // % contribution to DPS gain
  delta:    number   // the unit increment used
}

// ─── Elasticity ──────────────────────────────────────────────────────────────

export interface ElasticityPoint {
  iter:       number
  test:       string
  label:      string
  avgDamage:  number
  gainPct:    number
  newValue:   number
  stats:      BuildStats
}
