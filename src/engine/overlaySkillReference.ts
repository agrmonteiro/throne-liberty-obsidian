import catalog from '../data/overlayDataminedSkills.json'
import reviewed from '../data/overlaySkillNames.json'
import npcReference from '../data/overlayNpcReference.json'

export const overlaySkillNames: Record<string, string> = {
  ...Object.fromEntries(Object.entries(npcReference.skills).map(([id, row]) => [id, row.name])),
  ...Object.fromEntries(Object.entries(catalog).map(([id, row]) => [id, row.name])), ...reviewed,
}
export const overlayNpcNames: Record<string, string> = Object.fromEntries(Object.entries(npcReference.npcs).map(([id, row]) => [id, row.name]))
export const overlayDescriptiveSkillIds = new Set(Object.entries(npcReference.skills)
  .filter(([id, row]) => row.nameOrigin === 'descriptive' && !catalog[id as keyof typeof catalog] && !reviewed[id as keyof typeof reviewed]).map(([id]) => Number(id)))
export const overlaySkillFiles: Record<string, string> = Object.fromEntries(
  Object.entries(catalog).filter(([, row]) => row.iconFile).map(([id, row]) => [id, row.iconFile!]),
)
