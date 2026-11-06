import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''))
const reference = JSON.parse(fs.readFileSync(path.join(root, 'src/data/overlayNpcReference.json'), 'utf8'))
function compile(file) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  const localRequire = name => name.endsWith('/overlayNpcReference.json')
    ? reference
    : require(name)
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  return module.exports
}

const { classifyEncounterTemplate, classifyEncounterTargets } = compile('src/engine/overlayEncounterClassification.ts')
const idsByRank = Object.fromEntries(['boss', 'champion', 'elite', 'normal'].map(rank => [rank,
  Object.entries(reference.npcs).find(([, row]) => row.rank === rank && row.rankSource === 'creature-rank')?.[0],
]))
for (const [rank, id] of Object.entries(idsByRank)) {
  assert.ok(id, `referência deve conter NPC ${rank}`)
  const row = reference.npcs[id]
  assert.deepEqual(classifyEncounterTemplate(id), {
    templateId: id, name: row.name, rank, level: row.level, source: 'creature-rank',
  })
}

assert.deepEqual(classifyEncounterTemplate(999999999), {
  templateId: '999999999', rank: 'unresolved', source: 'unresolved',
}, 'ID desconhecido não recebe nome, nível ou classe inferidos')
const batch = classifyEncounterTargets([
  { templateId: idsByRank.elite, damage: 50 },
  { templateId: 999999999, damage: 5000 },
  { templateId: idsByRank.boss, damage: 1 },
])
assert.deepEqual(batch.targets.map(row => row.classification.rank), ['elite', 'unresolved', 'boss'])
assert.equal(batch.targets[0].target.damage, 50, 'conserva os campos originais do alvo')
assert.equal(batch.dominant.rank, 'boss', 'prioridade da classe domina o dano')
assert.equal(batch.dominant.templateId, idsByRank.boss)
assert.equal(classifyEncounterTargets([{ templateId: 999999999 }]).dominant, null)
assert.equal(classifyEncounterTargets([]).dominant, null)
console.log('overlay encounter classification: OK')
