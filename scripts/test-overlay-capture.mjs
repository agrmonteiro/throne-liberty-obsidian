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
  const handlers = new Map(), children = [], records = new Map(), ticks = [], nativeWindows = []
  class Clock extends Date { static now() { return now } }
  class Child extends EventEmitter {
    stdout = new EventEmitter()
    stderr = new EventEmitter()
    kill() {}
  }
  const owner = new EventEmitter()
  owner.isDestroyed = () => false
  owner.isFocused = () => false
  owner.webContents = { send() {} }
  const fakeFs = { existsSync: () => true, readFileSync: () => { throw Error('Empty test profile') }, mkdirSync() {}, writeFileSync() {} }
  class History {
    list() { return { encounters: [...records.values()].map(row => structuredClone(row)), error: null } }
    upsert(row) { if (row.session.hits || row.session.received?.hits || row.session.healing?.done.hits || row.session.timed) records.set(row.id, structuredClone(row)) }
    clear() { records.clear() }
  }
  class UnknownLog { status() { return {} } record() {} flush() {} resetAfterClear() {} }
  class NativeWindow extends EventEmitter {
    visible = false; focused = false; destroyed = false; url = ''; webContents = new EventEmitter()
    constructor(bounds) { super(); this.focusable = bounds.focusable; this.rect = bounds; this.webContents.send = () => {}; this.webContents.getURL = () => this.url; nativeWindows.push(this) }
    getBounds() { return this.rect }
    setBounds(rect) { this.rect = rect }
    isVisible() { return this.visible }
    isFocused() { return this.focused }
    isDestroyed() { return this.destroyed }
    showInactive() { this.visible = true }
    hide() { this.visible = false }
    setSkipTaskbar() {}
    setAlwaysOnTop() {}
    setIgnoreMouseEvents() {}
    getNativeWindowHandle() { const handle = Buffer.alloc(8); handle.writeBigUInt64LE(BigInt(nativeWindows.indexOf(this) + 1)); return handle }
    loadFile(_file, { query }) { this.url = `file:///overlay?overlay=${query.overlay}`; this.webContents.emit('did-finish-load'); this.emit('ready-to-show') }
    destroy() { this.destroyed = true; this.emit('closed') }
  }
  const electron = { app: { getPath: () => root, getAppPath: () => root, isPackaged: false },
    BrowserWindow: NativeWindow, dialog: {}, screen: { screenToDipRect: (_window, rect) => rect, getCursorScreenPoint: () => ({ x: -9999, y: -9999 }) },
    globalShortcut: { register: () => true, unregister() {} },
    ipcMain: { handle: (key, fn) => handlers.set(key, fn), removeHandler: key => handlers.delete(key) } }
  const resolve = name => {
    if (name === 'electron') return electron
    if (name === 'fs') return fakeFs
    if (name === 'child_process') return { spawn: (_file, args) => { const child = new Child(); child.args = args; children.push(child); return child } }
    if (name === '@electron-toolkit/utils') return { is: { dev: false } }
    if (name.endsWith('/overlayMeter')) return engine
    if (name.endsWith('/overlayLayout')) return layout
    if (name.endsWith('/overlaySkillReference')) return { overlaySkillNames: {}, overlaySkillFiles: {},
      overlayNpcNames: Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(root, 'src/data/overlayNpcReference.json'), 'utf8')).npcs).map(([id, row]) => [id, row.name])) }
    if (name.endsWith('/overlayHealingEffects.json')) return JSON.parse(fs.readFileSync(path.join(root, 'src/data/overlayHealingEffects.json'), 'utf8'))
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
    resolve, module, module.exports, root, Clock, () => 0, () => {}, callback => { ticks.push(callback); return ticks.length }, () => {})
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
    tick: () => ticks.forEach(callback => callback()),
    foreground: (active, extra = {}) => children.find(row => row.args.some(value => value.endsWith('overlay-foreground.py'))).stdout.emit('data',
      Buffer.from(JSON.stringify({ active, bounds: { x: 0, y: 0, width: 1280, height: 720 }, ...extra }) + '\n')),
    visiblePanels: () => Object.fromEntries(nativeWindows.filter(row => !row.destroyed).map(row => [row.url.split('overlay=')[1], row.visible])),
    focusPanel: panel => {
      for (const window of nativeWindows) {
        window.focused = window.url.endsWith(`overlay=${panel}`)
        if (window.focused) {
          assert.equal(window.focusable, true, 'A consulta do overlay precisa aceitar teclado nativo')
          window.emit('focus')
        }
      }
    },
    pause: value => handlers.get('overlay:pause')({}, value), advance: ms => { now += ms },
    timer: action => handlers.get('overlay:timer')({}, action),
    reset: () => handlers.get('overlay:reset')(), history: () => handlers.get('overlay:history')(), close: () => owner.emit('closed') }
}
const damage = (id, time, amount, connectionId = 'A') => ({ type: 'damage', connectionId,
  event: { sourceId: id, time, damage: amount, skillId: 1, criticalCandidate: false, heavyCandidate: 0 } })
