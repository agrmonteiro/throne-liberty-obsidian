import { DEFAULT_STATS } from './types'
import type { BuildStats } from './types'

type RawAttributes = Record<string, { total: number; display: string }>

export type ParsedOcrBuild = {
  name: string
  stats: BuildStats
  statsPatch: Partial<BuildStats>
  rawStats: Record<string, string>
  rawAttributes: RawAttributes
  recognizedFields: number
}

type Field = {
  label: string
  aliases: string[]
}

const ATTRIBUTES: Field[] = [
  { label: 'Strength', aliases: ['strength', 'forca'] },
  { label: 'Dexterity', aliases: ['dexterity', 'destreza'] },
  { label: 'Wisdom', aliases: ['wisdom', 'sabedoria'] },
  { label: 'Perception', aliases: ['perception', 'percepcao'] },
  { label: 'Fortitude', aliases: ['fortitude', 'fortaleza'] },
]

const STAT_FIELDS: Field[] = [
  { label: 'Primary Weapon Damage', aliases: ['primary base damage', 'main weapon base damage', 'principal dano base', 'arma principal dano base'] },
  { label: 'Secondary Weapon Damage', aliases: ['secondary base damage', 'arma secundaria dano base'] },
  { label: 'Min Damage', aliases: ['min damage', 'minimum damage', 'dano minimo', 'dano minimo da arma'] },
  { label: 'Max Damage', aliases: ['max damage', 'maximum damage', 'dano maximo', 'dano maximo da arma'] },
  { label: 'Weapon Damage', aliases: ['weapon damage', 'dano da arma', 'dano base'] },
  { label: 'Magic Critical Hit Chance', aliases: ['magic critical hit chance', 'chance de acerto critico magico'] },
  { label: 'Melee Critical Hit Chance', aliases: ['melee critical hit chance', 'chance de acerto critico corpo a corpo'] },
  { label: 'Ranged Critical Hit Chance', aliases: ['ranged critical hit chance', 'chance de acerto critico a distancia'] },
  { label: 'Magic Heavy Attack Chance', aliases: ['magic heavy attack chance', 'chance de ataque pesado magico'] },
  { label: 'Melee Heavy Attack Chance', aliases: ['melee heavy attack chance', 'chance de ataque pesado corpo a corpo'] },
  { label: 'Ranged Heavy Attack Chance', aliases: ['ranged heavy attack chance', 'chance de ataque pesado a distancia'] },
  { label: 'Boss Magic Critical Hit Chance', aliases: ['boss magic critical hit chance', 'chance de acerto critico magico de chefe', 'chance de acerto critico magico contra chefe'] },
  { label: 'Boss Melee Critical Hit Chance', aliases: ['boss melee critical hit chance', 'chance de acerto critico corpo a corpo de chefe', 'chance de acerto critico corpo a corpo contra chefe'] },
  { label: 'Boss Ranged Critical Hit Chance', aliases: ['boss ranged critical hit chance', 'chance de acerto critico a distancia de chefe', 'chance de acerto critico a distancia contra chefe'] },
  { label: 'Boss Magic Heavy Attack Chance', aliases: ['boss magic heavy attack chance', 'chance de ataque pesado magico de chefe', 'chance de ataque pesado magico contra chefe'] },
  { label: 'Boss Melee Heavy Attack Chance', aliases: ['boss melee heavy attack chance', 'chance de ataque pesado corpo a corpo de chefe', 'chance de ataque pesado corpo a corpo contra chefe'] },
  { label: 'Boss Ranged Heavy Attack Chance', aliases: ['boss ranged heavy attack chance', 'chance de ataque pesado a distancia de chefe', 'chance de ataque pesado a distancia contra chefe'] },
  { label: 'Boss Critical Hit Chance', aliases: ['boss critical hit chance', 'chance de acerto critico de chefe', 'chance de acerto critico contra chefe', 'chance de acerto critico de boss'] },
  { label: 'Boss Heavy Attack Chance', aliases: ['boss heavy attack chance', 'chance de ataque pesado de chefe', 'chance de ataque pesado contra chefe', 'chance de ataque pesado de boss'] },
  { label: 'Heavy Attack Chance', aliases: ['heavy attack chance', 'chance de ataque pesado'] },
  { label: 'Heavy Attack Damage', aliases: ['heavy attack damage', 'dano de ataque pesado'] },
  { label: 'Critical Damage', aliases: ['critical damage', 'dano critico'] },
  { label: 'Skill Damage Boost', aliases: ['skill damage boost', 'ampliacao de dano de habilidade', 'aumento de dano de habilidade'] },
  { label: 'Bonus Damage', aliases: ['bonus damage', 'bonus de dano', 'dano adicional'] },
  { label: 'Species Damage Boost', aliases: ['species damage boost', 'ampliacao de dano por especie', 'aumento de dano por especie', 'ampliacao de dano contra especie', 'aumento de dano contra especie', 'dano contra especie'] },
  { label: 'Demon Damage Boost', aliases: ['demon damage boost', 'ampliacao de dano contra demonios', 'mpliacao de dano contra demonios'] },
  { label: 'Wildkin Damage Boost', aliases: ['wildkin damage boost', 'ampliacao de dano contra feras', 'ampliacao de dano contra selvagens', 'mpliacao de dano contra selvagens'] },
  { label: 'Undead Damage Boost', aliases: ['undead damage boost', 'ampliacao de dano contra mortos vivos', 'ampliacao de dano contra mortos', 'mpliacao de dano contra mortos'] },
  { label: 'Humanoid Damage Boost', aliases: ['humanoid damage boost', 'ampliacao de dano contra humanoides', 'ampliacao de dano contra humanos', 'mpliacao de dano contra human'] },
  { label: 'Construct Damage Boost', aliases: ['construct damage boost', 'ampliacao de dano contra constructos', 'ampliacao de dano contra construtos', 'mpliacao de dano contra construt'] },
  { label: 'Magic Damage Boost', aliases: ['magic damage boost', 'ampliacao de dano magico'] },
  { label: 'Cooldown Speed', aliases: ['cooldown speed', 'velocidade de recarga'] },
  { label: 'Attack Speed', aliases: ['attack speed', 'velocidade de ataque'] },
  { label: 'Combat Power', aliases: ['combat power', 'poder de combate'] },
  { label: 'Damage Reduction', aliases: ['damage reduction', 'reducao de dano'] },
  { label: 'Range', aliases: ['range', 'alcance'] },
  { label: 'Block Chance', aliases: ['block chance', 'chance de bloqueio'] },
  { label: 'Melee Defense', aliases: ['melee defense', 'defesa corpo a corpo'] },
  { label: 'Ranged Defense', aliases: ['ranged defense', 'defesa a distancia'] },
  { label: 'Magic Defense', aliases: ['magic defense', 'defesa magica'] },
  { label: 'Melee Hit Chance', aliases: ['melee hit chance', 'chance de acerto corpo a corpo'] },
  { label: 'Ranged Hit Chance', aliases: ['ranged hit chance', 'chance de acerto a distancia'] },
  { label: 'Magic Hit Chance', aliases: ['magic hit chance', 'chance de acerto magico'] },
  { label: 'Melee Evasion', aliases: ['melee evasion', 'esquiva corpo a corpo'] },
  { label: 'Ranged Evasion', aliases: ['ranged evasion', 'esquiva a distancia'] },
  { label: 'Magic Evasion', aliases: ['magic evasion', 'esquiva magica'] },
  { label: 'Melee Heavy Attack Evasion', aliases: ['melee heavy attack evasion', 'esquiva de ataque pesado corpo a corpo'] },
  { label: 'Ranged Heavy Attack Evasion', aliases: ['ranged heavy attack evasion', 'esquiva de ataque pesado a distancia'] },
  { label: 'Magic Heavy Attack Evasion', aliases: ['magic heavy attack evasion', 'esquiva de ataque pesado magico'] },
  { label: 'Skill Damage Resistance', aliases: ['skill damage resistance', 'resistencia a dano de habilidade'] },
  { label: 'Critical Damage Resistance', aliases: ['critical damage resistance', 'resistencia a dano critico'] },
  { label: 'Heavy Attack Damage Resistance', aliases: ['heavy attack damage resistance', 'resistencia a dano de ataque pesado'] },
  { label: 'Buff Duration', aliases: ['buff duration', 'duracao da vantagem'] },
  { label: 'Debuff Duration', aliases: ['debuff duration', 'duracao da desvantagem'] },
]

