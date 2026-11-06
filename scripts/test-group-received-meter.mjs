import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/engine/groupReceivedMeter.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { GroupReceivedMeter } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

const meter = new GroupReceivedMeter()
const event = (connectionId, segmentId, time, sourceId, targetId, skillId, damage) =>
  ({ connectionId, segmentId, time, sourceId, targetId, skillId, damage })

// Acumula por conexão, segmento, alvo confirmado, fonte e habilidade.
assert.equal(meter.profile('conn-a', 7, 'Luar'), true)
assert.equal(meter.profile('conn-a', 8, 'Atirador'), true)
assert.equal(meter.profile('conn-b', 7, 'Luar'), true, 'identidade confirmada deve ser observada separadamente em cada conexão')
assert.equal(meter.add(event('conn-a', 1, 1, 8, 7, 100, 30)), true)
assert.equal(meter.add({ ...event('conn-a', 1, 2, 9, 7, 100, 20), critical: true }), true)
assert.equal(meter.add({ ...event('conn-a', 1, 3, 8, 7, 101, 10), heavy: true }), true)
assert.equal(meter.add(event('conn-a', 2, 4, 8, 7, 100, 99)), true)
assert.equal(meter.add(event('conn-b', 1, 1, 8, 7, 100, 500)), true)
let [first, second, third] = meter.snapshot()
assert.equal(first.connectionId, 'conn-a')
assert.equal(first.segmentId, 1)
assert.equal(first.total, 60)
assert.equal(first.hits, 3)
assert.deepEqual(first.targets.map(row => [row.entity.id, row.entity.profileName, row.damage]), [[7, 'Luar', 60]])
assert.deepEqual(first.targets[0].sources.map(row => [row.entity.id, row.damage]), [[8, 40], [9, 20]])
assert.deepEqual(first.targets[0].skills.map(row => [row.skillId, row.damage, row.hits]), [[100, 50, 2], [101, 10, 1]])
assert.equal(first.targets[0].sources[0].skills[1].heavy, 1)
assert.equal(second.total, 99, 'segmentos diferentes devem ser independentes')
assert.equal(third.connectionId, 'conn-b')
assert.equal(third.total, 500, 'conexões diferentes devem ser independentes')

// Alvo sem perfil permanece explicitamente não resolvido e não entra no total.
meter.npcTemplate('conn-a', 20, 9001)
meter.add(event('conn-a', 1, 5, 8, 20, 102, 700))
meter.add(event('conn-a', 1, 6, 8, 21, 102, 800))
first = meter.snapshot('conn-a', 1)[0]
assert.equal(first.total, 60)
assert.equal(first.entities.find(row => row.id === 20).kind, 'npc')
assert.equal(first.entities.find(row => row.id === 20).evidence, 'npc-template')
assert.deepEqual(first.entities.find(row => row.id === 20).npcTemplateIds, [9001])
assert.equal(first.entities.find(row => row.id === 21).kind, 'unknown')
assert.equal(first.entities.find(row => row.id === 21).evidence, 'unresolved')

// Evidência que chega depois atribui os eventos do segmento sem inventar ID/nome.
meter.add(event('conn-a', 3, 10, 20, 22, 103, 12))
assert.equal(meter.snapshot('conn-a', 3)[0].total, 0)
meter.profile('conn-a', 22, 'Mago')
assert.equal(meter.snapshot('conn-a', 3)[0].total, 12)
assert.equal(meter.snapshot('conn-a', 3)[0].targets[0].entity.profileName, 'Mago')

// Evidências conflitantes tiram o alvo da agregação e preservam a ambiguidade.
meter.profile('conn-a', 20, 'Nome conflitante')
meter.profile('conn-a', 20, 'Outro nome')
meter.add(event('conn-a', 1, 7, 8, 20, 100, 50))
first = meter.snapshot('conn-a', 1)[0]
assert.equal(first.total, 60)
assert.equal(first.entities.find(row => row.id === 20).kind, 'conflict')
assert.equal(first.entities.find(row => row.id === 20).evidence, 'conflict')

// Snapshots e descendentes são imutáveis e não expõem estado interno mutável.
assert.ok(Object.isFrozen(first) && Object.isFrozen(first.targets) && Object.isFrozen(first.entities))
assert.ok(Object.isFrozen(first.targets[0]) && Object.isFrozen(first.targets[0].sources[0].skills))
assert.throws(() => first.targets[0].damage = 0, TypeError)
assert.throws(() => first.targets[0].sources.push({}), TypeError)
assert.equal(meter.snapshot('conn-a', 1)[0].total, 60)

// Validação de entrada e descarte de timestamps fora de ordem no mesmo segmento.
assert.equal(meter.add(event('conn-a', 1, 6, 8, 7, 100, 1000)), false)
assert.equal(meter.add({ ...event('conn-a', 1, 8, 8, 7, 0, 10) }), false)
assert.equal(meter.profile('conn-a', 7, ' Luar'), false)
meter.clear()
assert.deepEqual(meter.snapshot(), [])
console.log('group received meter: OK')
