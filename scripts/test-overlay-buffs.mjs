import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''))
function compile(file) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }; new Function('require', 'module', 'exports', output)(require, module, module.exports)
  return module.exports
}
const { OverlayBuffTracker, validBuffEvent } = compile('src/engine/overlayBuffs.ts')
const { OverlayDeathRecorder } = compile('src/engine/overlayDeathLog.ts')
const { OverlayBuffLog } = compile('electron/main/overlayBuffLog.ts')
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'scripts/fixtures/overlay-buff-lifecycle.json'), 'utf8'))
let total = 0
for (const test of fixture.cases) {
  const tracker = new OverlayBuffTracker()
  const first = test.events[0]
  tracker.bind({ captureId: 'capture', connectionId: first.connectionId, playerId: first.expected.targetId })
  for (const frame of test.events) {
    const event = { ...frame.expected, time: frame.time, connectionId: frame.connectionId }
    assert(validBuffEvent(event))
    assert(['new-application', 'matched'].includes(tracker.accept(event)), test.name)
    total++
  }
  assert.equal(tracker.states().length, 0, test.name)
}
const tracker = new OverlayBuffTracker()
const frame = fixture.cases[0].events[0]
const event = { ...frame.expected, time: frame.time, connectionId: frame.connectionId }
const scope = { captureId: 'capture', connectionId: event.connectionId, playerId: event.targetId }
tracker.bind(scope); tracker.accept(event)
assert.equal(tracker.states().length, 1, 'O timer não apaga um efeito silencioso')
assert.equal(tracker.accept({ ...event, connectionId: 'other' }), 'outside-scope')
assert.equal(tracker.accept({ ...event, time: event.time-1 }), 'out-of-order')
const remove = { ...event, action: 'remove' }
assert.equal(tracker.accept({ ...remove, sourceId: event.sourceId + 1 }), 'metadata-conflict')
assert.equal(tracker.states().length, 1, 'Remoção conflitante não apaga o estado')
const update = { ...event, action: 'update', time: event.time + 1, previousSerialRaw: event.serialRaw, serialRaw: '18446744073709551615' }
assert.equal(tracker.accept(update), 'matched')
assert.equal(tracker.states()[0].serialRaw, update.serialRaw)
const copy = tracker.states(); copy[0].sourceId = 1
assert.equal(tracker.states()[0].sourceId, event.sourceId)
tracker.bind({ ...scope, captureId: 'new' }); assert.equal(tracker.states().length, 0)
assert.equal(tracker.accept(update), 'start-not-observed')
assert.equal(tracker.states()[0].startedAt, null)
assert(!validBuffEvent({ ...update, serialRaw: 18446744073709551615 }))
assert(!validBuffEvent({ ...update, serialRaw: '18446744073709551616' }))

const death = new OverlayDeathRecorder()
death.bind({ ...scope, playerName: 'Fixture', mode: 'live' })
death.setBuffs(tracker.states())
death.append({ type: 'buff', time: update.time, sourceId: update.sourceId, targetId: update.targetId, buff: update }, update.connectionId)
const report = death.capture(update.time + 1, 'manual')
assert.equal(report.events[0].type, 'buff')
assert.equal(report.buffs[0].serialRaw, update.serialRaw)
tracker.accept({ ...update, action: 'remove', time: update.time+2 })
assert.equal(death.list().records[0].buffs.length, 1, 'O recap conserva o snapshot anterior à remoção')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'throne-buffs-'))
const journal = new OverlayBuffLog(directory, 2000)
journal.start('capture'); journal.append({ type: 'buff', ...update }); journal.flush()
const file = journal.status().file
assert.equal(JSON.parse(fs.readFileSync(file, 'utf8').trim().split('\n')[1]).serialRaw, update.serialRaw)
journal.append({ type: 'buff', text: 'x'.repeat(3000) }); assert(journal.status().error)
assert.equal(journal.status().events, 1)
const before = fs.readFileSync(file, 'utf8')
journal.start('capture'); assert(journal.status().error, 'Não sobrescrever arquivo já existente')
assert.equal(fs.readFileSync(file, 'utf8'), before)
console.log(`OK: ${total} frames reais, silêncio, serial 64-bit, conflito, escopo, captura parcial, recap congelado e journal sem sobrescrita.`)
