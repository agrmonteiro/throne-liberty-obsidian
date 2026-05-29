// GERADO AUTOMATICAMENTE — não edite manualmente
// Re-export unificado do catálogo

export type { L10n, Skill } from './skills'
export { SKILLS } from './skills'

export type { SkillEnhancement } from './skillEnhancements'
export { SKILL_ENHANCEMENTS } from './skillEnhancements'

export type { WeaponMastery, MasteryStat } from './weaponMasteries'
export { WEAPON_MASTERIES } from './weaponMasteries'

export type { MasteryNode, WeaponMasteryTree } from './masteryTrees'
export { MASTERY_TREES, masteryTreeByWeapon, masteryNodeById, skillNodesForWeapon } from './masteryTrees'

export type { MasteryNodeFull, MasteryStatFull } from './masteryIndex'
export { MASTERY_INDEX } from './masteryIndex'

// Helpers de lookup por ID
import { SKILLS } from './skills'
import { SKILL_ENHANCEMENTS } from './skillEnhancements'
import { WEAPON_MASTERIES } from './weaponMasteries'
import { MASTERY_INDEX } from './masteryIndex'

export const skillById = (id: string) => SKILLS.find(s => s.id === id)
export const enhancementById = (id: string) => SKILL_ENHANCEMENTS.find(e => e.id === id)
export const masteryById = (id: string) => WEAPON_MASTERIES.find(m => m.id === id)
export const skillsByWeapon = (weapon: string) => SKILLS.filter(s => s.weapon === weapon)
export const masteriesByWeapon = (weapon: string) => WEAPON_MASTERIES.filter(m => m.weapon === weapon)

// Helpers do índice unificado de maestrias (posição + stats)
export const masteryNodesByWeaponId = (weaponId: number) =>
  MASTERY_INDEX.filter(n => n.weaponId === weaponId)
export const enhancementsBySkillId = (skillSetId: string) =>
  SKILL_ENHANCEMENTS.filter(e => e.skillSetId === skillSetId)
