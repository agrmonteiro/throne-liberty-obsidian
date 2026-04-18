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
  bossCritChance:       number  // added to critHitChance before DR
  bossHeavyChance:      number  // added to heavyAttackChance before DR
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
  bossCritChance:      0,
  bossHeavyChance:     0,
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
  screenshotFile?: string  // filename inside data dir (e.g. "build_xxx_screenshot.png")
  // All raw fields from the scraper (preserved for display + editing)
  rawAttributes?: Record<string, { total: number; display: string }>
  rawStats?:      Record<string, string>
}

export type BuildMap = Record<string, Build>

// ─── Rotation types ───────────────────────────────────────────────────────────

export type Stellarite = 'none' | 'common' | 'rare'
export type SkillWeapon = 'main' | 'off'

export interface RotationCharacter {
  // Main weapon (contribui com auto-attack)
  weaponMainType:            string
  weaponMainDmgMin:          number
  weaponMainDmgMax:          number
  weaponMainAttackSpeedBase: number

  // Off weapon (skills apenas)
  weaponOffType:   string
  weaponOffDmgMin: number
  weaponOffDmgMax: number

  // Stellarite (slot único)
  stellarite: Stellarite

  // Stats com hard cap
  cdrPct:         number   // cooldown reduction % (cap 120, diminishing returns)
  attackSpeedPct: number   // attack speed % adicional (cap 150, linear)
  advDurPct:      number   // advantage duration % (cap 150, linear)

  // Crit
  critChanceBase:  number  // stat raw
  critChanceBoss:  number  // aditivo vs chefe (mesmo slot de cálculo)
  critDmgPct:      number  // % de dano crítico (ex: 44 = +44%)

  // Heavy
  heavyChanceBase: number  // stat raw (sem desconto de Endurance)
  heavyChanceBoss: number  // aditivo vs chefe
  heavyDmgPct:     number  // % de dano pesado (ex: 100 = 2x, 114 = 2.14x)

  // Boosts globais
  skillDmgBoost:   number  // SDB stat flat → fórmula: 1 + SDB/(SDB+1000)
  speciesDmgBoost: number  // Species stat flat → mesma fórmula
  bonusDamage:     number  // true damage flat (entra após todos os mults)
  dmgBoost:        number  // % de item/elemento (decimal: 0.05 = +5%)

  // Alvo
  targetDefense:   number
  targetEndurance: number
}

export const DEFAULT_ROTATION_CHARACTER: RotationCharacter = {
  weaponMainType: 'Staff', weaponMainDmgMin: 0, weaponMainDmgMax: 0, weaponMainAttackSpeedBase: 0,
  weaponOffType: 'Wand',   weaponOffDmgMin: 0,  weaponOffDmgMax: 0,
  stellarite: 'none',
  cdrPct: 0, attackSpeedPct: 0, advDurPct: 0,
  critChanceBase: 0, critChanceBoss: 0, critDmgPct: 100,
  heavyChanceBase: 0, heavyChanceBoss: 0, heavyDmgPct: 100,
  skillDmgBoost: 0, speciesDmgBoost: 0, bonusDamage: 0, dmgBoost: 0,
  targetDefense: 0, targetEndurance: 0,
}

export interface RotationSkill {
  id:           string
  skillName:    string
  weapon:       SkillWeapon
  castTime:     number   // segundos
  cooldown:     number   // segundos
  skillDmgPct:  number   // ex: 510 para 510%
  bonusBaseDmg: number   // flat adicionado antes da skill% (coluna D da planilha)
  hits:         number
  monsterBonus: number   // decimal: 1.2 = +120%
  dmgBonus:     number   // condicional decimal: 0.4 = +40%
  enabled:      boolean
}

export interface RotationDot {
  id:           string
  dotName:      string
  weapon:       SkillWeapon
  castTime:     number   // tempo de cast da skill que aplica o DoT (segundos)
  cooldown:     number   // cooldown base em segundos (0 = não reaplicar)
  skillDmgPct:  number
  bonusBaseDmg: number
  ticks:        number
  monsterBonus: number
  dmgBonus:     number
  enabled:      boolean
}

