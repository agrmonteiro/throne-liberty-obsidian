import { create } from 'zustand'
import type { Build, BuildMap, BuildStats } from '../engine/types'
import { DEFAULT_STATS } from '../engine/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuildsState {
  builds:        BuildMap
  activeBuildId: string | null
  loading:       boolean

  // Actions
  loadFromDisk:         ()                             => Promise<void>
  saveBuild:            (build: Build)                 => Promise<void>
  deleteBuild:          (id: string)                   => Promise<void>
  setActive:            (id: string | null)            => void
  importFromFile:       ()                             => Promise<Build | null>
  importFromUrlPython:  (url: string)                  => Promise<Build | { error: string }>
  exportBuild:          (id: string)                   => Promise<void>
  createEmpty:          (name: string, combo?: string) => Build
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataAPI: {
      read:                  (filename: string)                   => Promise<unknown>
      write:                 (filename: string, data: unknown)    => Promise<{ ok: boolean; error?: string }>
      importFile:            ()                                   => Promise<unknown>
      exportFile:            (data: unknown, name: string)        => Promise<{ ok: boolean; path?: string }>
      dir:                   ()                                   => Promise<string>
      questlogImportPython:  (url: string)                        => Promise<unknown>
      questlogCancel:        ()                                   => Promise<{ ok: boolean }>
      onProgress:            (cb: (payload: { stage: 'starting' | 'downloading-browser' | 'extracting' | 'done' }) => void) => void
      offProgress:           () => void
      onLog:                 (cb: (payload: { line: string }) => void) => void
      offLog:                () => void
      // Combat log folder management
      combatlogPickFolder:   ()                                   => Promise<string | null | { error: string }>
      combatlogGetFolder:    ()                                   => Promise<string | null>
      combatlogListFiles:    (folder: string)                     => Promise<{ name: string; path: string; sizeBytes: number; mtime: number }[]>
      combatlogReadFile:     (filePath: string)                   => Promise<string | null>
      combatlogDeleteFile:   (filePath: string)                   => Promise<{ ok: boolean; error?: string }>
      // Scraper setup
      scraperGetPath:        ()                                   => Promise<string | null>
      scraperSetPath:        (p: string)                          => Promise<{ ok: boolean; error?: string }>
      scraperPickFile:       ()                                   => Promise<string | null>
      scraperDetect:         ()                                   => Promise<{ scraperFound: boolean; scraperPath: string | null; pythonOk: boolean; pythonVersion: string }>
      scraperOpenLog:        ()                                   => Promise<{ ok: boolean; error?: string }>
      scraperReadLog:        ()                                   => Promise<string>
    }
  }
}

const FILE = 'builds.json'

async function readBuilds(): Promise<BuildMap> {
  try {
    const data = await window.dataAPI.read(FILE)
    return (data as BuildMap) ?? {}
  } catch {
    return {}
  }
}

async function writeBuilds(builds: BuildMap): Promise<void> {
  await window.dataAPI.write(FILE, builds)
}

