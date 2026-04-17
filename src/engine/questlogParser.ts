import type { Build, BuildStats } from './types'
import { DEFAULT_STATS } from './types'

// ─── Raw API types ─────────────────────────────────────────────────────────────

interface RawStatEntry {
  value?:          number | string | null
  display?:        string | null
  selected_value?: number | string | null
  derived_percent?: number | null
}

export interface QuestlogApiResult {
  character_name:  string
  weapon_types:    string[]
  build_name:      string
  source_build_id: number | null
  url:             string
  attributes:      Record<string, unknown>
  stats:           Record<string, RawStatEntry | string | number | null>
  items:           unknown[]
  error?:          string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numVal(entry: RawStatEntry | string | number | null | undefined, fallback = 0): number {
  if (entry == null) return fallback
  if (typeof entry === 'number') return entry
  if (typeof entry === 'string') return parseFloat(entry.replace(/[^0-9.-]/g, '')) || fallback
  // object: prefer selected_value for range stats, then value
  const v = entry.value ?? entry.selected_value
  if (v == null) return fallback
  if (typeof v === 'number') return v
  return parseFloat(String(v).replace(/[^0-9.-]/g, '')) || fallback
}

function minVal(entry: RawStatEntry | string | number | null | undefined, fallback = 0): number {
  if (entry == null || typeof entry !== 'object') return numVal(entry, fallback)
  const v = entry.value
  if (v == null) return fallback
  if (typeof v === 'number') return v
  return parseFloat(String(v).replace(/[^0-9.-]/g, '')) || fallback
}

function maxVal(entry: RawStatEntry | string | number | null | undefined, fallback = 0): number {
  if (entry == null || typeof entry !== 'object') return numVal(entry, fallback)
  // selected_value = max for range stats like Max Damage
  const sv = entry.selected_value
  if (sv != null) {
    if (typeof sv === 'number') return sv
    return parseFloat(String(sv).replace(/[^0-9.-]/g, '')) || fallback
  }
  return minVal(entry, fallback)
}

function pick(
  stats: Record<string, RawStatEntry | string | number | null>,
  ...keys: string[]
): RawStatEntry | string | number | null | undefined {
  for (const k of keys) {
    if (k in stats) return stats[k]
  }
  return undefined
}

/** Convert a raw tRPC stat entry to a display string */
function entryToString(entry: RawStatEntry | string | number | null | undefined): string {
  if (entry == null) return ''
  if (typeof entry === 'number') return String(entry)
  if (typeof entry === 'string') return entry
  // Object entry — prefer display string, else build from value / range
  if (entry.display) return entry.display
  const min = entry.value
  const max = entry.selected_value
  if (min != null && max != null && min !== max) {
    return `${min} ~ ${max}`
  }
  if (min != null) return String(min)
  return ''
}

function newId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseQuestlogResult(raw: QuestlogApiResult): Build {
  const s = raw.stats ?? {}

  // Weapon damage range — "Max Damage": value=min, selected_value=max
  const maxDmgEntry = pick(s, 'Max Damage')
  const minWeaponDmg = minVal(maxDmgEntry)
  const maxWeaponDmg = maxVal(maxDmgEntry) || minWeaponDmg

  // Crit hit chance — prefer Magic, fallback Melee, fallback Ranged
  const critHitChance = numVal(
    pick(s, 'Magic Critical Hit Chance', 'Melee Critical Hit Chance', 'Ranged Critical Hit Chance')
  )

  // Heavy attack chance — prefer Magic, fallback Melee, fallback Ranged
  const heavyAttackChance = numVal(
    pick(s, 'Magic Heavy Attack Chance', 'Melee Heavy Attack Chance', 'Ranged Heavy Attack Chance')
  )

  // Heavy attack damage complement over 100%
  const heavyEntry = pick(s, 'Heavy Attack Damage', 'Heavy Damage')
  let heavyAttackDmgComp = 0
  if (heavyEntry !== undefined) {
    const rawHeavy = numVal(heavyEntry)
    heavyAttackDmgComp = Math.max(0, rawHeavy > 100 ? rawHeavy - 100 : rawHeavy)
  }

  const skillDmgBoost = numVal(pick(s, 'Skill Damage Boost'))
  const bonusDmg = numVal(pick(s, 'Bonus Damage'))
  const critDmgPct = numVal(pick(s, 'Critical Damage'))

  const speciesKeys = [
    'Species Damage Boost', 'Demon Damage Boost', 'Wildkin Damage Boost',
    'Undead Damage Boost', 'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
  ]
  const speciesDmgBoost = speciesKeys.reduce((acc, k) => {
    const v = numVal(pick(s, k))
    return v > acc ? v : acc
  }, 0)

  const stats: BuildStats = {
    ...DEFAULT_STATS,
    minWeaponDmg,
    maxWeaponDmg,
    critHitChance,
    heavyAttackChance,
    heavyAttackDmgComp,
    skillDmgBoost,
    bonusDmg,
    critDmgPct,
    speciesDmgBoost,
  }

  // ── Preserve all raw stats as display strings ──────────────────────────────
  const rawStats: Record<string, string> = {}
  for (const [key, entry] of Object.entries(s)) {
    const str = entryToString(entry)
    if (str) rawStats[key] = str
  }

  // ── Preserve all raw attributes ────────────────────────────────────────────
  const rawAttributes: Record<string, { total: number; display: string }> = {}
  for (const [key, entry] of Object.entries(raw.attributes ?? {})) {
    if (entry == null) continue
    if (typeof entry === 'object') {
      const obj = entry as Record<string, unknown>
      const total = parseFloat(String(obj.value ?? obj.total ?? 0)) || 0
      const display = String(obj.display ?? obj.value ?? total)
      rawAttributes[key] = { total, display }
    } else {
      const total = parseFloat(String(entry)) || 0
      rawAttributes[key] = { total, display: String(total) }
    }
  }

  const weaponCombo = raw.weapon_types.length > 0
    ? raw.weapon_types.join('+').toLowerCase()
    : raw.build_name.toLowerCase()

  return {
    id:            newId(),
    name:          raw.character_name || raw.build_name || 'Questlog Build',
    weaponCombo,
    stats,
    notes:         '',
    importedAt:    new Date().toISOString(),
    sourceUrl:     raw.url,
    rawStats,
    rawAttributes,
  }
}
