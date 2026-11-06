import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/engine/overlaySegments.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { OverlaySegments } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

const segments = new OverlaySegments(100)
segments.enterCombat('conn-a', 7, 1000)
segments.addEvent({ connectionId: 'conn-a', actorId: 7, at: 1010, data: { damage: 20 } })
segments.enterCombat('conn-b', 7, 1011)
segments.addEvent({ connectionId: 'conn-b', actorId: 7, at: 1020, data: { damage: 5 } })
segments.addEvent({ connectionId: 'conn-a', actorId: 8, at: 1030, data: { damage: 3 } })

const original = segments.getSnapshot('conn-a', 7)
assert.equal(original.active.events.length, 1)
assert.equal(segments.getSnapshot('conn-b', 7).active.events.length, 1)
assert.equal(segments.getSnapshot('conn-a', 8).active.events.length, 1)
assert.ok(Object.isFrozen(original) && Object.isFrozen(original.active) && Object.isFrozen(original.active.events))
segments.addEvent({ connectionId: 'conn-a', actorId: 7, at: 1040, data: { damage: 10 } })
assert.equal(original.active.events.length, 1, 'snapshot anterior não muda')

const exited = segments.exitCombat('conn-a', 7, 1050)
assert.equal(exited.endReason, 'combat-exit')
assert.equal(exited.endedAt, 1050)
assert.equal(segments.getSnapshot('conn-a', 7).active, null)
assert.equal(segments.getSnapshot('conn-a', 7).closed.length, 1)

assert.equal(segments.expire(1130), 2, 'expira separadamente os dois segmentos restantes')
assert.equal(segments.getSnapshot('conn-b', 7).closed[0].endReason, 'inactivity')
assert.equal(segments.getSnapshot('conn-a', 8).closed[0].endReason, 'inactivity')
assert.equal(segments.addEvent({ connectionId: 'conn-a', actorId: 7, at: 1200, data: { damage: 1 } }).events.length, 1)
assert.equal(segments.getSnapshot('conn-a', 7).closed.length, 1, 'atividade posterior inicia outro segmento')
assert.equal(segments.exitCombat('unknown', 1, 2000), null)
console.log('overlay segments: OK')
