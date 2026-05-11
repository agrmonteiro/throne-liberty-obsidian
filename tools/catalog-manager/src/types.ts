export interface L10n { en: string; pt: string }

export type SkillVariantFlag =
  | 'charge' | 'canmove' | 'hero' | 'specialization'
  | 'trait'  | 'move'    | 'boss' | 'notarget' | 'onetarget' | 'state'

export interface Skill {
  id: string
  name: L10n
  weapon: string
  grade: string
  type: string
  cooldownSec?: number
  manaCost?: number
  skillType?: L10n
  useFormat?: L10n
  description: L10n
  enhancementIds: string[]
  requiredTraits?: string[]
  variantOf?: string
  variantType?: SkillVariantFlag[]
  variantIds?: string[]
}

export interface SkillEnhancement {
  id: string
  name: L10n
  rawName: L10n
  baseSkillName: L10n
  skillSetId: string
  groupId: string | null
  grade: string
  effect: L10n
  unlockLevel?: number
  requiredPoints?: number
  description: L10n
}

export interface MasteryStat {
  label: L10n
  value: string
}

export interface WeaponMastery {
  id: string
  name: L10n
  weapon: string
  category: L10n
  grade: string
  stats: MasteryStat[]
  description: L10n
}

export const ALL_WEAPONS = [
  'Longbow', 'Crossbow', 'Greatsword', 'Spear', 'Orb',
  'Staff', 'Dagger', 'Sword', 'Wand', 'Shared',
] as const

export const ALL_GRADES = ['Common', 'Uncommon', 'Rare', 'Epic'] as const
export const ALL_TYPES  = ['active', 'passive', 'defensive'] as const