const BOSS_PAGE_STAT_FIELDS: Field[] = [
  { label: 'Boss Melee Critical Hit Chance', aliases: ['boss melee critical hit chance', 'chance de acerto critico corpo a corpo contra chefe', 'chance de acerto critico corpo a corpo', 'acerto critico corpo a cor', 'critico corpo a cor'] },
  { label: 'Boss Ranged Critical Hit Chance', aliases: ['boss ranged critical hit chance', 'chance de acerto critico a distancia contra chefe', 'chance de acerto critico a distancia', 'acerto critico a distan', 'critico a distan'] },
  { label: 'Boss Magic Critical Hit Chance', aliases: ['boss magic critical hit chance', 'chance de acerto critico magico contra chefe', 'chance de acerto critico magico', 'acerto critico magico', 'critico magico'] },
  { label: 'Boss Melee Heavy Attack Chance', aliases: ['boss melee heavy attack chance', 'chance de ataque pesado corpo a corpo contra chefe', 'chance de ataque pesado corpo a corpo', 'chance de ataque pesado corpo a c'] },
  { label: 'Boss Ranged Heavy Attack Chance', aliases: ['boss ranged heavy attack chance', 'chance de ataque pesado a distancia contra chefe', 'chance de ataque pesado a distancia', 'chance de ataque pesado a distan'] },
  { label: 'Boss Magic Heavy Attack Chance', aliases: ['boss magic heavy attack chance', 'chance de ataque pesado magico contra chefe', 'chance de ataque pesado magico', 'chance de ataque pesado magi'] },
  { label: 'Boss Melee Hit Chance', aliases: ['boss melee hit chance', 'chance de acerto corpo a corpo contra chefe', 'acerto corpo a corpo contra che', 'acerto corpo a corpo cont'] },
  { label: 'Boss Ranged Hit Chance', aliases: ['boss ranged hit chance', 'chance de acerto a distancia contra chefe', 'acerto a distancia contra che', 'acerto a distancia cont'] },
  { label: 'Boss Magic Hit Chance', aliases: ['boss magic hit chance', 'chance de acerto magico contra chefe', 'acerto magico contra che', 'acerto magico cont'] },
  { label: 'Boss Melee Endurance', aliases: ['boss melee endurance', 'tolerancia corpo a corpo contra chefe', 'tolerancia corpo contra che'] },
  { label: 'Boss Ranged Endurance', aliases: ['boss ranged endurance', 'tolerancia a distancia contra chefe', 'tolerancia a distancia contra che'] },
  { label: 'Boss Magic Endurance', aliases: ['boss magic endurance', 'tolerancia magica contra chefe', 'tolerancia magica contra che'] },
  { label: 'Boss Melee Evasion', aliases: ['boss melee evasion', 'esquiva corpo a corpo contra chefe', 'esquiva corpo a corpo contra che', 'esquiva corpo a cor'] },
  { label: 'Boss Ranged Evasion', aliases: ['boss ranged evasion', 'esquiva a distancia contra chefe', 'esquiva a distancia contra che', 'esquiva a distan'] },
  { label: 'Boss Magic Evasion', aliases: ['boss magic evasion', 'esquiva magica contra chefe', 'esquiva magica contra che', 'esquiva magica'] },
  { label: 'Boss Melee Heavy Attack Evasion', aliases: ['boss melee heavy attack evasion', 'esquiva de ataque pesado corpo a corpo contra chefe', 'esquiva de ataque pesado corpo a corpo contra che', 'esquiva de ataque pesado corpo a c'] },
  { label: 'Boss Ranged Heavy Attack Evasion', aliases: ['boss ranged heavy attack evasion', 'esquiva de ataque pesado a distancia contra chefe', 'esquiva de ataque pesado a distancia contra che', 'esquiva de ataque pesado a distan'] },
  { label: 'Boss Magic Heavy Attack Evasion', aliases: ['boss magic heavy attack evasion', 'esquiva de ataque pesado magico contra chefe', 'esquiva de ataque pesado magico contra che', 'esquiva de ataque pesado magi'] },
  { label: 'Boss Bonus Damage', aliases: ['boss bonus damage', 'bonus de dano contra chefe', 'bonus de dano contra che'] },
  { label: 'Boss Damage Reduction', aliases: ['boss damage reduction', 'reducao de dano de chefe', 'reducao de dano de che'] },
]

