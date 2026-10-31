import { app, BrowserWindow, dialog, globalShortcut, ipcMain, screen } from 'electron'
import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { OverlayIdentity, OverlayMeter, type MeterEvent, type MeterHealingEvent, type OverlayConfig, type OverlayPanel, type OverlayState, type PanelBounds } from '../../src/engine/overlayMeter'
import { clamp, defaultOverlayTheme, overlayAnchor, overlayBounds, overlaySceneActive, overlayHasFocus, overlayCombatVisible } from '../../src/engine/overlayLayout'
import { randomUUID } from 'crypto'
import { OverlayHistory } from './overlayHistory'
import { clearMeterLogFiles } from './overlayCleanup'
import { overlaySkillNames as names, overlaySkillFiles, overlayNpcNames } from '../../src/engine/overlaySkillReference'
import { OverlayUnknownLog } from './overlayUnknownLog'
import healingReference from '../../src/data/overlayHealingEffects.json'
import { OverlayDeathLog } from './overlayDeathLog'
import type { DeathCombatEvent } from '../../src/engine/overlayDeathLog'
import { recognizedHealing } from '../../src/engine/overlayHealingEvent'
import { OverlayBuffTracker, validBuffEvent, type BuffEvent, type BuffKind } from '../../src/engine/overlayBuffs'
import { OverlayBuffLog } from './overlayBuffLog'
import buffReference from '../../src/data/overlayBuffEffects.json'

