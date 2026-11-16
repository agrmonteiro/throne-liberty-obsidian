import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const input = fs.readFileSync(new URL('../src/engine/overlayCombatEncounters.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { groupCombatSegments } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const segment = (id, connectionId, startedAt, endedAt, target, events = 10) => ({ id, connectionId, startedAt, endedAt,
  lastActivityAt: endedAt ?? startedAt + 1000, endReason: endedAt === null ? null : 'combat-exit', events,
  ...(target ? { dominantTarget: target } : {}) })

const boss = { templateId: '10130144', name: 'Quimer-Rex', rank: 'boss', level: 50 }
const normal = { templateId: '1001', name: 'Soldado', rank: 'normal', level: 50 }
const grouped = groupCombatSegments([
  segment(1, 'A', 1_000, 8_000, normal),
  segment(2, 'B', 1_800, 8_200, boss, 40),
  segment(3, 'C', 20_000, 28_000, normal),
])
assert.equal(grouped.length, 2, 'Conexões paralelas da mesma luta formam um único corte')
assert.deepEqual(grouped[0].segmentIds, [1, 2])
assert.equal(grouped[0].id, 'combat-1', 'ID do encontro permanece estável quando outro fluxo entra')
assert.equal(grouped[0].dominantTarget.name, 'Quimer-Rex', 'Chefe conhecido tem prioridade no rótulo')
assert.equal(grouped[1].endReason, 'combat-exit')

const active = groupCombatSegments([segment(4, 'A', 40_000, null, boss)])
assert.equal(active[0].endedAt, null)
assert.equal(active[0].endReason, null)
console.log('OK: cortes agrupam conexões paralelas, priorizam chefe e preservam combate ativo.')