const player = (id, time, connectionId = 'A') => ({ type: 'identity', name: 'AgrMonteiro', sourceId: id, time, connectionId })
const npcNames = harness()
try {
  npcNames.start()
  const npc = (connectionId, npcId = 10212035) => ({ type: 'npc', connectionId, sourceId: 8, npcId, time: 1001 })
  npcNames.send(npc('A'))
  assert.equal(npcNames.state().config.sourceId, null, 'Um spawn de NPC nunca seleciona o personagem')
  npcNames.send(player(7, 1002))
  npcNames.send({ ...damage(8, 1003, 100), event: { ...damage(8, 1003, 100).event, targetId: 7 } })
  assert.equal(npcNames.state().session.received.sources[0].name, 'Guarda do Apóstolo')
  const id = npcNames.state().capture.encounterId
  npcNames.history()
  assert.equal(npcNames.records.get(id).session.received.sources[0].npcId, 10212035)
  assert.equal(npcNames.records.get(id).session.received.sources[0].skills[0].damage, 100, 'Histórico inclui habilidades dentro da fonte nomeada')
  npcNames.send(npc('B', 10130537))
  assert.equal(npcNames.state().session.received.sources[0].name, 'Guarda do Apóstolo', 'Não cruzar o mesmo ID numérico entre conexões')
  npcNames.send(npc('A', 999999999))
  assert.equal(npcNames.state().session.received.sources[0].name, 'Guarda do Apóstolo', 'Template desconhecido não substitui um nome confirmado')
  npcNames.send(npc('A', 10130537))
  assert.equal(npcNames.state().session.received.sources[0].name, undefined, 'Templates conflitantes não podem receber um nome arbitrário')
  npcNames.send({ type: 'connection-closed', connectionId: 'A' })
  npcNames.send(player(7, 1004, 'C'))
  npcNames.send({ ...damage(8, 1005, 50, 'C'), event: { ...damage(8, 1005, 50, 'C').event, targetId: 7 } })
  assert.equal(npcNames.state().session.received.sources[0].name, undefined)
  npcNames.send(npc('A'))
  assert.equal(npcNames.state().session.received.sources[0].name, undefined, 'Spawn tardio de conexão aposentada deve ser ignorado')
  npcNames.send({ ...npc('C', 10130537), time: 1006 })
  assert.equal(npcNames.state().session.received.sources[0].name, 'Apóstolo da Tristeza')
  npcNames.history()
  assert.equal(npcNames.records.get(npcNames.state().capture.encounterId).session.received.sources[0].name, 'Apóstolo da Tristeza', 'Nome tardio persiste sem precisar de novo dano')
  assert.equal(npcNames.state().session.received.total, 50)
} finally { npcNames.close() }
const manualNpcNames = harness()
try {
  manualNpcNames.start(); manualNpcNames.configure({ sourceId: 7 })
  manualNpcNames.send({ type: 'npc', connectionId: 'B', sourceId: 8, npcId: 10130537, time: 1001 })
  manualNpcNames.send({ ...damage(8, 1002, 30), event: { ...damage(8, 1002, 30).event, targetId: 7 } })
  assert.equal(manualNpcNames.state().capture.connectionId, 'A')
  assert.equal(manualNpcNames.state().session.received.sources[0].name, undefined)
  manualNpcNames.send({ type: 'npc', connectionId: 'A', sourceId: 8, npcId: 10212035, time: 1003 })
  assert.equal(manualNpcNames.state().session.received.sources[0].name, 'Guarda do Apóstolo')
  assert.equal(manualNpcNames.state().capture.player, null, 'Origem manual não equivale a confirmação de perfil')
} finally { manualNpcNames.close() }
console.log('OK: nomes de NPCs por conexão, histórico nomeado, chegada tardia, conflitos, seleção manual e sem inferir jogador por monstro.')
if (process.platform === 'win32') {
  const visibility = harness()
  try {
    visibility.start(); visibility.send({ type: 'status', state: 'live', message: 'test' }); visibility.send(player(7, 1001))
    visibility.configure({ totalVisible: true, skillsVisible: true, controlsVisible: true, hideOutOfCombat: true, combatHideDelaySec: 10 })
    visibility.foreground(true)
    assert.deepEqual(visibility.visiblePanels(), { total: false, skills: false, controls: true })
    visibility.send(damage(8, 1002, 9000))
    assert.equal(visibility.state().combat.lastDamageAt, null, 'Terceiros não podem revelar o overlay')
    visibility.send(damage(7, 1003, 100))
    assert.deepEqual(visibility.visiblePanels(), { total: true, skills: true, controls: true })
    visibility.advance(10000); visibility.foreground(true); visibility.tick()
    assert.deepEqual(visibility.visiblePanels(), { total: false, skills: false, controls: true }, 'Expirar sem novos pacotes deve ocultar as janelas nativas')
    visibility.focusPanel('skills')
    visibility.foreground(false, { foreground: '2' }); visibility.tick()
    assert.deepEqual(visibility.visiblePanels(), { total: true, skills: true, controls: true }, 'Busca/detalhes focados devem permanecer visíveis fora de combate')
    visibility.focusPanel(null)
    visibility.foreground(false, { foregroundOwner: '3' }); visibility.tick()
    assert.deepEqual(visibility.visiblePanels(), { total: true, skills: true, controls: true }, 'Popup dos ajustes deve manter os painéis visíveis durante a edição')
    visibility.foreground(true); visibility.tick()
    visibility.send({ type: 'healing', connectionId: 'A', event: { time: 1014, sourceId: 7, targetId: 7,
      skillId: 963905802, effectId: 963250776, healing: 521, coverage: 'self-periodic' } })
    assert.equal(visibility.state().combat.hidden, true, 'Cura contínua não indica combate')
    visibility.pause(true)
    visibility.send({ ...damage(8, 1015, 10), event: { ...damage(8, 1015, 10).event, targetId: 7 } })
    assert.equal(visibility.state().combat.hidden, false, 'Dano recebido revela mesmo com medição pausada')
    assert.deepEqual(visibility.visiblePanels(), { total: true, skills: true, controls: true })
    assert.equal(visibility.state().session.total, 100)
    visibility.advance(20000); visibility.foreground(true); visibility.tick()
    visibility.configure({ countdownSec: 2, durationSec: 4 }); visibility.timer('start')
    assert.equal(visibility.state().combat.hidden, false, 'Preparação do cronômetro precisa aparecer')
    visibility.advance(6000); visibility.foreground(true); visibility.tick()
    assert.equal(visibility.state().combat.hidden, true)
    const saved = visibility.history().encounters[0].id
    visibility.configure({ reviewEncounterId: saved })
    assert.equal(visibility.state().combat.hidden, false, 'Consulta ao histórico permanece visível')
    visibility.configure({ reviewEncounterId: null, hideOutOfCombat: false })
    assert.deepEqual(visibility.visiblePanels(), { total: true, skills: true, controls: true })
  } finally { visibility.close() }
  console.log('OK: janelas nativas ocultam sem novos pacotes, revelam por dano local/recebido, ignoram terceiros/cura e preservam ajustes, pausa, cronômetro e histórico.')
}
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
  pausedLive.send({ type: 'healing', connectionId: 'A', event: { time: 2005, sourceId: 7, targetId: 7,
    skillId: 963774787, effectId: 963467735, healing: 100, coverage: 'self-periodic' } })
  assert.equal(pausedLive.state().session.healing.done.total, 621, 'Bênção da Natureza deve usar a classificação do catálogo completo')
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
  for (const source of state.session.received.sources) {
    assert.equal(source.skills.reduce((sum, row) => sum + row.damage, 0), source.damage, 'Habilidades da fonte precisam reconciliar com seu dano na amostra real')
    assert.equal(source.skills.reduce((sum, row) => sum + row.hits, 0), source.hits)
  }
  assert.equal(state.config.autoSource, false)
  assert.equal(state.config.reviewEncounterId, null)
  assert.equal(state.status, 'live')
  real.history()
  assert.equal(real.records.size, 1, 'Sinais locais repetidos e conexões secundárias encerradas não devem fragmentar o combate')
  console.log(`OK: amostra real de ${reference.requestedDurationSec} s: ${state.session.hits} acertos / ${state.session.total} de dano local, sem os demais atacantes.`)
  console.log(`OK: dano recebido na amostra: ${state.session.received.hits} acertos / ${state.session.received.total}, mesmo total por fonte e habilidade.`)
} finally { real.close() }
