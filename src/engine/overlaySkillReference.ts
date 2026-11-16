import catalog from '../data/overlayDataminedSkills.json'
import reviewed from '../data/overlaySkillNames.json'
import npcReference from '../data/overlayNpcReference.json'
import { MASTERY_INDEX } from '../data/masteryIndex'
import type { NpcRankHint, NpcRankSource, SkillWeaponHint } from './overlayMeter'

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

export interface OverlayMasteryInsight {
  weapon: string
  grade: string
  description: string
}

// Efeitos de maestria chegam ao protocolo como habilidades. Cruzar o nome
// dataminado com o índice de maestrias dá contexto útil sem inventar uma
// relação entre o ID do efeito e uma descrição.
const masteriesByLocalizedName = new Map<string, typeof MASTERY_INDEX>()
for (const mastery of MASTERY_INDEX) {
  if (mastery.isSkillNode || !mastery.namePt || !mastery.descriptionPt) continue
  const matches = masteriesByLocalizedName.get(mastery.namePt) ?? []
  matches.push(mastery)
  masteriesByLocalizedName.set(mastery.namePt, matches)
}
export function overlayMasteryInsight(skillId?: number): OverlayMasteryInsight | undefined {
  if (skillId === undefined) return undefined
  const row = catalog[String(skillId)]
  const mastery = row ? masteriesByLocalizedName.get(row.name)?.[0] : undefined
  return mastery ? { weapon: mastery.weaponName, grade: mastery.grade, description: mastery.descriptionPt } : undefined
}

// O código vem da linha dataminada da habilidade, não do nome exibido. Itens,
// buffs e skills sem prefixo de arma continuam sem classificação.
const weaponCodes: Record<string, string> = {
  DA: 'Adaga', GT: 'Espadão', ST: 'Cajado', WA: 'Varinha', BO: 'Arco Longo',
  CR: 'Besta', SW_SH: 'Espada e Escudo', SP: 'Lança', ORB: 'Orbe', CL: 'Manopla',
  SW2: 'Espada (legado SW2)',
}
function weaponHint(row?: string): SkillWeaponHint | undefined {
  const match = /^(?:WP|WM)_(SW_SH|DA|GT|ST|WA|BO|CR|SP|ORB|CL|SW2)_/.exec(String(row ?? ''))
  if (!match || !weaponCodes[match[1]]) return undefined
  return { code: match[1], label: weaponCodes[match[1]] }
}
export const overlaySkillWeaponHints: Record<string, SkillWeaponHint> = Object.fromEntries(
  Object.entries(catalog).flatMap(([id, row]) => {
    const hint = weaponHint(row.row)
    return hint ? [[id, hint]] : []
  }),
)
/** Skills presentes somente no catálogo de NPC: sinal fraco, usado pela floresta em fontes pendentes. */
export const overlayNpcOnlySkillIds = new Set(Object.keys(npcReference.skills)
  .filter(id => !catalog[id as keyof typeof catalog]).map(Number).filter(Number.isSafeInteger))