function newId(): string {
  return `build_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBuilds = create<BuildsState>((set, get) => ({
  builds:        {},
  activeBuildId: null,
  loading:       false,

  loadFromDisk: async () => {
    set({ loading: true })
    const raw = await readBuilds()
    // Migração: garante que todos os campos de DEFAULT_STATS existam nas builds antigas
    const builds: BuildMap = {}
    for (const [id, build] of Object.entries(raw)) {
      const merged = { ...DEFAULT_STATS, ...build.stats }
      // Migração: campos que tinham default 0 e agora têm padrão novo
      if (!merged.monsterDmgBoostPct) merged.monsterDmgBoostPct = DEFAULT_STATS.monsterDmgBoostPct
      if (!merged.dmgBuffPct)         merged.dmgBuffPct         = DEFAULT_STATS.dmgBuffPct
      builds[id] = { ...build, stats: merged }
    }
    const ids = Object.keys(builds)
    set({
      builds,
      loading: false,
      activeBuildId: ids.length > 0 ? ids[0] : null,
    })
  },

  saveBuild: async (build: Build) => {
    const builds = { ...get().builds, [build.id]: build }
    set({ builds })
    await writeBuilds(builds)
  },

  deleteBuild: async (id: string) => {
    const builds = { ...get().builds }
    delete builds[id]
    const ids = Object.keys(builds)
    set({
      builds,
      activeBuildId: ids.length > 0 ? ids[0] : null,
    })
    await writeBuilds(builds)
  },

  setActive: (id) => set({ activeBuildId: id }),

  importFromFile: async () => {
    try {
      const raw = await window.dataAPI.importFile()
      if (!raw) return null

      // Support both a single build object and a map
      let build: Build | null = null

      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as Record<string, unknown>

        if ('stats' in obj && 'name' in obj) {
          // Direct Build object
          build = {
            id:          (obj.id as string) || newId(),
            name:        (obj.name as string) || 'Importada',
            weaponCombo: (obj.weaponCombo as string) || '',
            stats:       { ...DEFAULT_STATS, ...(obj.stats as Partial<BuildStats>) },
            notes:       (obj.notes as string) || '',
            importedAt:  new Date().toISOString(),
            sourceUrl:   (obj.sourceUrl as string) || undefined,
          }
        } else {
          // Maybe it's a Python-format build (from questlog importer)
          build = parsePythonBuild(obj)
        }
      }

      if (!build) return null

      await get().saveBuild(build)
      set({ activeBuildId: build.id })
      return build
    } catch (err) {
      console.error('importFromFile error', err)
      return null
    }
  },

  importFromUrlPython: async (url: string) => {
    try {
      const raw = await window.dataAPI.questlogImportPython(url)
      if (!raw || typeof raw !== 'object') return { error: 'Resposta inválida do scraper.' }
      const obj = raw as Record<string, unknown>
      if (obj.error) return { error: String(obj.error) }

      // Validação de schema antes de qualquer parse ou save (IMP-05)
      const validationError = validateScraperOutput(obj)
      if (validationError) return { error: validationError }

      const build = parsePythonBuild(obj)
      if (!build) return { error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' }
      // Não salva automaticamente — retorna o build para o UI confirmar e renomear
      return build
    } catch (err) {
      return { error: `Erro inesperado: ${String(err)}` }
    }
  },

  exportBuild: async (id: string) => {
    const build = get().builds[id]
    if (!build) return
    const filename = `${build.name.replace(/[^a-z0-9]/gi, '_')}.json`
    await window.dataAPI.exportFile(build, filename)
  },

  createEmpty: (name: string, combo = '') => ({
    id:          newId(),
    name,
    weaponCombo: combo,
    stats:       { ...DEFAULT_STATS },
    notes:       '',
    importedAt:  new Date().toISOString(),
  }),
}))

// ─── Parser para builds do Python (questlog importer format) ─────────────────
// Suporta dois formatos:
//   1. Novo scraper (questlog_scraper_standalone): { meta, attributes, stats }
//   2. Formato antigo do questlog importer: { stats, character_name, ... }

/**
 * Valida o output do scraper antes de parsear.
 * Retorna null se válido, ou string com mensagem de erro se inválido.
 * Suporta ambos os formatos: novo ({ meta, stats }) e antigo ({ character_name/folder_name, stats }).
 */
function validateScraperOutput(obj: Record<string, unknown>): string | null {
  // Verificar se tem stats em algum formato
  const hasStats = obj.stats != null
    && typeof obj.stats === 'object'
    && !Array.isArray(obj.stats)
    && Object.keys(obj.stats as Record<string, unknown>).length > 0

  if (!hasStats) {
    return 'Build importada com dados incompletos — campos obrigatórios ausentes'
  }

  // Formato novo: precisa de meta com character_name ou slug
  const isNewFormat = obj.meta != null
  if (isNewFormat) {
    const meta = obj.meta as Record<string, unknown>
    const hasIdentifier = Boolean(meta.character_name) || Boolean(meta.slug)
    if (!hasIdentifier) {
      return 'Build importada com dados incompletos — campos obrigatórios ausentes'
    }
    return null
  }

  // Formato antigo: precisa de character_name ou folder_name
  const hasIdentifier = Boolean(obj.character_name) || Boolean(obj.folder_name)
  if (!hasIdentifier) {
    return 'Build importada com dados incompletos — campos obrigatórios ausentes'
  }

  return null // válido
}

function parsePythonBuild(raw: Record<string, unknown>): Build | null {
  try {
    // ── Detecta formato do novo scraper ──────────────────────────────────────
    const isNewFormat = raw.meta != null && raw.attributes != null && raw.stats != null
      && typeof raw.stats === 'object' && !Array.isArray(raw.stats)
      && Object.values(raw.stats as Record<string, unknown>).every((v) => typeof v === 'string')

    if (isNewFormat) {
      return parseNewScraperFormat(raw)
    }

    // ── Formato antigo ────────────────────────────────────────────────────────
    return parseOldFormat(raw)
  } catch {
    return null
  }
}

/** Novo formato: { meta: { character_name, slug, ... }, attributes: { Strength: { total, display } }, stats: { "Combat Power": "5467" } } */
function parseNewScraperFormat(raw: Record<string, unknown>): Build | null {
  const meta = (raw.meta ?? {}) as Record<string, unknown>
  const rawAttrs = (raw.attributes ?? {}) as Record<string, { total: number; display: string }>
  const rawStatsIn = (raw.stats ?? {}) as Record<string, string>

  function statNum(key: string, fallback = 0): number {
    const v = rawStatsIn[key]
    if (!v) return fallback
    let s = v.replace('%', '').split('~')[0].trim()
    // Remove thousands-separator dots OR commas (followed by exactly 3 digits, not followed by digit):
    //   "1.985"   (BR/EU: 1985)  → "1985"  → 1985  ✓
    //   "1,985"   (EN: 1985)     → "1985"  → 1985  ✓
    //   "78,5"    (BR decimal)   → stays   → "78.5" after next line → 78.5 ✓
    //   "78.5"    (EN decimal)   → stays   → 78.5  ✓
    //   "1.234.567" (BR millions)→ "1234567"✓
    s = s.replace(/[,.](\d{3})(?!\d)/g, '$1')  // strip thousands separators (dot OR comma)
    s = s.replace(',', '.')                      // remaining comma = decimal separator → dot
    return parseFloat(s) || fallback
  }

  const maxDmgStr = rawStatsIn['Max Damage'] ?? ''
  const parts = maxDmgStr.split('~').map((p) => parseFloat(p.trim().replace(',', '.')) || 0)
  const minWeaponDmg = parts[0] ?? 0
  const maxWeaponDmg = parts[1] ?? minWeaponDmg

  const heavyEntry = rawStatsIn['Heavy Attack Damage']
  const heavyComp = heavyEntry != null
    ? Math.max(0, statNum('Heavy Attack Damage'))
    : Math.max(0, statNum('Heavy Damage', 100) - 100)

  const speciesKeys = [
    'Species Damage Boost', 'Demon Damage Boost', 'Wildkin Damage Boost',
    'Undead Damage Boost', 'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
  ]
  const speciesDmgBoost = speciesKeys.reduce((acc, k) => {
    const v = statNum(k)
    return v > acc ? v : acc
  }, 0)

  // Boss Crit/Heavy no quest log já incluem o valor base → guardar só o delta extra
  const critHitChance     = statNum('Magic Critical Hit Chance') || statNum('Melee Critical Hit Chance')
  const heavyAttackChance = statNum('Magic Heavy Attack Chance') || statNum('Melee Heavy Attack Chance')
  const rawBossCrit  = Math.max(0, statNum('Boss Magic Critical Hit Chance'), statNum('Boss Melee Critical Hit Chance'), statNum('Boss Ranged Critical Hit Chance'))
  const rawBossHeavy = Math.max(0, statNum('Boss Magic Heavy Attack Chance'), statNum('Boss Melee Heavy Attack Chance'), statNum('Boss Ranged Heavy Attack Chance'))
  const bossCritChance  = Math.max(0, rawBossCrit  - critHitChance)
  const bossHeavyChance = Math.max(0, rawBossHeavy - heavyAttackChance)

  const stats: BuildStats = {
    ...DEFAULT_STATS,
    minWeaponDmg,
    maxWeaponDmg,
    critHitChance,
    bossCritChance,
    heavyAttackChance,
    bossHeavyChance,
    heavyAttackDmgComp: heavyComp,
    skillDmgBoost:      statNum('Skill Damage Boost'),
    bonusDmg:           statNum('Bonus Damage'),
    critDmgPct:         statNum('Critical Damage'),
    speciesDmgBoost,
    cdrPct:             statNum('Cooldown Speed'),
    attackSpeedPct:     statNum('Attack Speed'),
  }

  // Normaliza rawAttributes para o formato padrão
  const rawAttributes: Record<string, { total: number; display: string }> = {}
  for (const [k, v] of Object.entries(rawAttrs)) {
    if (v && typeof v === 'object') {
      rawAttributes[k] = { total: v.total ?? 0, display: v.display ?? String(v.total ?? 0) }
    }
  }

  const name = String(meta.character_name || meta.slug || 'Build importada')
  const sourceUrl = typeof meta.source_url === 'string' ? meta.source_url : undefined

  const rawSpec = raw.specialization
  const specialization: Array<{ id: string; lvl: number }> | undefined = (() => {
    if (!Array.isArray(rawSpec) || rawSpec.length === 0) return undefined
    const filtered = (rawSpec as unknown[]).reduce<Array<{ id: string; lvl: number }>>((acc, item) => {
      if (
        item !== null && typeof item === 'object' &&
        typeof (item as any).id === 'string' &&
        typeof (item as any).lvl === 'number'
      ) {
        acc.push({ id: (item as any).id, lvl: (item as any).lvl })
      }
      return acc
    }, [])
    return filtered.length ? filtered : undefined
  })()

  return {
    id:            newId(),
    name,
    weaponCombo:   '',
    stats,
    notes:         '',
    importedAt:    new Date().toISOString(),
    sourceUrl,
    rawStats:      rawStatsIn,
    rawAttributes,
    specialization,
    weaponMain: typeof raw.weaponMain === 'string' ? raw.weaponMain : undefined,
    weaponOff:  typeof raw.weaponOff  === 'string' ? raw.weaponOff  : undefined,
  }
}

/** Formato antigo do importer Python: { stats: { "Combat Power": { value, display } }, character_name, ... } */
function parseOldFormat(raw: Record<string, unknown>): Build | null {
  const rawStats = (raw.stats || {}) as Record<string, unknown>

  function s(key: string, fallback = 0): number {
    const v = rawStats[key]
    if (typeof v === 'number') return v
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>
      const val = obj.selected_value ?? obj.value ?? obj.display ?? fallback
      return parseFloat(String(val)) || fallback
    }
    return parseFloat(String(v)) || fallback
  }

  const maxDmgRaw = rawStats['Max Damage'] as Record<string, unknown> | number | undefined
  let minW = 0, maxW = 0
  if (typeof maxDmgRaw === 'object' && maxDmgRaw !== null) {
    minW = parseFloat(String(maxDmgRaw.value ?? 0)) || 0
    maxW = parseFloat(String(maxDmgRaw.selected_value ?? maxDmgRaw.value ?? 0)) || minW
  } else if (typeof maxDmgRaw === 'number') {
    minW = maxW = maxDmgRaw
  }

  const heavyRaw = rawStats['Heavy Attack Damage']
  const heavyComp = heavyRaw !== undefined
    ? Math.max(0, s('Heavy Attack Damage'))
    : Math.max(0, s('Heavy Damage', 100) - 100)

  const speciesKeys = [
    'Species Damage Boost', 'Demon Damage Boost', 'Wildkin Damage Boost',
    'Undead Damage Boost', 'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
  ]
  const speciesDmgBoost = speciesKeys.reduce((acc, k) => {
    const v = s(k)
    return v > acc ? v : acc
  }, 0)

  // Boss Crit/Heavy no quest log já incluem o valor base → guardar só o delta extra
  const critHitChanceOld     = s('Magic Critical Hit Chance') || s('Melee Critical Hit Chance')
  const heavyAttackChanceOld = s('Magic Heavy Attack Chance') || s('Melee Heavy Attack Chance')
  const rawBossCritOld  = Math.max(0, s('Boss Magic Critical Hit Chance'), s('Boss Melee Critical Hit Chance'), s('Boss Ranged Critical Hit Chance'))
  const rawBossHeavyOld = Math.max(0, s('Boss Magic Heavy Attack Chance'), s('Boss Melee Heavy Attack Chance'), s('Boss Ranged Heavy Attack Chance'))
  const bossCritChanceOld  = Math.max(0, rawBossCritOld  - critHitChanceOld)
  const bossHeavyChanceOld = Math.max(0, rawBossHeavyOld - heavyAttackChanceOld)

  const stats: BuildStats = {
    ...DEFAULT_STATS,
    minWeaponDmg:        minW,
    maxWeaponDmg:        maxW,
    critHitChance:       critHitChanceOld,
    bossCritChance:      bossCritChanceOld,
    heavyAttackChance:   heavyAttackChanceOld,
    bossHeavyChance:     bossHeavyChanceOld,
    heavyAttackDmgComp:  heavyComp,
    skillDmgBoost:       s('Skill Damage Boost'),
    bonusDmg:            s('Bonus Damage'),
    critDmgPct:          s('Critical Damage'),
    speciesDmgBoost,
    cdrPct:              s('Cooldown Speed'),
    attackSpeedPct:      s('Attack Speed'),
  }

  // Convert old stat objects to display strings for rawStats
  const rawStatsOut: Record<string, string> = {}
  for (const [key, val] of Object.entries(rawStats)) {
    if (typeof val === 'string') rawStatsOut[key] = val
    else if (typeof val === 'number') rawStatsOut[key] = String(val)
    else if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const display = obj.display ?? obj.selected_value ?? obj.value
      if (display != null) rawStatsOut[key] = String(display)
    }
  }

  const name = String(raw.character_name || raw.folder_name || raw.build_id || 'Build importada')
  const wt = raw.weapon_types
  const combo = Array.isArray(wt) ? wt.join('+') : String(raw.folder_name || '')

  return {
    id:          newId(),
    name,
    weaponCombo: combo.toLowerCase(),
    stats,
    notes:       '',
    importedAt:  new Date().toISOString(),
    sourceUrl:   typeof raw.url === 'string' ? raw.url : undefined,
    rawStats:    rawStatsOut,
  }
}
