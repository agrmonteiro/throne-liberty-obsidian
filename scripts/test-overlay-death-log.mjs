import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''))
function compile(file, resolve = require) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }; new Function('require', 'module', 'exports', output)(resolve, module, module.exports)
  return module.exports
}
const core = compile('src/engine/overlayDeathLog.ts')
const recorder = new core.OverlayDeathRecorder()
const scope = { captureId: 'capture', connectionId: 'A', playerId: 7, playerName: 'AgrMonteiro', mode: 'live' }
recorder.bind(scope)
for (let time = 1; time <= 65; time++) recorder.append({ type: 'damage', time, sourceId: 8, targetId: 7, damage: time }, 'A')
assert.equal(recorder.list().recent.length, 50)
assert.equal(recorder.list().recent[0].time, 16)
assert.equal(recorder.append({ type: 'damage', time: 100, sourceId: 8, targetId: 9 }, 'A'), false)
assert.equal(recorder.append({ type: 'damage', time: 100, sourceId: 8, targetId: 7 }, 'B'), false)
const raw = { opcode: '0x12346f6d', bytes: 7, bodyHex: '010203', truncated: false, direction: 'server-to-client', fields: { 1: ['18446744073709551615'] } }
const state = { type: 'state', targetId: 7, time: 66, stateCode: 2, raw }
assert.equal(recorder.observeState(state, 'A', false), null)
const report = recorder.observeState({ ...state, time: 67 }, 'A', true)
assert.equal(report.events.length, 50)
assert.equal(report.events.at(-1).time, 66)
assert.equal(report.signal.raw.fields[1][0], '18446744073709551615')
raw.fields[1][0] = 'modified'
assert.notEqual(recorder.list().records[0].signal.raw.fields[1][0], 'modified')
assert.equal(recorder.observeState({ ...state, time: 68 }, 'A', true), null, 'No duplicate state reports')
recorder.observeState({ ...state, time: 69, stateCode: 1 }, 'A', false)
assert.equal(recorder.list().recent.length, 1, 'Experimental alive state rearms a fresh buffer')
assert.ok(recorder.observeState({ ...state, time: 70 }, 'A', true))
recorder.append({ type: 'damage', sourceId: 7, targetId: 8, damage: 99, time: 71 }, 'A')
assert.equal(recorder.list().records[0].events.length, 1)
for (let time = 72; time < 99; time++) recorder.capture(time, 'manual')
assert.equal(recorder.list().records.length, 20)
const copy = recorder.list(); copy.records[0].events.length = 0
assert.notEqual(recorder.list().records[0].events.length, 0)
recorder.bind({ ...scope, connectionId: 'C' })
assert.equal(recorder.list().recent.length, 0)
assert.equal(recorder.list().records.length, 20)
recorder.bind(null); assert.equal(recorder.capture(100, 'manual'), null)
const fatal = new core.OverlayDeathRecorder(); fatal.bind(scope)
for (let time = 1; time <= 51; time++) fatal.observeDamage({type:'damage',time,sourceId:8,targetId:7,damage:1},'A',false,true)
const killingHit={type:'damage',time:52,sourceId:8,targetId:7,damage:823,raw}
assert.equal(fatal.observeDamage(killingHit,'B',true,false),null)
assert.equal(fatal.observeDamage({...killingHit,targetId:9},'A',true,false),null)
const fatalReport=fatal.observeDamage(killingHit,'A',true,false)
assert.equal(fatalReport.trigger,'damage-signal'); assert.equal(fatalReport.events.length,50)
assert.equal(fatalReport.events.at(-1).damage,823,'Fatal hit is included in last 50')
assert.equal(fatal.observeState({type:'state',time:53,targetId:7,stateCode:2},'A',true),null,'No second state report for same death')
assert.equal(fatal.observeDamage({...killingHit,time:51},'A',false,true),null,'Late packet does not rearm')
assert.equal(fatal.observeDamage({...killingHit,time:54},'A',true,false),null)
fatal.observeDamage({...killingHit,time:60},'A',false,true)
assert.equal(fatal.list().recent.length,1,'A later positive life observation rearms a new buffer')
assert.equal(fatal.observeState({type:'state',time:52,targetId:7,stateCode:2},'A',true),null,'Old state does not create a second death after rearm')
assert.ok(fatal.observeDamage({...killingHit,time:61},'A',true,false))
const { OverlayDeathLog } = compile('electron/main/overlayDeathLog.ts', name => name.endsWith('/overlayDeathLog') ? core : require(name))
const dir = fs.mkdtempSync(path.join(root, 'scratch', 'death-test-'))
const file = path.join(dir, 'deaths.json')
const store = new OverlayDeathLog(file)
store.recorder.bind(scope); store.recorder.append({ type: 'healing', sourceId: 7, targetId: 7, time: 1, healing: 521, raw }, 'A')
store.recorder.capture(2, 'manual'); store.save()
const loaded = new OverlayDeathLog(file)
assert.deepEqual(loaded.list().records, store.list().records)
assert.equal(loaded.list().recent.length, 0, 'Buffer volatile; reports persist')
fs.writeFileSync(file, '{invalid')
const invalid = new OverlayDeathLog(file); assert.ok(invalid.list().error); invalid.save()
assert.equal(fs.readFileSync(file, 'utf8'), '{invalid', 'Never overwrite unreadable history')
console.log('OK: last 50, freeze, rearm, manual, scope, clones, 20 reports, atomic persistence and invalid-file preservation.')
