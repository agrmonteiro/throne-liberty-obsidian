import reference from '../data/overlayNpcReference.json'

export type EncounterRank = 'boss' | 'champion' | 'elite' | 'normal' | 'unresolved'
export type EncounterRankSource = 'creature-rank' | 'unresolved'

type NpcReferenceRow = {
  name?: string
  rank?: string
  rankSource?: string
  level?: number
}

const npcs = reference.npcs as Record<string, NpcReferenceRow>
const knownRanks = new Set<EncounterRank>(['boss', 'champion', 'elite', 'normal'])
const priority: Record<Exclude<EncounterRank, 'unresolved'>, number> = {
  boss: 4,
  champion: 3,
  elite: 2,
  normal: 1,
}

export interface EncounterClassification {
  templateId: string
  name?: string
  rank: EncounterRank
  level?: number
  source: EncounterRankSource
}

/** Classifica somente IDs presentes no catálogo local. Ausência de dado permanece unresolved. */
export function classifyEncounterTemplate(templateId: string | number): EncounterClassification {
  const id = String(templateId)
  const row = npcs[id]
  if (!row || !row.rank || !knownRanks.has(row.rank as EncounterRank) || row.rankSource !== 'creature-rank') {
    return { templateId: id, rank: 'unresolved', source: 'unresolved' }
  }

  return {
    templateId: id,
    name: row.name,
    rank: row.rank as Exclude<EncounterRank, 'unresolved'>,
    level: typeof row.level === 'number' ? row.level : undefined,
    source: 'creature-rank',
  }
}

export interface EncounterTargetInput {
  templateId: string | number
  [key: string]: unknown
}

export interface ClassifiedEncounterTarget<T extends EncounterTargetInput = EncounterTargetInput> {
  target: T
  classification: EncounterClassification
}

export interface EncounterTargetCollection<T extends EncounterTargetInput = EncounterTargetInput> {
  targets: Array<ClassifiedEncounterTarget<T>>
  dominant: EncounterClassification | null
}

/** Rotula cada alvo e seleciona a classe mais prioritária entre os alvos conhecidos. */
export function classifyEncounterTargets<T extends EncounterTargetInput>(targets: readonly T[]): EncounterTargetCollection<T> {
  const classified = targets.map(target => ({ target, classification: classifyEncounterTemplate(target.templateId) }))
  const dominant = classified
    .map(row => row.classification)
    .filter((row): row is EncounterClassification & { rank: Exclude<EncounterRank, 'unresolved'> } => row.rank !== 'unresolved')
    .sort((a, b) => priority[b.rank] - priority[a.rank] || a.templateId.localeCompare(b.templateId))[0] ?? null
  return { targets: classified, dominant }
}
