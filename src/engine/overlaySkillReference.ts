import catalog from '../data/overlayDataminedSkills.json'
import reviewed from '../data/overlaySkillNames.json'

export const overlaySkillNames: Record<string, string> = {
  ...Object.fromEntries(Object.entries(catalog).map(([id, row]) => [id, row.name])), ...reviewed,
}
export const overlaySkillFiles: Record<string, string> = Object.fromEntries(
  Object.entries(catalog).filter(([, row]) => row.iconFile).map(([id, row]) => [id, row.iconFile!]),
)
