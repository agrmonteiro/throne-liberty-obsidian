#!/usr/bin/env node
// Patch: deriva e preenche o campo weapon="" nos arquivos gerados skills.ts e weaponMasteries.ts

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../')

// ── Mapeamentos ────────────────────────────────────────────────────────────────

const SKILL_WEAPON_MAP = {
  'BO': 'Longbow', 'CR': 'Crossbow', 'ORB': 'Orb',
  'SP': 'Spear', 'ST': 'Staff', 'SW2': 'Greatsword',
  'DA': 'Dagger', 'SW': 'Sword', 'SH': 'Sword', 'WA': 'Wand',
}

const MASTERY_WEAPON_MAP = {
  'Dagger': 'Dagger', 'Sword': 'Sword', 'Wand': 'Wand',
  'Bow': 'Longbow', 'Crossbow': 'Crossbow', 'Greatsword': 'Greatsword',
  'Spear': 'Spear', 'Staff': 'Staff', 'Orb': 'Orb', 'WM': 'Shared',
}

function deriveSkillWeapon(id) {
  const parts = id.split('_')
  if (id.startsWith('SkillSet_WP_')) return SKILL_WEAPON_MAP[parts[2]] || ''
  if (id.startsWith('WP_')) return SKILL_WEAPON_MAP[parts[1]] || ''
  if (id.startsWith('SW2_')) return 'Greatsword'
  return ''
}

function deriveMasteryWeapon(id) {
  return MASTERY_WEAPON_MAP[id.split('_')[0]] || ''
}

// ── Patcher de arquivo ─────────────────────────────────────────────────────────

/**
 * Percorre o texto procurando blocos de objeto com id + weapon vazio.
 * Quando encontra `weapon: "",`, olha para trás para achar o id do bloco
 * e substitui pelo weapon correto.
 */
function patchFile(filePath, deriveWeapon) {
  const text = fs.readFileSync(filePath, 'utf8')

  let fixed = 0
  let unresolved = 0

  // Regex: captura o id e o `weapon: "",` dentro do mesmo bloco
  // Estratégia: substituição linha a linha preservando contexto
  const lines = text.split('\n')
  let currentId = null
  const result = []

  for (const line of lines) {
    // Detecta linha de id
    const idMatch = line.match(/^\s*id:\s*"([^"]+)"/)
    if (idMatch) currentId = idMatch[1]

    // Detecta weapon vazio
    const weaponEmptyMatch = line.match(/^(\s*weapon:\s*)"",/)
    if (weaponEmptyMatch && currentId) {
      const weapon = deriveWeapon(currentId)
      if (weapon) {
        result.push(line.replace(`weapon: "",`, `weapon: "${weapon}",`))
        fixed++
        continue
      } else {
        unresolved++
        console.warn(`  ! Sem weapon para id: ${currentId}`)
      }
    }

    result.push(line)
  }

  fs.writeFileSync(filePath, result.join('\n'), 'utf8')
  return { fixed, unresolved }
}

// ── Executar ───────────────────────────────────────────────────────────────────

const skillsPath = path.join(ROOT, 'src/data/skills.ts')
const masteriesPath = path.join(ROOT, 'src/data/weaponMasteries.ts')

console.log('Patchando skills.ts...')
const s = patchFile(skillsPath, deriveSkillWeapon)
console.log(`  ✓ ${s.fixed} corrigidas, ${s.unresolved} não resolvidas`)

console.log('Patchando weaponMasteries.ts...')
const m = patchFile(masteriesPath, deriveMasteryWeapon)
console.log(`  ✓ ${m.fixed} corrigidas, ${m.unresolved} não resolvidas`)

console.log('\nPronto.')