export type BuffType = 'dmg' | 'crit' | 'as' | 'adv' | 'utility'

export interface RotationBuff {
  id:        string
  buffName:  string
  buffType:  BuffType
  value:     number   // valor flat (stat, dano fixo, etc.)
  valuePct:  number   // valor percentual (ex: 10 = +10%)
  duration:  number   // segundos
  cooldown:  number   // segundos base
  enabled:   boolean
}

export interface CastEvent {
  id:       string
  itemId:   string
  itemType: 'skill' | 'dot' | 'buff'
  castAt:   number   // segundos (múltiplo de 0.5)
}

export interface RotationRule {
  id:        string
  triggerId: string   // id de skill | dot | buff
  effectId:  string   // id de skill | dot | buff
}

export interface Rotation {
  id:                    string
  name:                  string
  character:             RotationCharacter
  skills:                RotationSkill[]
  dots:                  RotationDot[]
  buffs:                 RotationBuff[]
  rules:                 RotationRule[]
  timeline:              CastEvent[]
  createdAt:             string
  editedAt?:             string
  importedFromBuildId?:  string
}

export type RotationMap = Record<string, Rotation>

export interface RotationSkillResult {
  skillId:     string
  skillName:   string
  dps:         number
  dmgPerCast:  number
  castsPerMin: number
  pctOfTotal:  number
}

export interface RotationDotResult {
  dotId:      string
  dotName:    string
  dps:        number
  totalDmg:   number
  pctOfTotal: number
}

export interface RotationResult {
  totalDps:     number
  skillResults: RotationSkillResult[]
  dotResults:   RotationDotResult[]
}

// ─── Equipment & Mastery models ───────────────────────────────────────────────

export type ItemSlot =
  | 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'cloak'
  | 'necklace' | 'bracelet' | 'ring1' | 'ring2'
  | 'weapon_main' | 'weapon_off'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Stats que um item pode contribuir (subconjunto relevante para DPS) */
export interface ItemStats {
  critHitChance?:       number   // stat flat
  heavyAttackChance?:   number
  critDmgPct?:          number
  heavyAttackDmgComp?:  number
  skillDmgBoost?:       number
  speciesDmgBoost?:     number
  bonusDmg?:            number
  attackSpeedPct?:      number
  cdrPct?:              number
  weaponDmgMin?:        number
  weaponDmgMax?:        number
}

/** Um item equipado com seus stats e poderes */
export interface EquippedItem {
  id:          string
  name:        string
  slot:        ItemSlot
  rarity:      ItemRarity
  level:       number
  stats:       ItemStats
  /** Poderes/efeitos do item em texto livre (para display) */
  powers?:     string[]
  /** Fonte: importado do quest log (url) ou cadastrado manualmente */
  sourceUrl?:  string
  importedAt?: string
}

/** Uma maestria (passiva de arma) */
export interface Mastery {
  id:       string
  name:     string
  weapon:   string   // ex: 'Staff', 'Wand', 'Longbow', etc.
  rank:     number   // 1-5
  /** Efeito em stats */
  stats?:   ItemStats
  /** Descrição do efeito passivo */
  effect?:  string
}

/** Snapshot de equipamentos + maestrias de uma build/rotação */
export interface GearSnapshot {
  items:     EquippedItem[]
  masteries: Mastery[]
}

/**
 * Resultado da análise de upgrade: qual item melhora mais o DPS.
 * Produzido pelo scorer de equipamentos.
 */
export interface ItemUpgradeSuggestion {
  item:        EquippedItem
  slot:        ItemSlot
  dpsDelta:    number   // DPS ganho ao equipar este item
  scorePts:    number   // pontuação ponderada por stat
  reason:      string   // texto explicativo
}

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
