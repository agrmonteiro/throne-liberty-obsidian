import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''))
function compile(relative, resolve) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', output)(resolve, module, module.exports)
  return module.exports
}
const engine = compile('src/engine/overlayMeter.ts', require)
const layout = compile('src/engine/overlayLayout.ts', require)
function harness(startAt = 1000000) {
  let now = startAt
  const handlers = new Map(), children = [], records = new Map()
  class Clock extends Date { static now() { return now } }
  class Child extends EventEmitter {
    stdout = new EventEmitter()
    stderr = new EventEmitter()
    kill() {}
  }
  const owner = new EventEmitter()
  owner.isDestroyed = () => false
  owner.webContents = { send() {} }
  const fakeFs = { existsSync: () => true, readFileSync: () => { throw Error('Empty test profile') }, mkdirSync() {}, writeFileSync() {} }
  class History {
    list() { return { encounters: [...records.values()].map(row => structuredClone(row)), error: null } }
    upsert(row) { if (row.session.hits || row.session.received?.hits || row.session.healing?.done.hits || row.session.timed) records.set(row.id, structuredClone(row)) }
    clear() { records.clear() }
  }
  class UnknownLog { status() { return {} } record() {} flush() {} resetAfterClear() {} }
  const electron = { app: { getPath: () => root, getAppPath: () => root, isPackaged: false },
    BrowserWindow: class {}, dialog: {}, screen: {},
    globalShortcut: { register: () => true, unregister() {} },
    ipcMain: { handle: (key, fn) => handlers.set(key, fn), removeHandler: key => handlers.delete(key) } }
  const resolve = name => {
    if (name === 'electron') return electron
    if (name === 'fs') return fakeFs
    if (name === 'child_process') return { spawn: (_file, args) => { const child = new Child(); child.args = args; children.push(child); return child } }
    if (name === '@electron-toolkit/utils') return { is: { dev: false } }
    if (name.endsWith('/overlayMeter')) return engine
    if (name.endsWith('/overlayLayout')) return layout
    if (name.endsWith('/overlaySkillReference')) return { overlaySkillNames: {}, overlaySkillFiles: {} }
    if (name === './overlayHistory') return { OverlayHistory: History }
    if (name === './overlayUnknownLog') return { OverlayUnknownLog: UnknownLog }
    if (name === './overlayCleanup') return { clearMeterLogFiles() {} }
    if (name.endsWith('overlaySkillNames.json')) return {}
    return require(name)
  }
  const output = ts.transpileModule(fs.readFileSync(path.join(root, 'electron/main/overlay.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', '__dirname', 'Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', output)(
    resolve, module, module.exports, root, Clock, () => 0, () => {}, () => 0, () => {})
  module.exports.registerOverlay(owner)
  handlers.get('overlay:configure')({}, { playerName: 'AgrMonteiro' })
  const state = () => handlers.get('overlay:get')()
  const start = () => handlers.get('overlay:start')()
  const configure = patch => handlers.get('overlay:configure')({}, patch)
  const send = message => {
    const at = message.event?.time ?? message.time
    if (Number.isFinite(at)) now = Math.max(now, at * 1000)
    const child = children.findLast(row => row.args.some(value => value.endsWith('npcap-overlay-worker.py')))
    child.stdout.emit('data', Buffer.from(JSON.stringify(message) + '\n'))
  }
  return { state, start, configure, send, records,
    pause: value => handlers.get('overlay:pause')({}, value), advance: ms => { now += ms },
    timer: action => handlers.get('overlay:timer')({}, action),
    reset: () => handlers.get('overlay:reset')(), history: () => handlers.get('overlay:history')(), close: () => owner.emit('closed') }
}
const damage = (id, time, amount, connectionId = 'A') => ({ type: 'damage', connectionId,
  event: { sourceId: id, time, damage: amount, skillId: 1, criticalCandidate: false, heavyCandidate: 0 } })
const player = (id, time, connectionId = 'A') => ({ type: 'identity', name: 'AgrMonteiro', sourceId: id, time, connectionId })
const h = harness()
try {
  h.start()
  h.send(damage(1, 1001, 9999))
  assert.equal(h.state().config.sourceId, null)
  h.send(damage(2, 1002, 100))
  h.send(player(2, 1002.1))
  assert.equal(h.state().config.sourceId, 2)
  assert.equal(h.state().session.total, 100, 'Primeiro ataque anterior ao sinal local deve ser recuperado uma só vez')
  const initialEncounter = h.state().capture.encounterId
  h.send(player(2, 1003)); h.send(player(2, 1004))
  assert.equal(h.state().capture.encounterId, initialEncounter)
  h.send(damage(1, 1005, 999999)); h.send(damage(2, 1006, 70))
  assert.equal(h.state().session.total, 170)
  h.send(damage(3, 1007, 333)); h.send(player(3, 1008))
  assert.equal(h.state().session.total, 333)
  assert.notEqual(h.state().capture.encounterId, initialEncounter)
  assert.equal(h.records.get(initialEncounter).session.total, 170)
  assert.equal(h.records.get(initialEncounter).connectionId, 'A')
  h.send(damage(3, 1009, 444, 'B')); h.send(player(3, 1010, 'B'))
  assert.equal(h.state().session.total, 444, 'ID numérico repetido em outra conexão não pode misturar acumulados')
  assert.equal(h.state().sources.find(row => row.id === 3).damage, 444)
  h.send(player(2, 1011, 'A')); h.send(damage(3, 1012, 9999999, 'A'))
  assert.equal(h.state().session.total, 444)
  h.send({ type: 'connection-closed', connectionId: 'B', time: 1013 })
  assert.equal(h.state().session.total, 0)
  assert.equal(h.state().config.sourceId, null)
  h.send(player(3, 1014, 'B')); h.send(damage(3, 1015, 9999999, 'B'))
  assert.equal(h.state().capture.player, null)
  assert.equal(h.state().sources.length, 0)
  h.send(player(4, 1016, 'C')); h.send(damage(4, 1017, 500, 'C'))
  h.configure({ sourceId: 1 })
  h.send(player(5, 1018, 'C')); h.send(damage(5, 1019, 999, 'C'))
  assert.equal(h.state().config.sourceId, 1, 'Origem manual não deve ser trocada automaticamente')
  h.configure({ sourceId: null })
  assert.equal(h.state().config.sourceId, 5)
  assert.equal(h.state().session.total, 999)
  h.history()
  const previous = [...h.records.keys()].at(-1)
  h.configure({ reviewEncounterId: previous })
  h.reset()
  assert.equal(h.state().config.reviewEncounterId, null)
  assert.equal(h.state().session.total, 0)
  assert.equal(h.state().config.sourceId, 5)
  h.send(player(5, 1020, 'C'))
  assert.equal(h.state().session.total, 0, 'Sinal repetido após reset não pode ressomar eventos antigos')
} finally { h.close() }
console.log('OK: backend real com NPC inicial, primeiros ataques, troca de entidade/conexão, pacotes tardios, seleção manual e reset.')

const pausedLive = harness()
try {
  pausedLive.start(); pausedLive.send({ type: 'status', state: 'live', message: 'test' })
  pausedLive.send(player(7, 1001)); pausedLive.send(damage(7, 1002, 100))
  pausedLive.advance(1000); pausedLive.pause(true)
  const encounter = pausedLive.state().capture.encounterId
  pausedLive.send(damage(7, 2000, 9999))
  assert.equal(pausedLive.state().session.total, 100)
  assert.equal(pausedLive.state().session.elapsedSec, 1)
  pausedLive.pause(false); pausedLive.send(player(7, 2001)); pausedLive.send(damage(7, 2002, 50))
  assert.equal(pausedLive.state().session.total, 150)
  assert.equal(pausedLive.state().session.elapsedSec, 3)
  assert.equal(pausedLive.state().capture.encounterId, encounter, 'Pausa longa não pode fragmentar o encontro')
  pausedLive.send({ ...damage(8, 2003, 70), event: { ...damage(8, 2003, 70).event, targetId: 7 } })
  assert.equal(pausedLive.state().session.received.total, 70)
  pausedLive.send({ type: 'healing', connectionId: 'A', event: { time: 2004, sourceId: 7, targetId: 7,
    skillId: 963905802, effectId: 963250776, healing: 521, coverage: 'self-periodic' } })
  assert.equal(pausedLive.state().session.healing.done.total, 521)
  assert.equal(pausedLive.state().session.healing.received.total, 521)
  assert.equal(pausedLive.state().session.total, 150, 'Cura não pode alterar dano no backend')
} finally { pausedLive.close() }
console.log('OK: pausa no IPC real, sem recuperação de backlog ou troca de sessão, e dano recebido separado.')

const trial = harness()
try {
  trial.start(); trial.send({ type: 'status', state: 'live', message: 'test' }); trial.send(player(7, 1001))
  trial.configure({ countdownSec: 3, durationSec: 10 })
  trial.timer('start')
  const start = trial.state().timer.startsAt / 1000, end = trial.state().timer.endsAt / 1000
  assert.equal(trial.state().timer.phase, 'countdown')
  trial.send(damage(7, start - .001, 9999))
  assert.equal(trial.state().session.total, 0)
  trial.send(damage(7, start, 100))
  assert.equal(trial.state().timer.phase, 'running')
  trial.send(damage(7, end - .001, 200))
  trial.send(damage(7, end, 9999))
  trial.advance(20000)
  assert.equal(trial.state().timer.phase, 'finished')
  assert.equal(trial.state().session.total, 300)
  assert.equal(trial.state().session.elapsedSec, 10)
  assert.equal(trial.state().session.dps, 30)
  trial.history()
  assert.equal([...trial.records.values()].at(-1).reason, 'timed-end')
  trial.timer('clear')
  assert.equal(trial.state().timer, undefined)
  trial.send(damage(7, end + 21, 50))
  assert.equal(trial.state().session.total, 50)
  trial.timer('start'); trial.advance(500); trial.timer('cancel')
  assert.equal(trial.state().timer.phase, 'cancelled')
  assert.equal(trial.state().session.total, 0)
} finally { trial.close() }
console.log('OK: cronômetro no backend real: preparação excluída, início incluso, fim exclusivo, duração/DPS exatos e resultado congelado sem novos pacotes.')

const named = harness()
try {
  named.configure({ playerName: 'AgrMonteiro' }); named.start()
  named.send({ type: 'local-player', sourceId: 88, time: 1001, connectionId: 'A' }); named.send(damage(88, 1002, 9999))
  assert.equal(named.state().config.sourceId, null, 'Sinal de terceiros não pode selecionar a origem quando há nome configurado')
  named.send({ type: 'identity', sourceId: 7, name: 'AgrMonteiro', connectionId: 'A', time: 1003 })
  assert.equal(named.state().config.sourceId, 7)
  assert.equal(named.state().capture.player.method, 'profile-name')
  named.send({ type: 'local-player', sourceId: 88, time: 1004, connectionId: 'A' }); named.send(damage(7, 1005, 100))
  assert.equal(named.state().config.sourceId, 7, 'Sinal ambíguo na mesma conexão não pode roubar o medidor')
  assert.equal(named.state().session.total, 100)
} finally { named.close() }
console.log('OK: nome confirmado pelo perfil impede primeiro atacante indevido e trocas pelo sinal ambíguo de terceiros.')

const folder = path.join(root, 'capturas_treinamento/npcap_tl/20261030-094453-reference')
const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'))
const reference = JSON.parse(fs.readFileSync(path.join(folder, 'reference.json'), 'utf8'))
const expectedEntities = JSON.parse(fs.readFileSync(path.join(folder, 'entities.json'), 'utf8')).filter(row => row.roles.includes('local-player-signal'))
assert.equal(expectedEntities.length, 1)
const expected = expectedEntities[0]
const real = harness(Date.parse(manifest.startedAtUtc))
try {
  real.start()
  // Esta referência antiga não contém o perfil nominal; usar a origem confirmada manualmente.
  real.configure({ sourceId: Number(expected.entityId) })
  for (const line of fs.readFileSync(path.join(folder, 'events.jsonl'), 'utf8').trim().split('\n')) real.send(JSON.parse(line))
  const state = real.state()
  assert.equal(state.config.sourceId, Number(expected.entityId))
  assert.equal(state.session.total, expected.outgoingDamage)
  assert.equal(state.session.hits, expected.outgoingHits)
  assert.equal(state.session.received.total, expected.incomingDamage)
  assert.equal(state.session.received.hits, expected.incomingHits)
  assert.equal(state.session.received.sources.reduce((sum, row) => sum + row.damage, 0), expected.incomingDamage)
  assert.equal(state.session.received.skills.reduce((sum, row) => sum + row.damage, 0), expected.incomingDamage)
  assert.equal(state.config.autoSource, false)
  assert.equal(state.config.reviewEncounterId, null)
  assert.equal(state.status, 'live')
  real.history()
  assert.equal(real.records.size, 1, 'Sinais locais repetidos e conexões secundárias encerradas não devem fragmentar o combate')
  console.log(`OK: amostra real de ${reference.requestedDurationSec} s: ${state.session.hits} acertos / ${state.session.total} de dano local, sem os demais atacantes.`)
  console.log(`OK: dano recebido na amostra: ${state.session.received.hits} acertos / ${state.session.received.total}, mesmo total por fonte e habilidade.`)
} finally { real.close() }
