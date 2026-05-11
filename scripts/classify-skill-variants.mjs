#!/usr/bin/env node
// Classifica variantes de skill e grava variantOf/variantType/variantIds em skills.ts

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../')
const { SKILLS: _skills } = await import(pathToFileURL(path.join(ROOT, 'src/data/skills.ts')).href)

// ── Extração do nome de skill do ID ──────────────────────────────────────────

function skillNamePart(id) {
  if (id.startsWith('SkillSet_WP_')) {
    const m = id.match(/_S_(.+)$/)
    return m ? m[1] : null
  }
  if (id.startsWith('WP_')) {
    // WP_{weapon}_{weapon2}_S_{rest} ou WP_{weapon}_S_{rest}
    const m = id.match(/^WP_[A-Z0-9]+(?:_[A-Z0-9]+)?_S_(.+)$/i)
    // ORB usa formato WP_ORB_Active_{rest}
    if (!m) {
      const m2 = id.match(/^WP_ORB_Active_(.+)$/)
      return m2 ? `Active_${m2[1]}` : null
    }
    return m[1]
  }
  if (id.startsWith('SW2_S_')) return id.replace('SW2_S_', '')
  return null
}

// ── Classificação das flags da variante ──────────────────────────────────────

const VARIANT_FLAGS = [
  [/Hero/i,              'hero'],
  [/Charge/i,            'charge'],
  [/Canmove|CanMove/i,   'canmove'],
  [/_SP\d?$|_SP_/,       'specialization'],
  [/Trait\d|trait_\d/i,  'trait'],
  [/_Move$/,             'move'],
  [/Boss/i,              'boss'],
  [/NoneTarget/i,        'notarget'],
  [/Onetarget/i,         'onetarget'],
]

function classifyVariant(variantPart, rootPart) {
  const suffix = variantPart.slice(rootPart.length)
  const flags = VARIANT_FLAGS.filter(([re]) => re.test(suffix)).map(([, f]) => f)
  return flags.length ? flags : ['state']
}

// ── Construção do mapa de variantes ──────────────────────────────────────────

const skills   = _skills.map(s => ({ ...s, enhancementIds: [...s.enhancementIds] }))
const roots    = skills.filter(s => s.id.startsWith('SkillSet_'))
const variants = skills.filter(s => !s.id.startsWith('SkillSet_'))

// resultado: para cada skill, quais campos novos adicionar
const variantOf    = {}  // variantId → rootId
const variantType  = {}  // variantId → string[]
const variantIds   = {}  // rootId → string[]

variants.forEach(v => {
  const vPart = skillNamePart(v.id)
  if (!vPart) return

  let bestRoot = null, bestLen = 0

  // Tenta match por arma primeiro, depois sem restrição
  for (const restrictWeapon of [true, false]) {
    roots.forEach(r => {
      if (restrictWeapon && r.weapon !== v.weapon) return
      const rPart = skillNamePart(r.id)
      if (!rPart) return
      if (vPart.startsWith(rPart) && rPart.length > bestLen) {
        bestLen = rPart.length
        bestRoot = r
      }
    })
    if (bestRoot) break
  }

  if (bestRoot) {
    const rPart = skillNamePart(bestRoot.id)
    variantOf[v.id]   = bestRoot.id
    variantType[v.id] = classifyVariant(vPart, rPart)
    if (!variantIds[bestRoot.id]) variantIds[bestRoot.id] = []
    variantIds[bestRoot.id].push(v.id)
  }
})

// ── Relatório ─────────────────────────────────────────────────────────────────

const linked   = Object.keys(variantOf).length
const orphaned = variants.filter(v => !variantOf[v.id])
const typeCounts = {}
Object.values(variantType).flat().forEach(f => { typeCounts[f] = (typeCounts[f]||0)+1 })

console.log(`Raízes:          ${roots.length}`)
console.log(`Variantes total: ${variants.length}`)
console.log(`Linkadas:        ${linked}`)
console.log(`Órfãs:           ${orphaned.length}`)
console.log('\nDistribuição de tipos:')
Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${k}: ${v}`))
if (orphaned.length) {
  console.log('\nÓrfãs (sem raiz encontrada):')
  orphaned.forEach(v => console.log(`  ${v.id}`))
}

// ── Gerador de skills.ts com campos novos ─────────────────────────────────────

const q   = v => JSON.stringify(v)
const opt = v => (v === undefined || v === null) ? 'undefined' : q(v)
const l10 = v => v ? `{ en: ${q(v.en)}, pt: ${q(v.pt)} }` : 'undefined'
const arr = v => v?.length ? JSON.stringify(v) : 'undefined'

const output = `// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg — skills level 15 (en + pt)

export type L10n = { en: string; pt: string }

export type SkillVariantFlag =
  | 'charge'         // versão carregada da skill
  | 'canmove'        // permite movimento durante o cast
  | 'hero'           // ativada com maestria hero
  | 'specialization' // caminho de especialização (_SP)
  | 'trait'          // com trait específico ativo
  | 'move'           // variante com movimento
  | 'boss'           // versão específica para boss
  | 'notarget'       // sem alvo necessário
  | 'onetarget'      // alvo único
  | 'state'          // outro estado mecânico

export interface Skill {
  id: string
  name: L10n
  weapon: string
  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string
  type: 'active' | 'passive' | 'defensive' | string
  cooldownSec?: number
  manaCost?: number
  skillType?: L10n
  useFormat?: L10n
  description: L10n
  enhancementIds: string[]
  // Hierarquia de variantes
  variantOf?: string             // ID da skill raiz (SkillSet_*) — só presente em variantes
  variantType?: SkillVariantFlag[] // flags que descrevem este estado: charge, canmove, hero…
  variantIds?: string[]           // IDs das variantes desta raiz — só presente na skill raiz
}

export const SKILLS: Skill[] = [
${skills.map(s => {
  const vOf  = variantOf[s.id]
  const vTyp = variantType[s.id]
  const vIds = variantIds[s.id]
  return `  {
    id: ${q(s.id)},
    name: { en: ${q(s.name.en)}, pt: ${q(s.name.pt)} },
    weapon: ${q(s.weapon)},
    grade: ${q(s.grade)},
    type: ${q(s.type)},
    cooldownSec: ${opt(s.cooldownSec)},
    manaCost: ${opt(s.manaCost)},
    skillType: ${l10(s.skillType)},
    useFormat: ${l10(s.useFormat)},
    description: { en: ${q(s.description.en)}, pt: ${q(s.description.pt)} },
    enhancementIds: ${JSON.stringify(s.enhancementIds)},${vOf  ? `\n    variantOf: ${q(vOf)},`   : ''}${vTyp ? `\n    variantType: ${JSON.stringify(vTyp)},` : ''}${vIds ? `\n    variantIds: ${JSON.stringify(vIds)},`   : ''}
  }`
}).join(',\n')}
]
`

fs.writeFileSync(path.join(ROOT, 'src/data/skills.ts'), output, 'utf8')
console.log('\n✓ src/data/skills.ts atualizado.')
