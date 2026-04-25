import { create } from 'zustand'
import { SKILLS } from '../data/skills'


const FILE = 'skills-db.json'

export type SkillCategory = 'active' | 'passive' | 'proc' | 'item' | 'mastery'

export interface SkillDBEntry {
  id:           string
  name:         string
  nameEn:       string
  weaponType:   string        // Staff, Wand & Tome, Longbow, etc.
  category:     SkillCategory
  castTime:     number        // segundos
  cooldown:     number        // segundos base
  manaCost:     number        // custo de mana
  grade:        string        // Common, Uncommon, Rare, Epic
  description:  string        // descrição da skill (PT)
  skillDmgPct:  number        // % de dano
  bonusBaseDmg: number
  hits:         number
  monsterBonus: number        // % (ex: 120)
  dmgBonus:     number        // % condicional (ex: 40)
}

interface SkillsDBState {
  entries:     SkillDBEntry[]
  loading:     boolean
  loadFromDisk: () => Promise<void>
  addEntry:    (entry: Omit<SkillDBEntry, 'id'>) => void
  updateEntry: (id: string, patch: Partial<SkillDBEntry>) => void
  removeEntry: (id: string) => void
  resetToDefault: () => void
  syncWithCatalog: () => void
}


function newId(): string {
  return `sk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

async function read(): Promise<SkillDBEntry[] | null> {
  try {
    const data = await window.dataAPI.read(FILE)
    return Array.isArray(data) ? (data as SkillDBEntry[]) : null
  } catch {
    return null
  }
}

async function write(entries: SkillDBEntry[]): Promise<void> {
  await window.dataAPI.write(FILE, entries)
}

// Seed inicial gerado a partir do MASTER_LIST do skillsDB.ts
const SEED: Omit<SkillDBEntry, 'id'>[] = [
  // Staff
  { name: 'Bola de Fogo em Série',         weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  manaCost: 0, grade: '', description: '', skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Onda Infernal',                  weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 15, skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Bombas de Fogo Concentradas',    weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 12, skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Erupção de Esfera de Mana',      weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Chuva de Fogo do Inferno',       weaponType: 'Staff',        category: 'active',  castTime: 2,    cooldown: 51, skillDmgPct: 0, bonusBaseDmg: 0, hits: 12, monsterBonus: 0, dmgBonus: 0 },
  { name: 'Raio em Cadeia',                 weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Barragem de Bola de Fogo',       weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 25, skillDmgPct: 0, bonusBaseDmg: 0, hits: 20, monsterBonus: 0, dmgBonus: 0 },
  { name: 'Raio do Julgamento',             weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Lança de Gelo',                  weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Cortina de fumaça de Gelo',      weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Paz Interior',                   weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Foco Elevado',                   weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Parede de Gelo',                 weaponType: 'Staff',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Wand & Tome
  { name: 'Toque de Desespero',             weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Explosão de Maldição',           weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Maldição Explosiva',             weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Círculo Mágico Corrompido',      weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Acerto Corrompido',              weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Raio do Desastre',               weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Salvação de Clay',               weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Fonte de Vida',                  weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Cura Rápida',                    weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Névoa Cármica',                  weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Dilatação do Tempo',             weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Feitiço de Contra-ataque',       weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Pesadelo Amaldiçoado',           weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Explosão Abissal',               weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Esfera de Mana',                 weaponType: 'Wand & Tome',  category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Longbow
  { name: 'Flecha Imobilizadora',           weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Disparo Preciso Decisivo',       weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Metralhar',                      weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Puxão do Zéfiro',               weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Ataque Rasante',                 weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Ponta de Flecha de Roxie',       weaponType: 'Longbow',      category: 'proc',    castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Onda Supersônica',               weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Bombardeio Decisivo',            weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Flecha Brutal',                  weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Marcador Mortal',                weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Flecha de Flash',                weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Vórtice de Flechas',             weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Toque Purificador',              weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Blitz',                          weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Disparo Básico',                 weaponType: 'Longbow',      category: 'active',  castTime: 1,    cooldown: 0,  manaCost: 0, grade: '', description: '', skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Crossbow
  { name: 'Fogo Rápido',                    weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  manaCost: 0, grade: '', description: '', skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Marca Mortal',                   weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Salto Ágil',                     weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Disparo Múltiplo',               weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Disparo de Recuo',               weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Barragem Impiedosa',             weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Apanhador de Vento',             weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Disparo no Ponto Fraco',         weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Difusão Abnegada',               weaponType: 'Crossbow',     category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Dagger
  { name: 'Golpe Sombrio',                  weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Golpe Vampírico',                weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Mutilação',                      weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Incisão Brutal',                 weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Arremesso de Faca',              weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Estigma Fatal',                  weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Luar Cortante',                  weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Dança de Espadas Frenética',     weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Injetar Veneno',                 weaponType: 'Dagger',       category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Greatsword
  { name: 'Golpe Duplo',                    weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Golpe Letal',                    weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Luta Valente',                   weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Lâmina Guilhotina',              weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Golpe Atordoador',               weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Impacto Devastador',             weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Corte Ascendente',               weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Corte Giratório',                weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Queda de Gaia',                  weaponType: 'Greatsword',   category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Sword & Shield
  { name: 'Golpe de Escudo',                weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Arremesso de Escudo',            weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Chance de Vitória',              weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Barreira de Contra-ataque',      weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Investida Estratégica',          weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Gancho de Corrente',             weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Confronto Feroz',                weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Rugido Provocativo',             weaponType: 'Sword & Shield', category: 'active', castTime: 1,   cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Spear
  { name: 'Arremesso de Lança',             weaponType: 'Spear',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Estocada Perfurante',            weaponType: 'Spear',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Corte de Ciclone',               weaponType: 'Spear',        category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Agravar Ferida',                 weaponType: 'Spear',        category: 'passive', castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Orb
  { name: 'Explosão de Alma',               weaponType: 'Orb',          category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Pulso Espiritual',               weaponType: 'Orb',          category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Amuleto da Sorte',               weaponType: 'Orb',          category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Escudo Etéreo',                  weaponType: 'Orb',          category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Copiar Satélite',                weaponType: 'Orb',          category: 'proc',    castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Invocar Satélite',               weaponType: 'Orb',          category: 'proc',    castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Escudo Caótico',                 weaponType: 'Orb',          category: 'active',  castTime: 1,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  // Item / Proc
  { name: 'Ascensão Dracônica',             weaponType: 'Item/Proc',    category: 'item',    castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Fome de Tevent em Fúria',        weaponType: 'Item/Proc',    category: 'item',    castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Toque em Degradação',            weaponType: 'Item/Proc',    category: 'proc',    castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Lança Destruidora',              weaponType: 'Item/Proc',    category: 'mastery', castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Víbora Mortal',                  weaponType: 'Item/Proc',    category: 'mastery', castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Bomba Relógio',                  weaponType: 'Item/Proc',    category: 'mastery', castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
  { name: 'Flor que Cai',                   weaponType: 'Item/Proc',    category: 'mastery', castTime: 0,    cooldown: 0,  skillDmgPct: 0, bonusBaseDmg: 0, hits: 1,  monsterBonus: 0, dmgBonus: 0 },
]

export const DEFAULT_ENTRIES: SkillDBEntry[] = SEED.map((s, i) => {
  const catalogSkill = SKILLS.find(cat => 
    cat.name.en.toLowerCase() === s.name.toLowerCase() || 
    cat.name.pt.toLowerCase() === s.name.toLowerCase()
  )
  return {
    ...s,
    id: `seed_${i}_${s.name.slice(0, 8).replace(/\s/g, '_')}`,
    nameEn: catalogSkill ? catalogSkill.name.en : s.name,
    cooldown: catalogSkill?.cooldownSec ?? s.cooldown,
    manaCost: catalogSkill?.manaCost ?? s.manaCost ?? 0,
    grade: catalogSkill?.grade ?? s.grade ?? '',
    description: catalogSkill?.description?.pt ?? s.description ?? '',
  }
})


export function filterSkillsByWeapons(
  entries: SkillDBEntry[],
  weaponTypes: string[],
): SkillDBEntry[] {
  return entries.filter(e =>
    weaponTypes.includes(e.weaponType) ||
    e.weaponType === 'Item/Proc' ||
    e.category === 'item' ||
    e.category === 'proc'
  )
}

export const useSkillsDB = create<SkillsDBState>((set, get) => ({
  entries: [],
  loading: false,

  loadFromDisk: async () => {
    set({ loading: true })
    const saved = await read()
    set({ entries: saved ?? DEFAULT_ENTRIES, loading: false })
    if (!saved) {
      write(DEFAULT_ENTRIES)
    } else {
      // Sincroniza dados novos do catálogo (como CDs recém-descobertos)
      get().syncWithCatalog()
    }
  },


  addEntry: (entry) => {
    const newEntry = { ...entry, id: newId() }
    const entries = [...get().entries, newEntry]
    set({ entries })
    write(entries)
  },

  updateEntry: (id, patch) => {
    const entries = get().entries.map(e => e.id === id ? { ...e, ...patch } : e)
    set({ entries })
    write(entries)
  },

  removeEntry: (id) => {
    const entries = get().entries.filter(e => e.id !== id)
    set({ entries })
    write(entries)
  },

  resetToDefault: () => {
    set({ entries: DEFAULT_ENTRIES })
    write(DEFAULT_ENTRIES)
  },

  syncWithCatalog: () => {
    const currentEntries = get().entries
    const updatedEntries = currentEntries.map(entry => {
      // Tenta encontrar a skill correspondente no catálogo por nome (PT ou EN)
      const catalogSkill = SKILLS.find(s => 
        s.name.en.toLowerCase() === entry.name.toLowerCase() || 
        s.name.pt.toLowerCase() === entry.name.toLowerCase() ||
        s.id === entry.id
      )

      if (catalogSkill) {
        return {
          ...entry,
          nameEn: catalogSkill.name.en,
          cooldown: catalogSkill.cooldownSec ?? entry.cooldown,
          manaCost: catalogSkill.manaCost ?? entry.manaCost ?? 0,
          grade: catalogSkill.grade ?? entry.grade ?? '',
          description: catalogSkill.description?.pt ?? entry.description ?? '',
        }
      }
      return {
        ...entry,
        manaCost: entry.manaCost ?? 0,
        grade: entry.grade ?? '',
        description: entry.description ?? '',
      }
    })

    set({ entries: updatedEntries })
    write(updatedEntries)
  }
}))

