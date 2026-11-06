import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/engine/groupHealingMeter.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { GroupHealingMeter } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

const meter = new GroupHealingMeter()
assert.equal(meter.addHealing({ connectionId: 'c1', sourceId: 1, targetId: 2, amount: 50, skillId: 8 }), false,
  'evento não deve inventar perfis')
assert.equal(meter.profile({ connectionId: 'c1', playerId: 1, name: 'A', confirmed: true }), true)
assert.equal(meter.profile({ connectionId: 'c1', playerId: 2, name: 'B', confirmed: true }), true)
assert.equal(meter.profile({ connectionId: 'c2', playerId: 1, name: 'A2', confirmed: true }), true)
assert.equal(meter.addHealing({ connectionId: 'c1', sourceId: 1, targetId: 2, amount: 50, skillId: 8, skillName: 'Cura' }), true)
assert.equal(meter.addHealing({ connectionId: 'c2', sourceId: 1, targetId: 2, amount: 900, skillId: 8 }), false,
  'ID igual em outra conexão não confirma o alvo')
assert.equal(meter.profile({ connectionId: 'c1', playerId: 1, name: 'Outro', confirmed: true }), false,
  'perfil existente não pode mudar de identidade')

const first = meter.snapshot()
assert.equal(first.events, 1)
assert.deepEqual(first.players.find(p => p.profile.name === 'A').done, {
  total: 50, hits: 1, skills: [{ skillId: 8, name: 'Cura', total: 50, hits: 1 }]
})
assert.equal(first.players.find(p => p.profile.name === 'B').received.total, 50)
assert.equal(first.players.find(p => p.profile.name === 'A2').done.total, 0)
assert.equal(Object.isFrozen(first) && Object.isFrozen(first.players) && Object.isFrozen(first.players[0].done.skills), true)
assert.throws(() => { first.players[0].done.total = 0 }, TypeError)
assert.equal(meter.snapshot().players.find(p => p.profile.name === 'A').done.total, 50,
  'snapshot imutável não altera estado interno')
console.log('OK: identidade por conexão, perfis confirmados, cura feita/recebida e snapshot imutável')