export function registerOverlay(owner: BrowserWindow): void {
  const file = path.join(app.getPath('userData'), 'data', 'overlay.json')
  let config: OverlayConfig = { autoSource: true, locked: false, totalVisible: false, skillsVisible: false,
    controlsVisible: true, controlsExpanded: false, fontFamily: 'Inter', fontSize: 13, chartPadding: 12, chartPaddingVertical: 10, theme: { ...defaultOverlayTheme },
    opacity: .94, scale: 1, sourceId: null }
  try { config = { ...config, ...JSON.parse(fs.readFileSync(file, 'utf8')) } } catch { /* primeiro uso */ }
  // Não transportar identidade de entidade entre execuções/conexões do jogo.
  config.sourceId = null
  config.reviewEncounterId = null
  const meter = new OverlayMeter(null, names, overlaySkillFiles)
  const identity = new OverlayIdentity()
  const history = new OverlayHistory(path.join(app.getPath('userData'), 'data', 'overlay-encounters.json'))
  const deathLog = new OverlayDeathLog(path.join(app.getPath('userData'), 'data', 'overlay-deaths.json'))
  const buffs = new OverlayBuffTracker()
  const buffLog = new OverlayBuffLog(path.join(app.getPath('userData'), 'logs', 'dps-meter', 'buffs'))
  const buffEffects = buffReference.effects as Record<string, { kind: BuffKind; names: string[] }>
  let encounterId = randomUUID()
  let encounterConnectionId: string | null = null
  let encounterClosed = false
  let clearedThrough: number | null = null
  const unknownLog = new OverlayUnknownLog(path.join(app.getPath('userData'), 'logs', 'dps-meter', 'unknown-skills'), names)
  let captureId = ''
  const windows: Partial<Record<OverlayPanel, BrowserWindow>> = {}
  const appliedBounds = new Map<OverlayPanel, PanelBounds>()
  const interactivePanels = new Set<OverlayPanel>()
  const sources = new Map<number, number>()
  const sourceLastSeen = new Map<number, number>()
  let recentDamage: Array<{ event: MeterEvent | MeterHealingEvent; connectionId: string }> = []
  let captureStartedAt = 0
  let resumedAt = 0
  let lastCombatDamageAt: number | null = null
  let combatPanelsVisible = true
  const sourceNames = new Map<number, string>()
  const conflictingNames = new Set<number>()
  // Templates não identificam o jogador. Entidades/UIDs só se relacionam na mesma conexão.
  const npcTemplates = new Map<string, Map<number, number | null>>()
  let status: OverlayState['status'] = 'stopped'
  let mode: OverlayState['mode'] = null
  let replayClock: number | null = null
  let message = 'Inicie a leitura. Seu personagem será identificado pelo sinal de entidade local.'
  let child: ChildProcess | null = null
  let foregroundChild: ChildProcess | null = null
  let gameForeground = false
  let controlsEditing = false
  let gameBounds: PanelBounds | null = null
  let foregroundSeenAt = 0
  let revision = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let focusHideTimer: ReturnType<typeof setTimeout> | undefined
  function checkpoint(reason = 'current', at = mode === 'replay' ? (replayClock ?? Date.now()) : Date.now()): void {
    if (encounterClosed || !mode) return
    const session = namedSession(at)
    if (reason === 'current' && session.timed && Date.now() >= session.timed.endsAt) reason = session.timed.cancelled ? 'timed-cancelled' : 'timed-end'
    if (clearedThrough !== null && (session.lastActivityAt === null || session.lastActivityAt! <= clearedThrough)) return
    history.upsert({ id: encounterId, captureId, connectionId: encounterConnectionId,
      sourceId: meter.sourceId, sourceName: sourceNames.get(meter.sourceId!), attributionVersion: 2, mode, reason,
      savedAt: Date.now(), session })
  }
  function finishEncounter(reason: string, at?: number): void {
    checkpoint(reason, at); encounterClosed = true
  }
  function newEncounter(connectionId = identity.snapshot()?.connectionId ?? null): void {
    encounterId = randomUUID(); encounterConnectionId = connectionId; encounterClosed = false; clearedThrough = null
  }
  function bindSource(sourceId: number | null, at: number, reason: string): void {
    finishEncounter(reason, meter.snapshot(at).lastActivityAt ?? at)
    newEncounter()
    config.sourceId = sourceId; config.reviewEncounterId = null
    lastCombatDamageAt = null
    meter.selectSource(sourceId, Math.max(captureStartedAt, at - 5000))
    bindDeathLog()
    let restoredDamage = 0, restoredAt = 0
    if (sourceId !== null) for (const row of recentDamage) {
      const accepted = (mode === 'replay' || identity.accepts(row.connectionId))
        && ('healing' in row.event ? meter.addHealing(row.event) : meter.add(row.event))
      if ('damage' in row.event && row.event.sourceId > 0 && (row.event.sourceId === sourceId || row.event.targetId === sourceId)
        && (mode === 'replay' || identity.accepts(row.connectionId))) lastCombatDamageAt = Math.max(lastCombatDamageAt ?? 0, Math.min(Date.now(), row.event.time * 1000))
      if (row.event.sourceId === sourceId && accepted && 'damage' in row.event) {
        restoredDamage += row.event.damage; restoredAt = Math.max(restoredAt, row.event.time * 1000)
      }
    }
    if (sourceId !== null && restoredDamage && !sources.has(sourceId)) {
      sources.set(sourceId, restoredDamage); sourceLastSeen.set(sourceId, restoredAt)
    }
    recentDamage = []
    save(); broadcast()
  }
  function save(): void {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(config, null, 2)) }
      catch { message = 'Não foi possível salvar as posições do overlay.' }
    }, 250)
  }
  function state(): OverlayState {
    const player = identity.snapshot()
    const session = namedSession(mode === 'replay' ? (replayClock ?? Date.now()) : Date.now())
    const timed = meter.measurementWindow, now = Date.now()
    return { config: { ...config }, capture: { id: captureId, connectionId: player?.connectionId ?? encounterConnectionId, encounterId, player },
      combat: { lastDamageAt: lastCombatDamageAt, hidden: !combatVisible() },
      game: { attached: gameBounds !== null, active: gameForeground, bounds: gameBounds },
      session, ...(timed ? { timer: { ...timed, phase: timed.cancelled ? 'cancelled' : now < timed.startsAt ? 'countdown' : now < timed.endsAt ? 'running' : 'finished',
        remainingSec: Math.max(0, ((now < timed.startsAt ? timed.startsAt : timed.endsAt) - now) / 1000), elapsedSec: session.elapsedSec } } : {}),
      status, mode, message, unknownSkillLog: unknownLog.status(),
      sources: [...sources].map(([id, damage]) => ({ id, damage, name: entityName(id).name, lastDamageAt: sourceLastSeen.get(id),
        localPlayer: id === player?.sourceId })).sort((a, b) => b.damage - a.damage), deathLog: deathLog.status() }
  }
  function bindDeathLog(connectionId = encounterConnectionId ?? identity.snapshot()?.connectionId): void {
    buffs.bind(mode && connectionId && meter.sourceId !== null ? { captureId, connectionId, playerId: meter.sourceId } : null)
    deathLog.recorder.bind(mode && connectionId && meter.sourceId !== null ? {
      captureId, connectionId, playerId: meter.sourceId, playerName: config.playerName ?? sourceNames.get(meter.sourceId) ?? 'Personagem selecionado', mode,
    } : null)
  }
  function namedBuffStates(): ReturnType<OverlayBuffTracker['states']> {
    return buffs.states().map(event => ({ ...event, sourceName: entityName(event.sourceId).name ?? event.sourceName,
      targetName: entityName(event.targetId).name ?? event.targetName }))
  }
  function observeDeathEvent(event: DeathCombatEvent, connectionId: string, candidate = false, aliveCandidate = false): void {
    if (mode !== 'live' || !Number.isFinite(event.time) || event.time * 1000 < captureStartedAt
      || typeof connectionId !== 'string' || !connectionId.length || connectionId.length > 128 || identity.isRetired(connectionId)
      || (identity.snapshot() && !identity.accepts(connectionId))
      || (encounterConnectionId && encounterConnectionId !== connectionId)
      || (event.sourceId !== meter.sourceId && event.targetId !== meter.sourceId)) return
    encounterConnectionId ??= connectionId
    bindDeathLog(connectionId)
    deathLog.recorder.setBuffs(namedBuffStates())
    const source = event.sourceId ? entityName(event.sourceId) : {}
    const target = event.targetId ? entityName(event.targetId) : {}
    const enriched = { ...event, sourceName: source.name, targetName: target.name,
      sourceNpcId: source.npcId, targetNpcId: target.npcId,
      skillName: event.skillId ? names[String(event.skillId)] : undefined }
    if (event.type === 'state' && event.stateCode !== undefined) {
      if (deathLog.recorder.observeState(enriched, connectionId, candidate)) deathLog.save()
    } else if (event.type === 'damage') {
      if (deathLog.recorder.observeDamage(enriched, connectionId, candidate, aliveCandidate)) deathLog.save()
    } else deathLog.recorder.append(enriched, connectionId)
  }
  function entityName(id: number): { name?: string; npcId?: number } {
    const profile = sourceNames.get(id)
    if (profile) return { name: profile }
    const connection = encounterConnectionId ?? identity.snapshot()?.connectionId
    const npcId = connection ? npcTemplates.get(connection)?.get(id) : null
    return npcId && overlayNpcNames[String(npcId)] ? { name: overlayNpcNames[String(npcId)], npcId } : {}
  }
  function namedSession(at: number): ReturnType<OverlayMeter['snapshot']> {
    const session = meter.snapshot(at)
    if (session.received) session.received.sources = session.received.sources.map(row => ({ ...row, ...entityName(row.id) }))
    return session
  }
  function broadcast(): void {
    const current = state()
    for (const window of [owner, ...Object.values(windows)]) {
      if (window && !window.isDestroyed()) window.webContents.send('overlay:state', current)
    }
  }
  const panels: OverlayPanel[] = ['total', 'skills', 'controls']
  function requested(panel: OverlayPanel): boolean { return Boolean(config[`${panel}Visible`]) }
  function combatVisible(): boolean {
    if (!config.hideOutOfCombat) return true
    const timed = meter.measurementWindow
    return overlayCombatVisible(config, lastCombatDamageAt, Date.now(), { replay: mode === 'replay',
      timed: Boolean(timed && !timed.cancelled && Date.now() < timed.endsAt),
      editing: Boolean((config.controlsVisible && controlsEditing)
        || panels.some(panel => requested(panel) && windows[panel]?.isFocused())) })
  }
  function panelVisible(panel: OverlayPanel): boolean {
    return requested(panel) && gameForeground && gameBounds !== null && (panel === 'controls' || combatVisible())
  }
  function observeCombatDamage(event: MeterEvent): void {
    if (mode !== 'live' || event.sourceId <= 0 || meter.sourceId === null || (event.sourceId !== meter.sourceId && event.targetId !== meter.sourceId)) return
    lastCombatDamageAt = Math.max(lastCombatDamageAt ?? 0, Math.min(Date.now(), event.time * 1000))
    if (!combatPanelsVisible && combatVisible()) showPanels()
  }
  function applyBounds(panel: OverlayPanel, window: BrowserWindow): void {
    if (!gameBounds) return
    const bounds = overlayBounds(panel, config, gameBounds)
    appliedBounds.set(panel, bounds)
    const current = window.getBounds()
    if (Object.keys(bounds).some(key => bounds[key as keyof PanelBounds] !== current[key as keyof PanelBounds])) window.setBounds(bounds)
  }
  function storeBounds(panel: OverlayPanel, value: PanelBounds): void {
    if (!gameBounds) return
    config[`${panel}Bounds`] = value
    config.anchors = { ...config.anchors, [panel]: overlayAnchor(value, gameBounds) }
    const constrained = overlayBounds(panel, config, gameBounds)
    config[`${panel}Bounds`] = constrained
    config.anchors[panel] = overlayAnchor(constrained, gameBounds)
    save()
  }
  function showPanels(): void {
    combatPanelsVisible = combatVisible()
    for (const panel of panels) {
      const visible = panelVisible(panel)
      let window = windows[panel]
      if (!window && requested(panel) && gameBounds) {
        const initial = overlayBounds(panel, config, gameBounds)
        config.anchors = { ...config.anchors, [panel]: config.anchors?.[panel] ?? overlayAnchor(initial, gameBounds) }
        window = new BrowserWindow({ ...initial, title: `Overlay · ${panel === 'controls' ? 'Ajustes' : panel === 'total' ? 'Total geral' : 'Habilidades'}`,
          transparent: true, frame: false,
          show: false, resizable: false, maximizable: false, minimizable: false, skipTaskbar: true,
          // Busca e consulta de detalhes também precisam receber teclado no gráfico.
          focusable: true,
          alwaysOnTop: true, backgroundColor: '#00000000',
          webPreferences: { preload: path.join(__dirname, '../preload/index.cjs'),
            sandbox: false, contextIsolation: true, nodeIntegration: false } })
        windows[panel] = window
        window.on('page-title-updated', event => event.preventDefault())
        window.on('focus', () => {
          clearTimeout(focusHideTimer); focusHideTimer = undefined
          if (gameBounds && requested(panel)) { gameForeground = true; showPanels() }
        })
        appliedBounds.set(panel, initial)
        window.setAlwaysOnTop(true, 'screen-saver')
        window.on('move', () => {
          const bounds = window!.getBounds(), applied = appliedBounds.get(panel)
          if (applied && Object.keys(bounds).every(key => bounds[key as keyof PanelBounds] === applied[key as keyof PanelBounds])) return
          storeBounds(panel, bounds); applyBounds(panel, window!); broadcast()
        })
        window.on('closed', () => { interactivePanels.delete(panel); delete windows[panel] })
        window.webContents.on('did-finish-load', broadcast)
        window.once('ready-to-show', () => {
          if (panelVisible(panel)) window?.showInactive()
          window?.setSkipTaskbar(true)
        })
        if (is.dev && process.env.ELECTRON_RENDERER_URL) {
          const url = new URL(process.env.ELECTRON_RENDERER_URL); url.searchParams.set('overlay', panel)
          void window.loadURL(url.toString())
        } else void window.loadFile(path.join(__dirname, '../renderer/index.html'), { query: { overlay: panel } })
      }
      if (!window) continue
      applyBounds(panel, window)
      if (panel !== 'controls') window.setIgnoreMouseEvents(config.locked && !interactivePanels.has(panel), { forward: true })
      // Foco é definido na criação. Reaplicar estilos nativos durante o clique interfere na ativação no Windows.
      if (visible && !window.isVisible()) { window.showInactive(); window.setSkipTaskbar(true) }
      else if (!visible && window.isVisible()) window.hide()
    }
    save(); broadcast()
  }
  function stop(): void {
    meter.cancelSchedule(Date.now())
    meter.setPaused(true, mode === 'replay' ? (replayClock ?? Date.now()) : Date.now())
    finishEncounter('stop')
    unknownLog.flush()
    if (mode === 'live') buffLog.append({ type: 'capture-stop', captureId, time: Date.now()/1000 })
    buffLog.flush()
    clearTimeout(reconnectTimer); reconnectTimer = undefined
    revision++
    child?.kill(); child = null
    status = 'stopped'; message = 'Leitura parada. O acumulado foi mantido.'
  }
  function python(): string {
    const local = process.env.LOCALAPPDATA ?? ''
    const candidates = [path.join(local, 'Python', 'pythoncore-3.14-64', 'python.exe'),
      path.join(local, 'Programs', 'Python', 'Python314', 'python.exe'),
      path.join(local, 'Programs', 'Python', 'Python313', 'python.exe')]
    return candidates.find(value => fs.existsSync(value)) ?? 'python'
  }
  function start(replay?: string, speed = 1): void {
    stop()
    const token = revision
    newEncounter(null)
    captureId = `${Date.now()}-${token}`
    captureStartedAt = replay ? 0 : Date.now()
    lastCombatDamageAt = null
    resumedAt = captureStartedAt
    identity.clear(); sourceLastSeen.clear(); recentDamage = []
    config.reviewEncounterId = null
    const scripts = app.isPackaged ? path.join(process.resourcesPath, 'npcap-overlay') : path.join(app.getAppPath(), 'scripts')
    const worker = path.join(scripts, 'npcap-overlay-worker.py')
    if (!fs.existsSync(worker)) { status = 'error'; message = 'Componente de captura não encontrado.'; return }
    const healingFile = path.join(app.getPath('userData'), 'data', 'overlay-healing-effects-reference.json')
    try {
      fs.mkdirSync(path.dirname(healingFile), { recursive: true })
      fs.writeFileSync(healingFile, JSON.stringify(healingReference))
    } catch { status = 'error'; message = 'Não foi possível preparar a referência de cura.'; return }
    sources.clear()
    sourceNames.clear(); conflictingNames.clear(); npcTemplates.clear()
    meter.setPaused(false, replay ? 0 : Date.now())
    meter.selectSource(null, replay ? 0 : Date.now()); config.sourceId = null; config.autoSource = true
    deathLog.recorder.bind(null)
    status = 'starting'; message = replay ? 'Abrindo reprodução…' : 'Conectando ao Npcap…'
    mode = replay ? 'replay' : 'live'
    buffs.bind(null)
    if (!replay) buffLog.start(captureId)
    replayClock = null
    let pending = '', errors = ''
    const proc = spawn(python(), ['-u', worker, '--healing-reference', healingFile, ...(replay ? ['--replay', replay, '--speed', String(speed)] : [])],
      { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
    child = proc
    proc.stdout?.on('data', buffer => {
      if (revision !== token) return
      pending += buffer.toString('utf8')
      if (pending.length > 1024 * 1024) { stop(); status = 'error'; message = 'Resposta de captura excedeu o limite.'; return }
      let index: number
      while ((index = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, index); pending = pending.slice(index + 1)
        try {
          const data = JSON.parse(line)
          if (data.type === 'status') {
            status = ['live', 'replay', 'stopped', 'error'].includes(data.state) ? data.state : 'error'
            message = String(data.message).slice(0, 500)
          } else if (data.type === 'sources' && Array.isArray(data.ids)) {
            if (mode === 'replay' && Number.isFinite(data.time)) replayClock = data.time * 1000
            for (const id of data.ids) if (Number.isSafeInteger(id)) sources.set(id, 0)
            if (mode === 'replay' && config.autoSource !== false && data.ids.length === 1 && Number.isSafeInteger(data.ids[0]) && data.ids[0] > 0) {
              bindSource(data.ids[0], replayClock ?? 0, 'replay-source')
            }
          } else if (data.type === 'buff' && mode === 'live') {
            if (!validBuffEvent(data.event) || data.event.time * 1000 < captureStartedAt || identity.isRetired(data.event.connectionId)
              || data.raw?.direction !== 'server-to-client') continue
            const ref = buffEffects[String(data.event.effectId)]
            const currentConnection = identity.snapshot()?.connectionId ?? encounterConnectionId
            const event: BuffEvent = { ...data.event, kind: ref?.kind ?? 'unknown', effectNames: ref?.names ?? [], raw: data.raw,
              sourceName: currentConnection === data.event.connectionId ? entityName(data.event.sourceId).name : undefined,
              targetName: currentConnection === data.event.connectionId ? entityName(data.event.targetId).name : undefined }
            const { fields: _fields, ...raw } = event.raw!
            buffLog.append({ type: 'buff', captureId, ...event, raw })
            if ((identity.snapshot() && !identity.accepts(event.connectionId)) || (encounterConnectionId && encounterConnectionId !== event.connectionId)
              || meter.sourceId === null || (event.sourceId !== meter.sourceId && event.targetId !== meter.sourceId)) continue
            encounterConnectionId ??= event.connectionId
            bindDeathLog(event.connectionId)
            const link = buffs.accept(event)
            observeDeathEvent({ type: 'buff', time: event.time, sourceId: event.sourceId, targetId: event.targetId,
              effectId: event.effectId, skillId: event.skillIdCandidate ?? undefined,
              buff: event, raw: event.raw }, event.connectionId)
            if (link === 'capacity') message = 'Limite de estados observados atingido. Consulte o registro bruto de buffs.'
          } else if (data.type === 'entity-state') {
            if (!Number.isSafeInteger(data.targetId) || data.targetId <= 0 || !Number.isFinite(data.time)) continue
            observeDeathEvent({ type: 'state', time: data.time, targetId: data.targetId,
              stateCode: Number.isSafeInteger(data.stateCode) ? data.stateCode : undefined, raw: data.raw }, data.connectionId, data.deathCandidate === true)
          } else if (data.type === 'combat-observation' || data.type === 'effect-observation') {
            const event = data.event
            if (event && Number.isFinite(event.time) && Number.isFinite(event.damage ?? event.observedAmount) && Number.isSafeInteger(event.sourceId)
              && Number.isSafeInteger(event.targetId) && Number.isSafeInteger(event.skillId)) {
              observeDeathEvent({ ...event, type: data.type === 'effect-observation' ? 'effect' : 'damage', raw: data.raw }, data.connectionId,
                data.deathCandidate === true, data.aliveCandidate === true)
            }
          } else if (data.type === 'connection-closed' && mode === 'live') {
            buffLog.append({ type: 'connection-closed', captureId, connectionId: data.connectionId, time: data.time ?? Date.now()/1000 })
            if (identity.accepts(data.connectionId) || encounterConnectionId === data.connectionId) {
              finishEncounter('connection-end')
              sources.clear(); sourceLastSeen.clear(); sourceNames.clear(); conflictingNames.clear(); recentDamage = []
              config.sourceId = null; config.reviewEncounterId = null
              meter.selectSource(null, Date.now()); lastCombatDamageAt = null; newEncounter(null); save()
              deathLog.recorder.bind(null)
              buffs.bind(null)
            }
            npcTemplates.delete(data.connectionId)
            identity.retire(data.connectionId); broadcast()
          } else if (data.type === 'npc' && mode === 'live') {
            if (typeof data.connectionId !== 'string' || !data.connectionId.length || data.connectionId.length > 128
              || identity.isRetired(data.connectionId) || !Number.isSafeInteger(data.sourceId) || data.sourceId <= 0
              || !Number.isSafeInteger(data.npcId) || !overlayNpcNames[String(data.npcId)]
              || !Number.isFinite(data.time) || data.time * 1000 < captureStartedAt) continue
            let templates = npcTemplates.get(data.connectionId)
            if (!templates) {
              if (npcTemplates.size >= 16) continue
              templates = new Map(); npcTemplates.set(data.connectionId, templates)
            }
            if (templates.size >= 50000 && !templates.has(data.sourceId)) continue
            const previous = templates.get(data.sourceId)
            templates.set(data.sourceId, previous === undefined || previous === data.npcId ? data.npcId : null)
            broadcast()
          } else if (data.type === 'local-player' && mode === 'live') {
            const previous = identity.snapshot()
            // 30/10: este sinal também apareceu para terceiros na mesma conexão.
            // Com nome configurado, somente o perfil correspondente autoriza vincular/trocar entidade.
            if (!config.playerName || previous?.sourceId !== data.sourceId || previous?.connectionId !== data.connectionId) continue
            observeDeathEvent({ type: 'state', time: data.time, targetId: data.sourceId, raw: data.raw }, data.connectionId)
            const change = identity.identify(data.sourceId, data.connectionId, data.time * 1000, previous?.method ?? 'local-state')
            if (change === 'changed') {
              if (previous && previous.connectionId !== data.connectionId) {
                // Finaliza com a identidade anterior antes de descartar as origens da conexão.
                finishEncounter('connection-change')
                sources.clear(); sourceLastSeen.clear(); sourceNames.clear(); conflictingNames.clear()
              }
              if (config.autoSource !== false) bindSource(data.sourceId, data.time * 1000, previous ? 'entity-change' : 'local-player')
              else if (previous && previous.connectionId !== data.connectionId) bindSource(null, data.time * 1000, 'connection-change')
              broadcast()
            }
          } else if (data.type === 'identity') {
            if (mode === 'live' && identity.isRetired(data.connectionId)) continue
            if (mode === 'live' && identity.snapshot() && !identity.accepts(data.connectionId)
              && !(config.playerName && data.name === config.playerName)) continue
            if (!Number.isSafeInteger(data.sourceId) || data.sourceId <= 0 || typeof data.name !== 'string'
              || !data.name.length || data.name.length > 64 || /[\p{C}]/u.test(data.name) || data.name.trim() !== data.name) continue
            if (mode === 'live') buffLog.append({ type: 'profile-observation', captureId, connectionId: data.connectionId,
              sourceId: data.sourceId, name: data.name, time: data.time })
            if (conflictingNames.has(data.sourceId)) continue
            const previous = sourceNames.get(data.sourceId)
            if (previous && previous !== data.name) {
              sourceNames.delete(data.sourceId); conflictingNames.add(data.sourceId)
            } else {
              sourceNames.set(data.sourceId, data.name)
              if (mode === 'live' && config.playerName && data.name === config.playerName) {
                const previousPlayer = identity.snapshot()
                const change = identity.identify(data.sourceId, data.connectionId, Number.isFinite(data.time) ? data.time * 1000 : Date.now(), 'profile-name')
                if (change === 'changed' && previousPlayer && previousPlayer.connectionId !== data.connectionId) {
                  finishEncounter('connection-change')
                  sources.clear(); sourceLastSeen.clear(); sourceNames.clear(); conflictingNames.clear()
                  sourceNames.set(data.sourceId, data.name)
                }
                if (change === 'changed' && config.autoSource !== false) bindSource(data.sourceId, Date.now(), 'profile-name')
                if (change !== 'ignored') broadcast()
              }
            }
          } else if (data.type === 'damage' || data.type === 'healing') {
            const event = data.event
            const healing = data.type === 'healing'
            const amount = healing ? event?.healing : event?.damage
            if (!event || !Number.isSafeInteger(event.sourceId) || !Number.isSafeInteger(event.skillId)
              || !Number.isFinite(event.time) || !Number.isFinite(amount) || amount <= 0) continue
            if (healing && !recognizedHealing(event)) continue
            observeDeathEvent({ ...event, type: healing ? 'healing' : 'damage', raw: data.raw }, data.connectionId,
              data.deathCandidate === true, data.aliveCandidate === true)
            if (mode === 'replay') replayClock = event.time * 1000
            // Visibilidade acompanha o combate mesmo com a medição pausada ou fora da janela do teste.
            if (mode === 'live' && typeof data.connectionId === 'string' && data.connectionId.length > 0 && data.connectionId.length <= 128
              && !identity.isRetired(data.connectionId) && (!identity.snapshot() || identity.accepts(data.connectionId)) && !healing) observeCombatDamage(event)
            if (meter.paused || event.time * 1000 < resumedAt) continue
            const timed = meter.measurementWindow
            if (timed && (event.time * 1000 < timed.startsAt || event.time * 1000 >= timed.endsAt)) continue
            if (mode === 'live') {
              if (typeof data.connectionId !== 'string' || !data.connectionId.length || data.connectionId.length > 128
                || identity.isRetired(data.connectionId)) continue
              recentDamage.push({ event, connectionId: data.connectionId })
              recentDamage = recentDamage.filter(row => row.event.time >= event.time - 5).slice(-2000)
              if (identity.snapshot() && !identity.accepts(data.connectionId)) continue
              if (encounterConnectionId && encounterConnectionId !== data.connectionId) continue
              if (meter.sourceId !== null && (event.sourceId === meter.sourceId || event.targetId === meter.sourceId)) {
                encounterConnectionId ??= data.connectionId
              }
            }
            if (!healing) {
              sources.set(event.sourceId, (sources.get(event.sourceId) ?? 0) + event.damage)
              sourceLastSeen.set(event.sourceId, event.time * 1000)
            }
            const before = meter.snapshot(event.time * 1000)
            if ((event.sourceId === meter.sourceId || event.targetId === meter.sourceId) && before.lastActivityAt !== null
              && before.waitingReset) {
              finishEncounter('idle', before.lastActivityAt); newEncounter()
            }
            // A primeira origem com dano pode ser um NPC; só a identidade local autoriza seleção automática.
            const accepted = healing ? meter.addHealing(event) : meter.add(event)
            if (accepted && config.sourceId !== meter.sourceId) {
              config.sourceId = meter.sourceId; save()
            }
            if (!healing) unknownLog.record(event, { mode: mode === 'replay' ? 'replay' : 'live', accepted,
              selectedSourceId: config.sourceId, captureId })
          }
        } catch { status = 'error'; message = 'Resposta inválida do componente de captura.' }
      }
    })
    proc.stderr?.on('data', buffer => { errors = (errors + buffer.toString()).slice(-1000) })
    proc.on('error', error => {
      if (revision !== token) return
      finishEncounter('error')
      status = 'error'; message = `Python/Npcap indisponível: ${error.message}`; child = null; broadcast()
    })
    proc.on('exit', code => {
      if (revision !== token) return
      child = null
      finishEncounter(mode === 'replay' ? 'replay-end' : 'connection-end')
      if (status !== 'error') { status = code ? 'error' : 'stopped'; message = code ? (errors || 'Captura encerrada com erro.') : mode === 'replay' ? 'Reprodução concluída.' : 'Leitura encerrada.' }
      if (mode === 'live' && /conexão local.*(encerrou|não encontrada)|Abra o TL|TL sem conexões|Lacuna na captura TCP/i.test(message)) {
        status = 'starting'; message = 'Conexão interrompida. Nova tentativa de captura em 1 s…'
        reconnectTimer = setTimeout(() => { reconnectTimer = undefined; start(); broadcast() }, 1000)
      }
      broadcast()
    })
  }
  // Monitor separado da captura: funciona mesmo com leitura parada ou com erro.
  function watchForeground(): void {
    if (process.platform !== 'win32') return
    const scripts = app.isPackaged ? path.join(process.resourcesPath, 'npcap-overlay') : path.join(app.getAppPath(), 'scripts')
    foregroundChild = spawn(python(), ['-u', path.join(scripts, 'overlay-foreground.py')],
      { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
    let pending = ''
    foregroundChild.stdout?.on('data', buffer => {
      pending += buffer.toString('utf8')
      if (pending.length > 8192) { foregroundChild?.kill(); return }
      let index: number
      while ((index = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, index); pending = pending.slice(index + 1)
        try {
          const data = JSON.parse(line)
          if (typeof data.active !== 'boolean') continue
          foregroundSeenAt = Date.now()
          const bounds = data.bounds
          const valid = bounds && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(bounds[key]))
            && bounds.width > 0 && bounds.height > 0
          const nextBounds = valid ? screen.screenToDipRect(null, bounds) : null
          const candidates = panels.flatMap(panel => {
            const window = windows[panel]
            if (!window || window.isDestroyed()) return []
            const handle = window.getNativeWindowHandle()
            const id = String(handle.length >= 8 ? handle.readBigUInt64LE() : handle.readUInt32LE())
            return [{ panel, handle: id, focused: window.isFocused(), requested: requested(panel) }]
          })
          controlsEditing = Boolean(nextBounds && !owner.isFocused() && overlayHasFocus(data, candidates.filter(row => row.panel === 'controls')))
          const active = Boolean(nextBounds && overlaySceneActive(data, owner.isFocused(), candidates))
          const moved = JSON.stringify(gameBounds) !== JSON.stringify(nextBounds)
          gameBounds = nextBounds
          if (active || !nextBounds) {
            clearTimeout(focusHideTimer); focusHideTimer = undefined
            const changed = gameForeground !== active
            gameForeground = active
            if (changed || moved) showPanels()
          } else {
            if (moved) showPanels()
            if (gameForeground && focusHideTimer === undefined) focusHideTimer = setTimeout(() => {
              focusHideTimer = undefined
              const editing = !owner.isFocused() && panels.some(panel => requested(panel) && windows[panel]?.isFocused())
              if (!editing) { gameForeground = false; showPanels() }
            }, 180)
          }
        } catch { /* resposta inválida não deve mostrar os painéis */ }
      }
    })
    const hide = (): void => { clearTimeout(focusHideTimer); focusHideTimer = undefined; gameForeground = false; controlsEditing = false; gameBounds = null; showPanels() }
    foregroundChild.on('error', hide)
    foregroundChild.on('exit', hide)
  }
  watchForeground()
  ipcMain.handle('overlay:get', state)
  ipcMain.handle('overlay:buffs', () => {
    const snapshot = buffs.snapshot()
    return { ...snapshot, observed: namedBuffStates(), recent: snapshot.recent.map(event => ({ ...event,
      sourceName: entityName(event.sourceId).name ?? event.sourceName, targetName: entityName(event.targetId).name ?? event.targetName })), journal: buffLog.status() }
  })
  ipcMain.handle('overlay:deaths', () => deathLog.list())
  ipcMain.handle('overlay:record-death', () => {
    deathLog.recorder.setBuffs(namedBuffStates())
    if (mode === 'live' && config.sourceId !== null && deathLog.recorder.capture(Date.now() / 1000, 'manual')) deathLog.save()
    return deathLog.list()
  })
  ipcMain.handle('overlay:history', () => { checkpoint(); return history.list() })
  ipcMain.handle('overlay:clear-records', () => {
    try {
      clearMeterLogFiles(app.getPath('userData'))
      unknownLog.resetAfterClear()
      buffLog.resetAfterClear(captureId, mode === 'live' && status === 'live')
      clearedThrough = meter.snapshot().lastActivityAt ?? (mode === 'replay' ? (replayClock ?? 0) : Date.now())
      config.reviewEncounterId = null
      history.clear(); save(); broadcast()
      return history.list()
    } catch (error) { return { ...history.list(), error: `Limpeza incompleta: ${String(error)}` } }
  })
  ipcMain.handle('overlay:configure', (_event, patch: Partial<OverlayConfig>) => {
    if (typeof patch.playerName === 'string' && patch.playerName.trim().length <= 64 && !/[\p{C}]/u.test(patch.playerName)) config.playerName = patch.playerName.trim()
    if (patch.metricPage && ['damage', 'receivedSources', 'receivedSkills', 'healingDone', 'healingReceived'].includes(patch.metricPage)) config.metricPage = patch.metricPage
    if ('reviewEncounterId' in patch) {
      config.reviewEncounterId = typeof patch.reviewEncounterId === 'string'
        && history.list().encounters.some(row => row.id === patch.reviewEncounterId) ? patch.reviewEncounterId : null
    }
    for (const key of ['locked', 'totalVisible', 'skillsVisible', 'controlsVisible', 'controlsExpanded', 'hideOutOfCombat'] as const) {
      if (typeof patch[key] === 'boolean') config[key] = patch[key]!
    }
    if (Number.isFinite(patch.opacity)) config.opacity = Math.max(.25, Math.min(1, patch.opacity!))
    if (Number.isFinite(patch.fontSize)) config.fontSize = clamp(patch.fontSize!, 10, 20)
    if (Number.isFinite(patch.chartPadding)) config.chartPadding = Math.round(clamp(patch.chartPadding!, 0, 32))
    if (Number.isFinite(patch.chartPaddingVertical)) config.chartPaddingVertical = Math.round(clamp(patch.chartPaddingVertical!, 0, 32))
    if (Number.isFinite(patch.countdownSec)) config.countdownSec = Math.round(clamp(patch.countdownSec!, 0, 60))
    if (Number.isFinite(patch.durationSec)) config.durationSec = Math.round(clamp(patch.durationSec!, 1, 3600))
    if (Number.isFinite(patch.combatHideDelaySec)) config.combatHideDelaySec = Math.round(clamp(patch.combatHideDelaySec!, 3, 60))
    if (patch.fontFamily && ['Inter', 'Arial', 'Consolas'].includes(patch.fontFamily)) config.fontFamily = patch.fontFamily
    if (patch.theme && typeof patch.theme === 'object') {
      const theme = { ...defaultOverlayTheme, ...config.theme }
      for (const key of Object.keys(defaultOverlayTheme) as Array<keyof typeof theme>) {
        if (typeof patch.theme[key] === 'string' && /^#[0-9a-f]{6}$/i.test(patch.theme[key])) theme[key] = patch.theme[key]
      }
      config.theme = theme
    }
    if (patch.anchors && typeof patch.anchors === 'object') {
      for (const panel of panels) {
        const anchor = patch.anchors[panel]
        if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
          config.anchors = { ...config.anchors, [panel]: { x: clamp(anchor.x, 0, 1), y: clamp(anchor.y, 0, 1) } }
        }
      }
    }
    if (Number.isFinite(patch.scale)) {
      const previous = config.scale
      config.scale = Math.max(.75, Math.min(1.5, patch.scale!))
      if (previous !== config.scale) for (const panel of ['total', 'skills'] as const) {
        const bounds = windows[panel]?.getBounds() ?? config[`${panel}Bounds`]
        if (bounds) {
          config[`${panel}Bounds`] = { ...bounds, width: bounds.width * config.scale / previous,
            height: bounds.height * config.scale / previous }
        }
      }
    }
    if ('sourceId' in patch && (patch.sourceId === null || (Number.isSafeInteger(patch.sourceId) && patch.sourceId! > 0))) {
      // Uma origem confirmada explicitamente pode ser retomada enquanto aguardamos
      // o próximo perfil. Seguir o perfil continua exigindo o nome configurado.
      config.autoSource = patch.sourceId === null || patch.autoSource === true
      const sourceId = patch.sourceId === null
        ? mode === 'live' ? identity.snapshot()?.sourceId ?? null : mode === 'replay' && sources.size === 1 ? [...sources.keys()][0] : null
        : patch.sourceId!
      if (sourceId !== config.sourceId) bindSource(sourceId, mode === 'replay' ? (replayClock ?? 0) : Date.now(), 'source-change')
    }
    showPanels(); return state()
  })
  ipcMain.handle('overlay:start', () => { start(); broadcast(); return state() })
  ipcMain.handle('overlay:stop', () => { stop(); broadcast(); return state() })
  ipcMain.handle('overlay:pause', (_event, paused: boolean) => {
    if (typeof paused === 'boolean' && !meter.measurementWindow && (status === 'live' || status === 'replay')) {
      const at = mode === 'replay' ? (replayClock ?? Date.now()) : Date.now()
      if (!paused && meter.paused) resumedAt = at
      meter.setPaused(paused, at)
      recentDamage = []; checkpoint(); broadcast()
    }
    return state()
  })
  ipcMain.handle('overlay:timer', (_event, action: string) => {
    const at = Date.now()
    if (action === 'start') {
      if (mode !== 'live' || status !== 'live' || config.sourceId === null) throw Error('Inicie a leitura e identifique/selecione seu personagem antes do teste.')
      finishEncounter('timed-start'); newEncounter(); recentDamage = []; config.reviewEncounterId = null
      const startsAt = at + (config.countdownSec ?? 5) * 1000
      meter.schedule(startsAt, config.durationSec ?? 60); resumedAt = startsAt
    } else if (action === 'cancel') {
      meter.cancelSchedule(at); checkpoint('timed-cancelled')
    } else if (action === 'clear') {
      finishEncounter('timed-clear'); newEncounter(); meter.reset(at); meter.setPaused(false, at)
      resumedAt = at; recentDamage = []; config.reviewEncounterId = null
    }
    save(); broadcast(); return state()
  })
  ipcMain.handle('overlay:interactive', (event, enabled: boolean) => {
    const panel = panels.find(key => windows[key]?.webContents === event.sender)
    if (!panel || panel === 'controls' || typeof enabled !== 'boolean') return
    if (enabled) interactivePanels.add(panel)
    else interactivePanels.delete(panel)
    windows[panel]?.setIgnoreMouseEvents(config.locked && !enabled, { forward: true })
  })
  ipcMain.handle('overlay:reset', () => { finishEncounter('reset'); newEncounter(); recentDamage = []; config.reviewEncounterId = null;
    meter.reset(mode === 'replay' ? (replayClock ?? 0) : Date.now()); save(); broadcast(); return state() })
  ipcMain.handle('overlay:bounds', (_event, panel: OverlayPanel, bounds: PanelBounds) => {
    if (!panels.includes(panel) || (panel !== 'controls' && config.locked) || !bounds || !gameBounds
      || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(bounds[key as keyof PanelBounds]))) return
    storeBounds(panel, bounds); showPanels()
  })
  ipcMain.handle('overlay:replay', async (_event, speed = 1) => {
    if (![1, 5, 20, 100].includes(speed)) speed = 1
    const result = await dialog.showOpenDialog(owner, { title: 'Reproduzir análise de captura',
      filters: [{ name: 'Análise de pacotes', extensions: ['json'] }], properties: ['openFile'] })
    if (!result.canceled) { start(result.filePaths[0], speed); broadcast() }
    return state()
  })
  const timer = setInterval(() => {
    if (combatPanelsVisible !== combatVisible()) showPanels()
    for (const panel of interactivePanels) {
      const window = windows[panel]
      if (!window) { interactivePanels.delete(panel); continue }
      const bounds = window.getBounds(), cursor = screen.getCursorScreenPoint()
      if (cursor.x < bounds.x || cursor.y < bounds.y || cursor.x >= bounds.x + bounds.width || cursor.y >= bounds.y + bounds.height) {
        interactivePanels.delete(panel); window.setIgnoreMouseEvents(config.locked, { forward: true })
      }
    }
    if (gameForeground && Date.now() - foregroundSeenAt > 5000) { gameForeground = false; controlsEditing = false; showPanels() }
    broadcast()
  }, 250)
  const logTimer = setInterval(() => { unknownLog.flush(); buffLog.flush(); checkpoint() }, 1000)
  const editShortcut = globalShortcut.register('CommandOrControl+Shift+F9', () => { config.locked = !config.locked; showPanels() })
  const showShortcut = globalShortcut.register('CommandOrControl+Shift+F10', () => {
    const show = !config.totalVisible && !config.skillsVisible
    config.totalVisible = config.skillsVisible = show; showPanels()
  })
  const currentShortcut = globalShortcut.register('CommandOrControl+Shift+F8', () => {
    config.reviewEncounterId = null; save(); broadcast()
  })
  const controlsShortcut = globalShortcut.register('CommandOrControl+Shift+F11', () => {
    config.controlsVisible = !config.controlsVisible; showPanels()
  })
  if (!editShortcut || !showShortcut || !currentShortcut || !controlsShortcut) message = 'Um atalho está ocupado. Use os controles na tela de overlays.'
  owner.once('closed', () => {
    foregroundChild?.removeAllListeners(); foregroundChild?.stdout?.removeAllListeners(); foregroundChild?.kill()
    stop(); clearInterval(timer); clearInterval(logTimer); clearTimeout(saveTimer); clearTimeout(focusHideTimer)
    try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(config, null, 2)) } catch { /* já informado no fluxo de gravação */ }
    for (const window of Object.values(windows)) if (window && !window.isDestroyed()) window.destroy()
    globalShortcut.unregister('CommandOrControl+Shift+F9'); globalShortcut.unregister('CommandOrControl+Shift+F10')
    globalShortcut.unregister('CommandOrControl+Shift+F8')
    globalShortcut.unregister('CommandOrControl+Shift+F11')
    for (const name of ['get', 'buffs', 'history', 'deaths', 'record-death', 'clear-records', 'configure', 'start', 'stop', 'pause', 'timer', 'interactive', 'reset', 'bounds', 'replay']) ipcMain.removeHandler(`overlay:${name}`)
  })
}
