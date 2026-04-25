export const WEAPON_TYPES = [
  'Staff', 'Wand & Tome', 'Longbow', 'Crossbow',
  'Dagger', 'Greatsword', 'Sword & Shield', 'Spear', 'Orb', 'Item/Proc',
] as const

export type WeaponType = typeof WEAPON_TYPES[number]