const BASE_STAT_FIELDS = STAT_FIELDS.filter((field) => !field.label.startsWith('Boss '))
const OCR_BASE_PANEL_OPEN = '[OCR_BASE_PANEL]'
const OCR_BASE_PANEL_CLOSE = '[/OCR_BASE_PANEL]'
const OCR_BOSS_PANEL_OPEN = '[OCR_BOSS_PANEL]'
const OCR_BOSS_PANEL_CLOSE = '[/OCR_BOSS_PANEL]'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%~ ]/g, ' ')
    .replace(/\b(?:[1ir]|\")?ance\s+de\b/g, 'chance de')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseNumber(value: string): number {
  const compact = value.replace(/[^\d,.-]/g, '')
  if (!compact) return 0

  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')
  const separator = Math.max(lastComma, lastDot)
  if (separator === -1) return Number.parseFloat(compact) || 0

  const integerPart = compact.slice(0, separator).replace(/[,.]/g, '')
  const decimalPart = compact.slice(separator + 1).replace(/[,.]/g, '')
  const usesDecimalSeparator = decimalPart.length !== 3 || integerPart === '0'
  const normalized = usesDecimalSeparator
    ? `${integerPart || '0'}.${decimalPart}`
    : `${integerPart}${decimalPart}`
  return Number.parseFloat(normalized) || 0
}

function findNumbers(value: string): number[] {
  return value.match(/\d+(?:[.,]\d+)?/g)?.map(parseNumber) ?? []
}

function matchingFields(line: string, fields: Field[]): Field[] {
  const normalized = normalize(line)
  const candidates = fields.flatMap((field) => field.aliases.map((alias) => ({ field, alias })))
  const matchedAliases: string[] = []
  const matchedFields = new Set<Field>()

  for (const candidate of candidates
    .sort((left, right) => right.alias.length - left.alias.length)
    .filter(({ alias }) => normalized.includes(alias))) {
    if (matchedFields.has(candidate.field) || matchedAliases.some((alias) => alias.includes(candidate.alias))) continue
    matchedAliases.push(candidate.alias)
    matchedFields.add(candidate.field)
  }

  return [...matchedFields]
}

function normalizeForValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(?:[1ir]|\")?ance\s+de\b/g, 'chance de')
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function valueNearField(line: string, field: Field): string | undefined {
  const searchable = normalizeForValue(line)
  const number = '[+-]?\\s*\\d+(?:[.,]\\d+)?\\s*(?:%|s)?'
  const aliases = [...field.aliases].sort((left, right) => right.length - left.length)

  for (const alias of aliases) {
    const aliasPattern = alias.split(' ').map(escapeRegex).join('[\\s|:/\\\\—–_-]+')
    const pattern = new RegExp(`${aliasPattern}[^0-9+\\-]{0,20}(${number}(?:\\s*(?:~|-|a)\\s*${number})?)`)
    const match = searchable.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
}

function highest(rawStats: Record<string, string>, labels: string[]): number {
  return Math.max(0, ...labels.map((label) => findNumbers(rawStats[label] ?? '')[0] ?? 0))
}

function isStandaloneAttributeValue(line: string): boolean {
  return /^[+-]?\d+(?:[.,]\d+)?%?$/.test(line.trim())
}

function hasBossContext(value: string): boolean {
  return /\b(?:boss|chef(?:e|es)?)\b/.test(normalize(value))
}

function panelContents(text: string, openMarker: string, closeMarker: string): string[] {
  const pattern = new RegExp(`${escapeRegex(openMarker)}\\s*([\\s\\S]*?)\\s*${escapeRegex(closeMarker)}`, 'g')
  return [...text.matchAll(pattern)].map((match) => match[1].trim()).filter(Boolean)
}

function collectRawStats(
  lines: string[],
  fields: Field[],
  rawStats: Record<string, string>,
  ignoreBossContext = false,
): void {
  for (const [index, line] of lines.entries()) {
    const nextLine = lines[index + 1] ?? ''
    if (ignoreBossContext && hasBossContext(`${line} ${nextLine}`)) continue

    for (const stat of matchingFields(line, fields)) {
      if (stat.label === 'Secondary Weapon Damage') continue
      if (stat.label === 'Bonus Damage' && normalize(line).includes('bonus de dano contra')) continue
      if (stat.label.includes('Heavy Attack Chance') && isBossEvasionLine(line)) continue
      const valueSource = valueNearField(line, stat)
        ?? valueNearField(nextLine, stat)
        ?? (findNumbers(line).length > 0 ? line : nextLine)
      if (findNumbers(valueSource).length === 0) continue
      if (stat.label === 'Attack Speed' && /s\s*$/i.test(valueSource)) continue
      rawStats[stat.label] = valueSource
    }
  }
}

export function statsPatchFromOcrRaw(rawStats: Record<string, string>, baseStats: Partial<BuildStats> = {}): Partial<BuildStats> {
  const primaryWeaponDamage = findNumbers(rawStats['Primary Weapon Damage'] ?? '')
  const minDamage = findNumbers(rawStats['Min Damage'] ?? '')
  const maxDamage = findNumbers(rawStats['Max Damage'] ?? '')
  const weaponDamage = findNumbers(rawStats['Weapon Damage'] ?? '')
  const hasNormalCrit = hasAnyRawStat(rawStats, ['Magic Critical Hit Chance', 'Melee Critical Hit Chance', 'Ranged Critical Hit Chance'])
  const hasNormalHeavy = hasAnyRawStat(rawStats, ['Magic Heavy Attack Chance', 'Melee Heavy Attack Chance', 'Ranged Heavy Attack Chance', 'Heavy Attack Chance'])
  const critHitChance = hasNormalCrit
    ? highest(rawStats, ['Magic Critical Hit Chance', 'Melee Critical Hit Chance', 'Ranged Critical Hit Chance'])
    : baseStats.critHitChance ?? 0
  const heavyAttackChance = hasNormalHeavy
    ? highest(rawStats, ['Magic Heavy Attack Chance', 'Melee Heavy Attack Chance', 'Ranged Heavy Attack Chance', 'Heavy Attack Chance'])
    : baseStats.heavyAttackChance ?? 0
  const rawBossCrit = highest(rawStats, [
    'Boss Magic Critical Hit Chance', 'Boss Melee Critical Hit Chance', 'Boss Ranged Critical Hit Chance',
    'Boss Critical Hit Chance',
  ])
  const rawBossHeavy = highest(rawStats, [
    'Boss Magic Heavy Attack Chance', 'Boss Melee Heavy Attack Chance', 'Boss Ranged Heavy Attack Chance',
    'Boss Heavy Attack Chance',
  ])
  const speciesDmgBoost = highest(rawStats, [
    'Species Damage Boost', 'Demon Damage Boost', 'Wildkin Damage Boost', 'Undead Damage Boost',
    'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
  ])

  const statsPatch: Partial<BuildStats> = {}
  if (primaryWeaponDamage.length > 0 || minDamage.length > 0 || maxDamage.length > 0 || weaponDamage.length > 0) {
    const damageRange = primaryWeaponDamage.length > 0
      ? primaryWeaponDamage
      : weaponDamage.length > 0 ? weaponDamage : maxDamage
    statsPatch.minWeaponDmg = minDamage[0] ?? damageRange[0] ?? 0
    statsPatch.maxWeaponDmg = maxDamage[0] ?? damageRange[1] ?? damageRange[0] ?? 0
  }
  if (hasNormalCrit) statsPatch.critHitChance = critHitChance
  if (hasNormalHeavy) statsPatch.heavyAttackChance = heavyAttackChance
  if (hasAnyRawStat(rawStats, ['Boss Magic Critical Hit Chance', 'Boss Melee Critical Hit Chance', 'Boss Ranged Critical Hit Chance', 'Boss Critical Hit Chance'])) {
    statsPatch.bossCritChance = rawBossCrit
  }
  if (hasAnyRawStat(rawStats, ['Boss Magic Heavy Attack Chance', 'Boss Melee Heavy Attack Chance', 'Boss Ranged Heavy Attack Chance', 'Boss Heavy Attack Chance'])) {
    statsPatch.bossHeavyChance = rawBossHeavy
  }
  if ('Heavy Attack Damage' in rawStats) {
    const heavyAttackDamage = highest(rawStats, ['Heavy Attack Damage'])
    statsPatch.heavyAttackDmgComp = Number((heavyAttackDamage - 100).toFixed(2))
  }
  if ('Critical Damage' in rawStats) statsPatch.critDmgPct = highest(rawStats, ['Critical Damage'])
  if ('Skill Damage Boost' in rawStats) statsPatch.skillDmgBoost = highest(rawStats, ['Skill Damage Boost'])
  if ('Bonus Damage' in rawStats) statsPatch.bonusDmg = highest(rawStats, ['Bonus Damage'])
  if (hasAnyRawStat(rawStats, [
    'Species Damage Boost', 'Demon Damage Boost', 'Wildkin Damage Boost', 'Undead Damage Boost',
    'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
  ])) statsPatch.speciesDmgBoost = speciesDmgBoost
  if ('Cooldown Speed' in rawStats) {
    const cooldownSpeed = highest(rawStats, ['Cooldown Speed'])
    if (cooldownSpeed <= 120) statsPatch.cdrPct = cooldownSpeed
  }
  if ('Attack Speed' in rawStats) {
    const attackSpeed = highest(rawStats, ['Attack Speed'])
    if (attackSpeed <= 150) statsPatch.attackSpeedPct = attackSpeed
  }

  return statsPatch
}

function hasAnyRawStat(rawStats: Record<string, string>, labels: string[]): boolean {
  return labels.some((label) => label in rawStats)
}

export function parseBuildOcrText(text: string, fileName: string): ParsedOcrBuild {
  const rawStats: Record<string, string> = {}
  const rawAttributes: RawAttributes = {}
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  for (const [index, line] of lines.entries()) {
    const nextLine = lines[index + 1] ?? ''
    for (const attribute of matchingFields(line, ATTRIBUTES)) {
      const valueSource = valueNearField(line, attribute)
        ?? (isStandaloneAttributeValue(nextLine) ? nextLine : undefined)
      const values = findNumbers(valueSource ?? '')
      if (values.length === 0) continue
      const value = values.at(-1) ?? 0
      if (value > 300) continue
      rawAttributes[attribute.label] = { total: value, display: String(value) }
    }
  }

  const basePanels = panelContents(text, OCR_BASE_PANEL_OPEN, OCR_BASE_PANEL_CLOSE)
  const bossPanels = panelContents(text, OCR_BOSS_PANEL_OPEN, OCR_BOSS_PANEL_CLOSE)
  if (basePanels.length > 0 || bossPanels.length > 0) {
    for (const panel of basePanels) {
      collectRawStats(panel.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), BASE_STAT_FIELDS, rawStats, true)
    }
    for (const panel of bossPanels) {
      collectRawStats(panel.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), BOSS_PAGE_STAT_FIELDS, rawStats)
    }
  } else {
    const isBossPage = hasBossContext(text)
    collectRawStats(lines, isBossPage ? BOSS_PAGE_STAT_FIELDS : BASE_STAT_FIELDS, rawStats, !isBossPage)
  }

  const statsPatch = statsPatchFromOcrRaw(rawStats)

  const stats: BuildStats = { ...DEFAULT_STATS, ...statsPatch }

  const baseName = fileName.replace(/\.[^.]+$/, '').trim() || 'Print da build'
  return {
    name: `OCR — ${baseName}`,
    stats,
    statsPatch,
    rawStats,
    rawAttributes,
    recognizedFields: Object.keys(rawStats).length + Object.keys(rawAttributes).length,
  }
}

function isBossEvasionLine(line: string): boolean {
  const normalized = normalize(line)
  return normalized.includes('esquiva') && !normalized.includes('chance')
}
