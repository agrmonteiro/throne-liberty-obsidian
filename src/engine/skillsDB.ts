export type SkillCategory = 'active' | 'proc' | 'item' | 'mastery'

export interface SkillMapping {
  weapon: string
  category: SkillCategory
  icon?: string
}

interface SkillEntry {
  en: string
  pt: string
  weapon: string
  category?: SkillCategory
  icon?: string
}

const MASTER_LIST: SkillEntry[] = [
  // ─── ARCO LONGO (Longbow) ─────────────────────────────────────────
  { en: "Ensnaring Arrow",       pt: "Flecha Imobilizadora",    weapon: "Longbow", category: 'active' },
  { en: "Decisive Snipe",        pt: "Disparo Preciso Decisivo", weapon: "Longbow", category: 'active' },
  { en: "Strafing",              pt: "Metralhar",               weapon: "Longbow", category: 'active' },
  { en: "Zephyr's Nock",         pt: "Puxão do Zéfiro",         weapon: "Longbow", category: 'active' },
  { en: "Rushing Attack",        pt: "Ataque Rasante",          weapon: "Longbow", category: 'active' },
  { en: "Roxie's Arrowhead",     pt: "Ponta de Flecha de Roxie", weapon: "Longbow", category: 'proc' },
  { en: "Supersonic Wave",       pt: "Onda Supersônica",        weapon: "Longbow", category: 'active' },
  { en: "Decisive Bombardment",  pt: "Bombardeio Decisivo",     weapon: "Longbow", category: 'active' },
  { en: "Falling Flower",        pt: "Flor que Cai",            weapon: "Item/Proc",  category: 'mastery' },
  { en: "Brutal Arrow",          pt: "Flecha Brutal",           weapon: "Longbow", category: 'active' },
  { en: "Deadly Marker",         pt: "Marcador Mortal",         weapon: "Longbow", category: 'active' },
  { en: "Flash Arrow",           pt: "Flecha de Flash",         weapon: "Longbow", category: 'active' },
  { en: "Arrow Vortex",          pt: "Vórtice de Flechas",      weapon: "Longbow", category: 'active' },
  { en: "Purifying Touch",       pt: "Toque Purificador",       weapon: "Longbow", category: 'active' },
  { en: "Blitz",                 pt: "Blitz",                   weapon: "Longbow", category: 'active' },

  // ─── VARINHA E TOMO (Wand & Tome) ────────────────────────────────
  { en: "Touch of Despair",      pt: "Toque de Desespero",      weapon: "Wand & Tome", category: 'active' },
  { en: "Curse Explosion",       pt: "Explosão de Maldição",    weapon: "Wand & Tome", category: 'active' },
  { en: "Explosive Curse",       pt: "Maldição Explosiva",      weapon: "Wand & Tome", category: 'active' },
  { en: "Corrupted Magic Circle", pt: "Círculo Mágico Corrompido", weapon: "Wand & Tome", category: 'active' },
  { en: "Corrupted Hit",         pt: "Acerto Corrompido",       weapon: "Wand & Tome", category: 'active' },
  { en: "Ray of Disaster",       pt: "Raio do Desastre",        weapon: "Wand & Tome", category: 'active' },
  { en: "Clay's Salvation",      pt: "Salvação de Clay",        weapon: "Wand & Tome", category: 'active' },
  { en: "Fountain of Life",      pt: "Fonte de Vida",           weapon: "Wand & Tome", category: 'active' },
  { en: "Swift Healing",         pt: "Cura Rápida",             weapon: "Wand & Tome", category: 'active' },
  { en: "Karmic Haze",           pt: "Névoa Cármica",           weapon: "Wand & Tome", category: 'active' },
  { en: "Time Dilation",         pt: "Dilatação do Tempo",      weapon: "Wand & Tome", category: 'active' },
  { en: "Counterspell",         pt: "Feitiço de Contra-ataque", weapon: "Wand & Tome", category: 'active' },
  { en: "Cursed Nightmare",      pt: "Pesadelo Amaldiçoado",    weapon: "Wand & Tome", category: 'active' },

  // ─── CAJADO (Staff) ──────────────────────────────────────────────
  { en: "Serial Fireball",       pt: "Bola de Fogo em Série",   weapon: "Staff", category: 'active' },
  { en: "Chain Lightning",       pt: "Relâmpago em Cadeia",     weapon: "Staff", category: 'active' },
  { en: "Inferno Wave",          pt: "Onda Infernal",           weapon: "Staff", category: 'active' },
  { en: "Judgment Lightning",    pt: "Relâmpago do Julgamento", weapon: "Staff", category: 'active' },
  { en: "Serial Fire Bombs",      pt: "Bombas de Fogo Concentradas", weapon: "Staff",    category: 'active' },
  { en: "Mana Sphere Eruption",    pt: "Erupção de Esfera de Mana", weapon: "Staff",    category: 'active' },
  { en: "Inferno Rain",           pt: "Chuva de Fogo do Inferno",  weapon: "Staff",    category: 'active' },
  { en: "Chain Lightning",         pt: "Raio em Cadeia",           weapon: "Staff",    category: 'active' },
  { en: "Fireball Barrage",        pt: "Barragem de Bola de Fogo",  weapon: "Staff",    category: 'active' },
  { en: "Judgment Lightning",      pt: "Raio do Julgamento",       weapon: "Staff",    category: 'active' },
  { en: "Ice Spear",               pt: "Lança de Gelo",            weapon: "Staff",    category: 'active' },
  { en: "Frost Smokescreen",     pt: "Cortina de fumaça de Gelo", weapon: "Staff", category: 'active' },
  { en: "Inner Peace",           pt: "Paz Interior",            weapon: "Staff", category: 'active' },
  { en: "High Focus",            pt: "Foco Elevado",            weapon: "Staff", category: 'active' },
  { en: "Ice Wall",              pt: "Parede de Gelo",          weapon: "Staff", category: 'active' },

  // ─── BESTA (Crossbow) ─────────────────────────────────────────────
  { en: "Quick Fire",            pt: "Fogo Rápido",             weapon: "Crossbow", category: 'active' },
  { en: "Mortal Mark",           pt: "Marca Mortal",            weapon: "Crossbow", category: 'active' },
  { en: "Nimble Leap",           pt: "Salto Ágil",              weapon: "Crossbow", category: 'active' },
  { en: "Multi-Shot",            pt: "Disparo Múltiplo",        weapon: "Crossbow", category: 'active' },
  { en: "Recoil Shot",           pt: "Disparo de Recuo",        weapon: "Crossbow", category: 'active' },
  { en: "Merciless Barrage",     pt: "Barragem Impiedosa",      weapon: "Crossbow", category: 'active' },
  { en: "Wind Snatcher",         pt: "Apanhador de Vento",      weapon: "Crossbow", category: 'active' },
  { en: "Weak Point Shot",       pt: "Disparo no Ponto Fraco",  weapon: "Crossbow", category: 'active' },
  { en: "Self-less Diffusion",   pt: "Difusão Abnegada",        weapon: "Crossbow", category: 'active' },

  // ─── ADAGA (Dagger) ───────────────────────────────────────────────
  { en: "Shadow Strike",         pt: "Golpe Sombrio",           weapon: "Dagger", category: 'active' },
  { en: "Vampiric Strike",       pt: "Golpe Vampírico",         weapon: "Dagger", category: 'active' },
  { en: "Mutilation",            pt: "Mutilação",               weapon: "Dagger", category: 'active' },
  { en: "Brutal Incision",       pt: "Incisão Brutal",          weapon: "Dagger", category: 'active' },
  { en: "Knife Throwing",        pt: "Arremesso de Faca",       weapon: "Dagger", category: 'active' },
  { en: "Fatal Stigma",          pt: "Estigma Fatal",           weapon: "Dagger", category: 'active' },
  { en: "Cleaving Moonlight",    pt: "Luar Cortante",           weapon: "Dagger", category: 'active' },
  { en: "Frenzied Sword Dance",  pt: "Dança de Espadas Frenética", weapon: "Dagger", category: 'active' },
  { en: "Inject Venom",          pt: "Injetar Veneno",          weapon: "Dagger", category: 'active' },

  // ─── ESPADÃO (Greatsword) ─────────────────────────────────────────
  { en: "Double Slash",          pt: "Golpe Duplo",             weapon: "Greatsword", category: 'active' },
  { en: "Death Blow",            pt: "Golpe Letal",             weapon: "Greatsword", category: 'active' },
  { en: "Valiant Brawl",         pt: "Luta Valente",            weapon: "Greatsword", category: 'active' },
  { en: "Guillotine Blade",      pt: "Lâmina Guilhotina",       weapon: "Greatsword", category: 'active' },
  { en: "Stunning Blow",         pt: "Golpe Atordoador",        weapon: "Greatsword", category: 'active' },
  { en: "Devastating Smash",     pt: "Impacto Devastador",      weapon: "Greatsword", category: 'active' },
  { en: "Ascending Slash",       pt: "Corte Ascendente",        weapon: "Greatsword", category: 'active' },
  { en: "Willbreaker",           pt: "Corte Giratório",         weapon: "Greatsword", category: 'active' },
  { en: "Gaia Crash",            pt: "Queda de Gaia",           weapon: "Greatsword", category: 'active' },

  // ─── ESPADA E ESCUDO (Sword & Shield) ─────────────────────────────
  { en: "Shield Strike",         pt: "Golpe de Escudo",         weapon: "Sword & Shield", category: 'active' },
  { en: "Shield Throw",          pt: "Arremesso de Escudo",     weapon: "Sword & Shield", category: 'active' },
  { en: "A Shot at Victory",     pt: "Chance de Vitória",       weapon: "Sword & Shield", category: 'active' },
  { en: "Counter Barrier",       pt: "Barreira de Contra-ataque", weapon: "Sword & Shield", category: 'active' },
  { en: "Strategic Rush",        pt: "Investida Estratégica",   weapon: "Sword & Shield", category: 'active' },
  { en: "Chain Hook",            pt: "Gancho de Corrente",      weapon: "Sword & Shield", category: 'active' },
  { en: "Fierce Clash",          pt: "Confronto Feroz",         weapon: "Sword & Shield", category: 'active' },
  { en: "Provoking Roar",        pt: "Rugido Provocativo",      weapon: "Sword & Shield", category: 'active' },

  // ─── LANÇA (Spear) ────────────────────────────────────────────────
  { en: "Spear Throw",           pt: "Arremesso de Lança",      weapon: "Spear",     category: 'active' },
  { en: "Piercing Strike",       pt: "Estocada Perfurante",     weapon: "Spear",     category: 'active' },
  { en: "Cyclone Slash",         pt: "Corte de Ciclone",        weapon: "Spear",     category: 'active' },
  { en: "Worsen Wound",          pt: "Agravar Ferida",          weapon: "Spear",     category: 'active' },

  // ─── ORBE MÁGICO / AMULETO (Orb) ──────────────────────────────────
  { en: "Soul Burst",            pt: "Explosão de Alma",        weapon: "Orb",       category: 'active' },
  { en: "Spirit Pulse",          pt: "Pulso Espiritual",        weapon: "Orb",       category: 'active' },
  { en: "Charm of Luck",         pt: "Amuleto da Sorte",        weapon: "Orb",       category: 'active' },
  { en: "Ethereal Shield",       pt: "Escudo Etéreo",           weapon: "Orb",       category: 'active' },
  { en: "Copiar Satélite",       pt: "Copiar Satélite",          weapon: "Orb",         category: 'proc' },
  { en: "Invocar Satélite",      pt: "Invocar Satélite",         weapon: "Orb",         category: 'proc' },
  { en: "Chaotic Shield",        pt: "Escudo Caótico",          weapon: "Orb",       category: 'active' },

  // ─── EFEITOS DE ITENS, MAESTRIAS E PROCS (Categorizados) ──────────
  { en: "Abyssal Explosion",     pt: "Explosão Abissal",        weapon: "Wand & Tome", category: 'active' },
  { en: "Mana Sphere",           pt: "Esfera de Mana",          weapon: "Wand & Tome", category: 'active' },
  { en: "Dragon's Ascension",    pt: "Ascensão Dracônica",      weapon: "Item/Proc",  category: 'item' },
  { en: "Tevent's Famine",       pt: "Fome de Tevent em Fúria", weapon: "Item/Proc",  category: 'item' },
  { en: "Decay Touch",           pt: "Toque em Degradação",     weapon: "Item/Proc",  category: 'proc' },
  { en: "Destructive Spear",     pt: "Lança Destruidora",        weapon: "Item/Proc",  category: 'mastery' },
  { en: "Mortal Viper",           pt: "Víbora Mortal",            weapon: "Item/Proc",  category: 'mastery' },
  { en: "Clockwork Bomb",         pt: "Bomba Relógio",            weapon: "Item/Proc",  category: 'mastery' },

  { en: "Basic Shot",            pt: "Disparo Básico",          weapon: "Longbow",    category: 'active' },
]

export const SKILLS_DB: Record<string, SkillMapping> = {}

MASTER_LIST.forEach(entry => {
  const mapping: SkillMapping = { 
    weapon: entry.weapon, 
    category: entry.category || 'active', 
    icon: entry.icon 
  }
  if (entry.en) SKILLS_DB[entry.en] = mapping
  if (entry.pt) SKILLS_DB[entry.pt] = mapping
})

export function getSkillInfo(skillName: string): SkillMapping | null {
  const baseName = skillName.split('(')[0].trim()
  return SKILLS_DB[baseName] || null
}

export function getWeaponBySkill(skillName: string): string | null {
  return getSkillInfo(skillName)?.weapon || null
}
