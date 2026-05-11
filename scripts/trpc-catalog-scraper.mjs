#!/usr/bin/env node
/**
 * trpc-catalog-scraper.mjs
 * ========================
 * Coleta skills, traits e especializações do questlog.gg via API tRPC.
 * Substitui o catalog_scraper.py (Playwright) para dados de skill/trait.
 * Masteries _Skill ainda precisam do scrape-mastery-skills.py.
 *
 * Uso:
 *   node scripts/trpc-catalog-scraper.mjs
 *   node scripts/trpc-catalog-scraper.mjs --dry-run   # imprime, não grava
 *   node scripts/trpc-catalog-scraper.mjs --skip-pt   # apenas en (mais rápido)
 *
 * Gera:
 *   src/data/skills.ts            (SkillSet_* raízes + WP_* especializações)
 *   src/data/skillEnhancements.ts (traits com unlockLevel, points, skillSetId)
 *
 * Depois rode:
 *   node --import ./tools/catalog-manager/node_modules/tsx/dist/esm/index.mjs \
 *        scripts/classify-skill-variants.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT    = path.resolve(fileURLToPath(import.meta.url), '../../')
const OUT_DIR = path.join(ROOT, 'src', 'data')

const BASE    = 'https://questlog.gg/throne-and-liberty/api/trpc'
const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
}

const args     = process.argv.slice(2)
const DRY_RUN  = args.includes('--dry-run')
const SKIP_PT  = args.includes('--skip-pt')

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) { process.stderr.write(`[trpc-catalog] ${msg}\n`) }

async function trpc(procedure, input) {
  const qs  = `?input=${encodeURIComponent(JSON.stringify(input))}`
  const url = `${BASE}/${procedure}${qs}`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`tRPC ${procedure} → HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`tRPC ${procedure} error: ${JSON.stringify(json.error)}`)
  return json.result.data
}

// ── Mapeamentos ───────────────────────────────────────────────────────────────

const GRADE_MAP = { 11: 'Common', 21: 'Uncommon', 31: 'Rare', 41: 'Epic' }
const WEAPON_MAP = {
  bow:       'Longbow',
  crossbow:  'Crossbow',
  sword2h:   'Greatsword',
  spear:     'Spear',
  orb:       'Orb',
  staff:     'Staff',
  dagger:    'Dagger',
  sword:     'Sword',
  wand:      'Wand',
  shared:    'Shared',
}
const TYPE_MAP = {
  active:    'active',
  passive:   'passive',
  defensive: 'defensive',
}

function gradeStr(n) { return GRADE_MAP[n] ?? String(n) }
function weaponStr(c) { return WEAPON_MAP[c?.toLowerCase()] ?? c ?? '' }
function typeStr(t) { return TYPE_MAP[t?.toLowerCase()] ?? t ?? 'active' }

/** Pega description + cooldown + mana do nível 15 (ou o mais alto disponível) */
function fromLevels(levels) {
  if (!levels?.length) return { description: '', cooldownSec: undefined, manaCost: undefined }
  const lv15 = levels.find(l => l.skill_level === 15) ?? levels[levels.length - 1]
  return {
    description:  stripHtml(lv15.description ?? ''),
    cooldownSec:  lv15.cooldown  ? Number(lv15.cooldown)   : undefined,
    manaCost:     lv15.mana_cost ? Number(lv15.mana_cost)  : undefined,
  }
}

/** Pega effect + description do nível 1 de um trait (efeito não muda, só escala) */
function fromTraitLevels(levels) {
  if (!levels?.length) return { effect: '', description: '' }
  const lv = levels[levels.length - 1]  // nível máximo
  return {
    effect:      stripHtml(lv.effect ?? ''),
    description: stripHtml(lv.description ?? ''),
  }
}

