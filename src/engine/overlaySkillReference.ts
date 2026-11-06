import catalog from '../data/overlayDataminedSkills.json'
import reviewed from '../data/overlaySkillNames.json'
import npcReference from '../data/overlayNpcReference.json'
import type { NpcRankHint, NpcRankSource } from './overlayMeter'

export const overlaySkillNames: Record<string, string> = {
  ...Object.fromEntries(Object.entries(npcReference.skills).map(([id, row]) => [id, row.name])),
  ...Object.fromEntries(Object.entries(catalog).map(([id, row]) => [id, row.name])), ...reviewed,
}
export const overlayNpcNames: Record<string, string> = Object.fromEntries(Object.entries(npcReference.npcs).map(([id, row]) => [id, row.name]))
/** Reserva para catálogos antigos sem o CreatureRank explícito no template. */
export function npcRankHint(row?: string): NpcRankHint | undefined {
  const tokens = `_${String(row ?? '').toUpperCase()}_`
  if (tokens.includes('_CHAMPION_') || tokens.includes('_CHAMP_')) return 'champion'
  if (tokens.includes('_ELITE_')) return 'elite'
  if (tokens.includes('_NORMAL_')) return 'normal'
  if (tokens.includes('_M_')) return 'unique'
  return undefined
}
const npcRankEntries = Object.entries(npcReference.npcs).map(([id, row]) => {
  const direct = row.rank as NpcRankHint | undefined
  return [id, direct ?? npcRankHint(row.row), direct ? 'creature-rank' : npcRankHint(row.row) ? 'row-fallback' : undefined] as const
})
export const overlayNpcRankHints: Record<string, NpcRankHint> = Object.fromEntries(npcRankEntries
  .filter((entry): entry is readonly [string, NpcRankHint, 'creature-rank' | 'row-fallback'] => entry[1] !== undefined)
  .map(([id, rank]) => [id, rank]))
export const overlayNpcRankSources: Record<string, NpcRankSource> = Object.fromEntries(npcRankEntries
  .filter((entry): entry is readonly [string, NpcRankHint, NpcRankSource] => entry[2] !== undefined)
  .map(([id, , source]) => [id, source]))
export const overlayDescriptiveSkillIds = new Set(Object.entries(npcReference.skills)
  .filter(([id, row]) => row.nameOrigin === 'descriptive' && !catalog[id as keyof typeof catalog] && !reviewed[id as keyof typeof reviewed]).map(([id]) => Number(id)))
export const overlaySkillFiles: Record<string, string> = Object.fromEntries(
  Object.entries(catalog).filter(([, row]) => row.iconFile).map(([id, row]) => [id, row.iconFile!]),
)
