#!/usr/bin/env node
/**
 * Gera src/data/masteryTrees.ts a partir de masteries_reference.md
 *
 * Uso: node scripts/gen-mastery-trees.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC  = join(ROOT, 'masteries_reference.md')
const DEST = join(ROOT, 'src', 'data', 'masteryTrees.ts')

// ── Parser ─────────────────────────────────────────────────────────────────────

const text = readFileSync(SRC, 'utf8')
const lines = text.split('\n')

const RE_WEAPON  = /^### (.+) \(ID: (\d+)\)/
const RE_BRANCH  = /^#### Ramo (\d+)/
const RE_NODE    = /^- \*\*Col (\d+)\*\* \| (.+?) \(ID: (\d+)\)/
const RE_DESC    = /^  - \*(.+)\*\s*$/
const RE_PASSIVE = /Níveis da Passiva/

function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const weapons = []
let curWeapon = null
let curBranch = null
let curNode   = null

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  const mW = line.match(RE_WEAPON)
  if (mW) {
    if (curNode && curWeapon && curBranch) curBranch.nodes.push(curNode)
    curNode = null
    curWeapon = { weapon_id: Number(mW[2]), weapon_name: mW[1], branches: [] }
    curBranch = null
    weapons.push(curWeapon)
    continue
  }

  const mB = line.match(RE_BRANCH)
  if (mB) {
    if (curNode && curWeapon && curBranch) curBranch.nodes.push(curNode)
    curNode = null
    curBranch = { branch: Number(mB[1]), nodes: [] }
    curWeapon.branches.push(curBranch)
    continue
  }

  const mN = line.match(RE_NODE)
  if (mN) {
    if (curNode && curBranch) curBranch.nodes.push(curNode)
    curNode = {
      id: Number(mN[3]),
      column: Number(mN[1]),
      branch: curBranch ? curBranch.branch : 0,
      name: mN[2].trim(),
      description: '',
      isSkillNode: Number(mN[3]) >= 20000,
      hasPassiveLevels: false,
    }
    continue
  }

  const mD = line.match(RE_DESC)
  if (mD && curNode && !curNode.description) {
    curNode.description = stripHtml(mD[1])
    continue
  }

  if (RE_PASSIVE.test(line) && curNode) {
    curNode.hasPassiveLevels = true
  }
}

// Flush último nó
if (curNode && curBranch) curBranch.nodes.push(curNode)

// ── Flatten para WeaponMasteryTree ─────────────────────────────────────────────

const trees = weapons.map(w => ({
  weapon_id:   w.weapon_id,
  weapon_name: w.weapon_name,
  nodes:       w.branches.flatMap(b => b.nodes),
}))

// ── Gerar TypeScript ────────────────────────────────────────────────────────────

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

const lines_out = [
  '// GERADO AUTOMATICAMENTE — não edite manualmente',
  '// Fonte: masteries_reference.md',
  '// Gerar novamente: node scripts/gen-mastery-trees.mjs',
  '',
  'export interface MasteryNode {',
  '  id:                number',
  '  column:            number',
  '  branch:            number',
  '  name:              string',
  '  description:       string',
  '  isSkillNode:       boolean  // true para nós 20xxx (passivas especiais)',
  '  hasPassiveLevels:  boolean  // true para nós com escala por nível',
  '}',
  '',
  'export interface WeaponMasteryTree {',
  '  weapon_id:   number',
  '  weapon_name: string',
  '  nodes:       MasteryNode[]',
  '}',
  '',
  'export const MASTERY_TREES: WeaponMasteryTree[] = [',
]

for (const tree of trees) {
  lines_out.push(`  // ── ${tree.weapon_name} ──`)
  lines_out.push(`  {`)
  lines_out.push(`    weapon_id: ${tree.weapon_id},`)
  lines_out.push(`    weapon_name: '${tree.weapon_name}',`)
  lines_out.push(`    nodes: [`)
  for (const n of tree.nodes) {
    lines_out.push(`      { id: ${String(n.id).padEnd(5)}, column: ${n.column}, branch: ${n.branch}, isSkillNode: ${String(n.isSkillNode).padEnd(5)}, hasPassiveLevels: ${String(n.hasPassiveLevels).padEnd(5)}, name: \`${esc(n.name)}\`, description: \`${esc(n.description)}\` },`)
  }
  lines_out.push(`    ],`)
  lines_out.push(`  },`)
}

lines_out.push(']')
lines_out.push('')
lines_out.push('// ── Helpers ──────────────────────────────────────────────────────────────────')
lines_out.push('')
lines_out.push('export const masteryTreeByWeapon = (weaponName: string): WeaponMasteryTree | undefined =>')
lines_out.push("  MASTERY_TREES.find(t => t.weapon_name.toLowerCase() === weaponName.toLowerCase())")
lines_out.push('')
lines_out.push('export const masteryNodeById = (id: number): MasteryNode | undefined =>')
lines_out.push("  MASTERY_TREES.flatMap(t => t.nodes).find(n => n.id === id)")
lines_out.push('')
lines_out.push('export const skillNodesForWeapon = (weaponName: string): MasteryNode[] =>')
lines_out.push("  masteryTreeByWeapon(weaponName)?.nodes.filter(n => n.isSkillNode) ?? []")
lines_out.push('')

const output = lines_out.join('\n')
writeFileSync(DEST, output, 'utf8')

const nodeCount = trees.reduce((a, t) => a + t.nodes.length, 0)
console.log(`✅ ${DEST}`)
console.log(`   ${trees.length} armas · ${nodeCount} nós`)
