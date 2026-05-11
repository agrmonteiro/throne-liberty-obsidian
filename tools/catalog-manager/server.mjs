// Rodar com: node --import tsx/esm server.mjs
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../')

const toURL = p => pathToFileURL(p).href

const { SKILLS: _skills }              = await import(toURL(path.join(ROOT, 'src/data/skills.ts')))
const { SKILL_ENHANCEMENTS: _enhs }    = await import(toURL(path.join(ROOT, 'src/data/skillEnhancements.ts')))
const { WEAPON_MASTERIES: _masteries } = await import(toURL(path.join(ROOT, 'src/data/weaponMasteries.ts')))

// cópias mutáveis em memória
let skills      = _skills.map(s => ({ ...s, enhancementIds: [...s.enhancementIds] }))
let enhancements = _enhs.map(e => ({ ...e }))
let masteries   = _masteries.map(m => ({ ...m, stats: [...m.stats] }))

const app = express()
app.use(express.json({ limit: '20mb' }))
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  next()
})
app.options('*', (_, res) => res.sendStatus(204))

// ── GET ────────────────────────────────────────────────────────────────────────
app.get('/api/skills',       (_, res) => res.json(skills))
app.get('/api/enhancements', (_, res) => res.json(enhancements))
app.get('/api/masteries',    (_, res) => res.json(masteries))

app.get('/api/stats', (_, res) => {
  const weaponSet = w => [...new Set(w.map(x => x.weapon))].sort()
  res.json({
    skills:       { total: skills.length,      weapons: weaponSet(skills) },
    enhancements: { total: enhancements.length },
    masteries:    { total: masteries.length,   weapons: weaponSet(masteries) },
  })
})

// ── PUT ────────────────────────────────────────────────────────────────────────
app.put('/api/skill/:id', (req, res) => {
  const idx = skills.findIndex(s => s.id === req.params.id)
  if (idx < 0) return res.status(404).json({ error: 'not found' })
  skills[idx] = { ...skills[idx], ...req.body }
  res.json(skills[idx])
})

app.put('/api/enhancement/:id', (req, res) => {
  const idx = enhancements.findIndex(e => e.id === req.params.id)
  if (idx < 0) return res.status(404).json({ error: 'not found' })
  enhancements[idx] = { ...enhancements[idx], ...req.body }
  res.json(enhancements[idx])
})

app.put('/api/mastery/:id', (req, res) => {
  const idx = masteries.findIndex(m => m.id === req.params.id)
  if (idx < 0) return res.status(404).json({ error: 'not found' })
  masteries[idx] = { ...masteries[idx], ...req.body }
  res.json(masteries[idx])
})

// ── Vincular/desvincular enhancement de uma skill ─────────────────────────────
app.post('/api/skill/:skillId/link/:enhId', (req, res) => {
  const skill = skills.find(s => s.id === req.params.skillId)
  if (!skill) return res.status(404).json({ error: 'skill not found' })
  if (!skill.enhancementIds.includes(req.params.enhId))
    skill.enhancementIds.push(req.params.enhId)
  res.json(skill)
})

app.delete('/api/skill/:skillId/link/:enhId', (req, res) => {
  const skill = skills.find(s => s.id === req.params.skillId)
  if (!skill) return res.status(404).json({ error: 'skill not found' })
  skill.enhancementIds = skill.enhancementIds.filter(id => id !== req.params.enhId)
  res.json(skill)
})

// ── POST /api/save ─────────────────────────────────────────────────────────────
app.post('/api/save', (_, res) => {
  try {
    fs.writeFileSync(path.join(ROOT, 'src/data/skills.ts'),          genSkills(skills),      'utf8')
    fs.writeFileSync(path.join(ROOT, 'src/data/skillEnhancements.ts'), genEnhancements(enhancements), 'utf8')
    fs.writeFileSync(path.join(ROOT, 'src/data/weaponMasteries.ts'), genMasteries(masteries), 'utf8')
    res.json({ ok: true, saved: { skills: skills.length, enhancements: enhancements.length, masteries: masteries.length } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Geradores de TypeScript ────────────────────────────────────────────────────
const q  = v => JSON.stringify(v)
const l10 = v => v ? `{ en: ${q(v.en)}, pt: ${q(v.pt)} }` : 'undefined'
const opt = v => v === undefined || v === null ? 'undefined' : q(v)

function genSkills(data) {
  return `// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg — skills level 15 (en + pt)

export type L10n = { en: string; pt: string }

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
}

export const SKILLS: Skill[] = [
${data.map(s => `  {
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
    enhancementIds: ${JSON.stringify(s.enhancementIds)},
  }`).join(',\n')}
]
`
}

function genEnhancements(data) {
  return `// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg — skill enhancements (en + pt)

import type { L10n } from './skills'

export interface SkillEnhancement {
  id: string
  name: L10n
  baseSkillName: L10n
  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string
  effect: L10n
  unlockLevel?: number
  requiredPoints?: number
  description: L10n
}

export const SKILL_ENHANCEMENTS: SkillEnhancement[] = [
${data.map(e => `  {
    id: ${q(e.id)},
    name: { en: ${q(e.name.en)}, pt: ${q(e.name.pt)} },
    baseSkillName: { en: ${q(e.baseSkillName.en)}, pt: ${q(e.baseSkillName.pt)} },
    grade: ${q(e.grade)},
    effect: { en: ${q(e.effect.en)}, pt: ${q(e.effect.pt)} },
    unlockLevel: ${opt(e.unlockLevel)},
    requiredPoints: ${opt(e.requiredPoints)},
    description: { en: ${q(e.description.en)}, pt: ${q(e.description.pt)} },
  }`).join(',\n')}
]
`
}

function genMasteries(data) {
  return `// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg — weapon masteries level 10 (en + pt)

import type { L10n } from './skills'

export interface MasteryStat {
  label: L10n
  value: string
}

export interface WeaponMastery {
  id: string
  name: L10n
  weapon: string
  category: L10n
  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string
  stats: MasteryStat[]
  description: L10n
}

export const WEAPON_MASTERIES: WeaponMastery[] = [
${data.map(m => `  {
    id: ${q(m.id)},
    name: { en: ${q(m.name.en)}, pt: ${q(m.name.pt)} },
    weapon: ${q(m.weapon)},
    category: { en: ${q(m.category.en)}, pt: ${q(m.category.pt)} },
    grade: ${q(m.grade)},
    stats: ${JSON.stringify(m.stats)},
    description: { en: ${q(m.description.en)}, pt: ${q(m.description.pt)} },
  }`).join(',\n')}
]
`
}

app.listen(3002, () => console.log('[api] http://localhost:3002'))