function stripHtml(s) {
  return (s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Fetch dos dados ───────────────────────────────────────────────────────────

async function fetchSkillSets(language) {
  log(`  getSkillSets (${language})…`)
  const data = await trpc('skillBuilder.getSkillSets', { language })
  log(`    → ${data?.length ?? 0} items`)
  return data ?? []
}

async function fetchSkillTraits(language) {
  log(`  getSkillTraits (${language})…`)
  const data = await trpc('skillBuilder.getSkillTraits', { language })
  log(`    → ${data?.length ?? 0} items`)
  return data ?? []
}

// ── Processamento de skills ───────────────────────────────────────────────────

/**
 * Constrói mapa { id → skillEntry } a partir de getSkillSets.
 * Processa tanto as raízes (SkillSet_*) quanto as especializações embutidas (WP_*).
 */
function buildSkillMap(enItems, ptItems) {
  const ptById = {}
  for (const s of ptItems) {
    ptById[s.id] = s
    for (const sp of (s.specializations ?? [])) ptById[sp.id] = sp
  }

  const skills = {}

  for (const s of enItems) {
    const pt    = ptById[s.id] ?? {}
    const lvEn  = fromLevels(s.skillSetLevels)
    const lvPt  = fromLevels(pt.skillSetLevels)

    // IDs dos traits desta skill (serão preenchidos depois pelo trait pass)
    const enhancementIds = []

    skills[s.id] = {
      id:            s.id,
      name:          { en: s.name ?? '', pt: pt.name ?? '' },
      weapon:        weaponStr(s.mainCategory),
      grade:         gradeStr(s.grade),
      type:          typeStr(s.skillType ?? s.enchantCategory),
      cooldownSec:   lvEn.cooldownSec,
      manaCost:      lvEn.manaCost,
      description:   { en: lvEn.description, pt: lvPt.description },
      enhancementIds,
      // campos de hierarquia — preenchidos pelo classify-skill-variants.mjs
      variantOf:   undefined,
      variantType: undefined,
      variantIds:  undefined,
    }

    // Especializações embutidas → entram como skills separadas (WP_* com variantOf)
    for (const sp of (s.specializations ?? [])) {
      const ptSp   = ptById[sp.id] ?? {}
      const spLvEn = fromLevels(sp.skillSetLevels)
      const spLvPt = fromLevels(ptSp.skillSetLevels)

      skills[sp.id] = {
        id:            sp.id,
        name:          { en: sp.name ?? '', pt: ptSp.name ?? '' },
        weapon:        weaponStr(s.mainCategory),  // herda da raiz
        grade:         gradeStr(sp.grade ?? s.grade),
        type:          typeStr(sp.skillType ?? sp.enchantCategory),
        cooldownSec:   spLvEn.cooldownSec,
        manaCost:      spLvEn.manaCost,
        description:   { en: spLvEn.description, pt: spLvPt.description },
        enhancementIds: [],
        // já conhecemos o pai e o tipo
        variantOf:     sp.skillSetParent ?? s.id,
        variantType:   ['specialization'],
        variantIds:    undefined,
        // trait obrigatório para usar a especialização
        requiredTraits: sp.skillSetRequiredTraits ?? [],
      }
    }
  }

  return skills
}

// ── Processamento de traits ───────────────────────────────────────────────────

function buildTraitList(enItems, ptItems) {
  const ptById = {}
  for (const t of ptItems) ptById[t.id] = t

  const traits = []

  for (const t of enItems) {
    const pt    = ptById[t.id] ?? {}
    const efEn  = fromTraitLevels(t.skillTraitLevels)
    const efPt  = fromTraitLevels(pt.skillTraitLevels)

    // Nome: API retorna "SkillName - TraitName", extraímos só a skill base
    const nameParts = (t.name ?? '').split(' - ')
    const baseNameEn = nameParts.length > 1 ? nameParts.slice(0, -1).join(' - ') : t.name ?? ''

    const ptNameParts = (pt.name ?? '').split(' - ')
    const baseNamePt  = ptNameParts.length > 1 ? ptNameParts.slice(0, -1).join(' - ') : pt.name ?? ''

    traits.push({
      id:            t.id,
      name:          { en: t.name ?? '', pt: pt.name ?? '' },
      rawName:       { en: t.rawName ?? '', pt: pt.rawName ?? '' },  // nome só do efeito, sem prefixo da skill
      baseSkillName: { en: baseNameEn, pt: baseNamePt },
      skillSetId:    t.skillSetId ?? '',   // liga ao SkillSet_ pai
      groupId:       t.groupId ?? null,    // traits do mesmo groupId são mutuamente exclusivos
      grade:         gradeStr(t.grade ?? 11),
      effect:        { en: efEn.effect,      pt: efPt.effect },
      description:   { en: efEn.description, pt: efPt.description },
      unlockLevel:   t.unlockLevel  ? Number(t.unlockLevel)  : undefined,
      requiredPoints: t.points      ? Number(t.points)       : undefined,
    })
  }

  return traits
}

// ── Vínculo trait → skill (preenche enhancementIds) ──────────────────────────

function linkTraitsToSkills(skills, traits) {
  for (const t of traits) {
    const parentId = t.skillSetId
    if (!parentId) continue
    const skill = skills[parentId]
    if (!skill) { log(`  WARN: trait ${t.id} → skill ${parentId} não encontrada`) ; continue }
    if (!skill.enhancementIds.includes(t.id)) {
      skill.enhancementIds.push(t.id)
    }
  }
}

// ── Geradores TypeScript ──────────────────────────────────────────────────────

const q   = v => JSON.stringify(v)
const opt = v => (v === undefined || v === null) ? 'undefined' : JSON.stringify(v)
const arr = v => v?.length ? JSON.stringify(v) : 'undefined'
const l10 = v => v ? `{ en: ${q(v.en)}, pt: ${q(v.pt)} }` : '{ en: "", pt: "" }'

function generateSkillsTs(skillMap) {
  const skills = Object.values(skillMap).sort((a, b) => a.id.localeCompare(b.id))

  return `// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg tRPC skillBuilder.getSkillSets + classify-skill-variants.mjs

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
  description: L10n
  enhancementIds: string[]
  requiredTraits?: string[]        // especializações: traits necessários para ativar
  variantOf?: string               // ID da skill raiz — só em variantes
  variantType?: SkillVariantFlag[] // flags do estado desta variante
  variantIds?: string[]            // raiz: IDs de todas as variantes
}

export const SKILLS: Skill[] = [
${skills.map(s => `  {
    id: ${q(s.id)},
    name: ${l10(s.name)},
    weapon: ${q(s.weapon)},
    grade: ${q(s.grade)},
    type: ${q(s.type)},
    cooldownSec: ${opt(s.cooldownSec)},
    manaCost: ${opt(s.manaCost)},
    description: ${l10(s.description)},
    enhancementIds: ${JSON.stringify(s.enhancementIds)},${s.requiredTraits?.length ? `\n    requiredTraits: ${JSON.stringify(s.requiredTraits)},` : ''}${s.variantOf  ? `\n    variantOf: ${q(s.variantOf)},`          : ''}${s.variantType ? `\n    variantType: ${JSON.stringify(s.variantType)},` : ''}${s.variantIds  ? `\n    variantIds: ${JSON.stringify(s.variantIds)},`   : ''}
  }`).join(',\n')}
]
`
}

function generateEnhancementsTs(traits) {
  return `// GERADO AUTOMATICAMENTE — não edite manualmente
// Fonte: questlog.gg tRPC skillBuilder.getSkillTraits

export type L10n = { en: string; pt: string }

export interface SkillEnhancement {
  id: string
  name: L10n
  rawName: L10n                  // nome só do efeito, sem prefixo "SkillName - "
  baseSkillName: L10n
  skillSetId: string             // ID da SkillSet_* pai
  groupId: string | null         // traits do mesmo grupo são mutuamente exclusivos
  grade: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | string
  effect: L10n
  unlockLevel?: number
  requiredPoints?: number
  description: L10n
}

export const SKILL_ENHANCEMENTS: SkillEnhancement[] = [
${traits.map(t => `  {
    id: ${q(t.id)},
    name: ${l10(t.name)},
    rawName: ${l10(t.rawName)},
    baseSkillName: ${l10(t.baseSkillName)},
    skillSetId: ${q(t.skillSetId)},
    groupId: ${t.groupId ? q(t.groupId) : 'null'},
    grade: ${q(t.grade)},
    effect: ${l10(t.effect)},
    unlockLevel: ${opt(t.unlockLevel)},
    requiredPoints: ${opt(t.requiredPoints)},
    description: ${l10(t.description)},
  }`).join(',\n')}
]
`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log('=== trpc-catalog-scraper ===')
  log(`dry-run: ${DRY_RUN} | skip-pt: ${SKIP_PT}`)

  // 1. Skills
  log('\n── Skills ──')
  const skillsEn = await fetchSkillSets('en')
  const skillsPt = SKIP_PT ? [] : await fetchSkillSets('pt')

  // 2. Traits
  log('\n── Traits ──')
  const traitsEn = await fetchSkillTraits('en')
  const traitsPt = SKIP_PT ? [] : await fetchSkillTraits('pt')

  // 3. Processar
  log('\n── Processando ──')
  const skillMap = buildSkillMap(skillsEn, skillsPt)
  const traits   = buildTraitList(traitsEn, traitsPt)
  linkTraitsToSkills(skillMap, traits)

  const roots   = Object.values(skillMap).filter(s => !s.variantOf)
  const variants = Object.values(skillMap).filter(s => !!s.variantOf)
  log(`  Skills raiz:         ${roots.length}`)
  log(`  Especializações WP_: ${variants.length}`)
  log(`  Traits:              ${traits.length}`)

  // Relatório de cobertura de descriptions
  const rootsWithDesc  = roots.filter(s => s.description.en)
  const traitsWithEff  = traits.filter(t => t.effect.en)
  const traitsWithDesc = traits.filter(t => t.description.en)
  log(`  Roots com desc:      ${rootsWithDesc.length}/${roots.length}`)
  log(`  Traits com effect:   ${traitsWithEff.length}/${traits.length}`)
  log(`  Traits com desc:     ${traitsWithDesc.length}/${traits.length}`)

  // Armas cobertas
  const weapons = [...new Set(roots.map(s => s.weapon))].sort()
  log(`  Armas: ${weapons.join(', ')}`)

  // 4. Gerar TS
  log('\n── Gerando TypeScript ──')
  const skillsTs = generateSkillsTs(skillMap)
  const enhTs    = generateEnhancementsTs(traits)

  if (DRY_RUN) {
    log('dry-run: arquivos não gravados.')
    log(`  skills.ts:            ${skillsTs.length} chars`)
    log(`  skillEnhancements.ts: ${enhTs.length} chars`)
  } else {
    fs.writeFileSync(path.join(OUT_DIR, 'skills.ts'), skillsTs, 'utf8')
    fs.writeFileSync(path.join(OUT_DIR, 'skillEnhancements.ts'), enhTs, 'utf8')
    log(`  ✓ src/data/skills.ts`)
    log(`  ✓ src/data/skillEnhancements.ts`)
    log('\nPróximo passo: rodar classify-skill-variants.mjs para hierarquia de variantes.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
