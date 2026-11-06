import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { OverlayAPI } from '../../src/engine/overlayMeter'

const overlayAPI: OverlayAPI = {
  characterStats: () => ipcRenderer.invoke('overlay:character-stats'),
  openBuildImport: () => ipcRenderer.invoke('overlay:open-build-import'),
  onBuildImport: callback => {
    const listener = (): void => callback()
    ipcRenderer.on('overlay:open-build-import', listener)
    return () => ipcRenderer.removeListener('overlay:open-build-import', listener)
  },
  buffs: () => ipcRenderer.invoke('overlay:buffs'),
  buffContributions: () => ipcRenderer.invoke('overlay:buff-contributions'),
  deaths: () => ipcRenderer.invoke('overlay:deaths'),
  recordDeath: () => ipcRenderer.invoke('overlay:record-death'),
  clearRecords: () => ipcRenderer.invoke('overlay:clear-records'),
  history: () => ipcRenderer.invoke('overlay:history'),
  get: () => ipcRenderer.invoke('overlay:get'),
  configure: patch => ipcRenderer.invoke('overlay:configure', patch),
  start: () => ipcRenderer.invoke('overlay:start'),
  stop: () => ipcRenderer.invoke('overlay:stop'),
  pause: paused => ipcRenderer.invoke('overlay:pause', paused),
  timer: action => ipcRenderer.invoke('overlay:timer', action),
  interactive: enabled => ipcRenderer.invoke('overlay:interactive', enabled),
  reset: () => ipcRenderer.invoke('overlay:reset'),
  replay: speed => ipcRenderer.invoke('overlay:replay', speed),
  bounds: (panel, value) => ipcRenderer.invoke('overlay:bounds', panel, value),
  subscribe: callback => {
    const listener = (_event: Electron.IpcRendererEvent, value: Parameters<typeof callback>[0]) => callback(value)
    ipcRenderer.on('overlay:state', listener)
    return () => ipcRenderer.removeListener('overlay:state', listener)
  },
}
contextBridge.exposeInMainWorld('overlayAPI', overlayAPI)

// ─── Stored listener refs — use removeListener instead of removeAllListeners ──
// removeAllListeners would destroy listeners registered by other components.
type ProgressPayload = { stage: 'starting' | 'downloading-browser' | 'extracting' | 'done' }
type LogPayload      = { line: string }
type OcrProgressPayload = { current: number; total: number; percent: number; fileName: string; status: string; foundFields?: string[] }
let _progressCb: ((_e: Electron.IpcRendererEvent, p: ProgressPayload) => void) | null = null
let _logCb:      ((_e: Electron.IpcRendererEvent, p: LogPayload)      => void) | null = null
let _ocrProgressCb: ((_e: Electron.IpcRendererEvent, p: OcrProgressPayload) => void) | null = null

// ─── Data API exposed to renderer ─────────────────────────────────────────────
const dataAPI = {
  read:                  (filename: string)                   => ipcRenderer.invoke('data:read', filename),
  write:                 (filename: string, data: unknown)    => ipcRenderer.invoke('data:write', filename, data),
  importFile:            ()                                   => ipcRenderer.invoke('data:import-file'),
  ocrImportBuild:        ()                                   => ipcRenderer.invoke('builds:ocr-import'),
  combatLabListWindows:  ()                                   => ipcRenderer.invoke('combat-lab:list-windows'),
  combatLabCapture:      (sourceId: string)                   => ipcRenderer.invoke('combat-lab:capture-window', sourceId),
  combatLabOcr:          (imagePath: string, area?: { x: number; y: number; width: number; height: number }) => ipcRenderer.invoke('combat-lab:ocr-capture', imagePath, area),
  combatLabPickVideo:    () => ipcRenderer.invoke('combat-lab:pick-video'),
  combatLabSaveFrame:   (dataUrl: string, videoName: string, atSec: number) => ipcRenderer.invoke('combat-lab:save-frame', dataUrl, videoName, atSec),
  exportFile:            (data: unknown, defaultName: string) => ipcRenderer.invoke('data:export-file', data, defaultName),
  importRazerMacro:       ()                                   => ipcRenderer.invoke('macro:import-xml'),
  exportRazerMacro:       (xml: string, defaultName: string)   => ipcRenderer.invoke('macro:export-xml', xml, defaultName),
  dir:                   ()                                   => ipcRenderer.invoke('data:dir'),
  questlogImportPython:  (url: string)                        => ipcRenderer.invoke('questlog:import-python', url),
  questlogCancel:        ()                                   => ipcRenderer.invoke('questlog:cancel'),
  onProgress:            (cb: (payload: ProgressPayload) => void) => {
    if (_progressCb) ipcRenderer.removeListener('questlog:progress', _progressCb)
    _progressCb = (_event, payload) => cb(payload)
    ipcRenderer.on('questlog:progress', _progressCb)
  },
  offProgress:           () => {
    if (_progressCb) { ipcRenderer.removeListener('questlog:progress', _progressCb); _progressCb = null }
  },
  onLog:                 (cb: (payload: LogPayload) => void) => {
    if (_logCb) ipcRenderer.removeListener('questlog:log', _logCb)
    _logCb = (_event, payload) => cb(payload)
    ipcRenderer.on('questlog:log', _logCb)
  },
  offLog:                () => {
    if (_logCb) { ipcRenderer.removeListener('questlog:log', _logCb); _logCb = null }
  },
  onOcrProgress:         (cb: (payload: OcrProgressPayload) => void) => {
    if (_ocrProgressCb) ipcRenderer.removeListener('builds:ocr-progress', _ocrProgressCb)
    _ocrProgressCb = (_event, payload) => cb(payload)
    ipcRenderer.on('builds:ocr-progress', _ocrProgressCb)
  },
  offOcrProgress:        () => {
    if (_ocrProgressCb) { ipcRenderer.removeListener('builds:ocr-progress', _ocrProgressCb); _ocrProgressCb = null }
  },
  // Combat log folder management
  combatlogPickFolder:   ()                                   => ipcRenderer.invoke('combatlog:pick-folder'),
  combatlogGetFolder:    ()                                   => ipcRenderer.invoke('combatlog:get-folder'),
  combatlogListFiles:    (folder: string)                     => ipcRenderer.invoke('combatlog:list-files', folder),
  combatlogReadFile:     (filePath: string)                   => ipcRenderer.invoke('combatlog:read-file', filePath),
  combatlogDeleteFile:   (filePath: string)                   => ipcRenderer.invoke('combatlog:delete-file', filePath),
  onMigration:           (cb: (payload: { files: string[] }) => void) => {
    ipcRenderer.once('migration:done', (_e, p) => cb(p))
  },
  // Error report
  sendReport:            (note: string)                       => ipcRenderer.invoke('report:send', note),
  // Scraper setup
  scraperGetPath:        ()                                   => ipcRenderer.invoke('scraper:get-path'),
  scraperSetPath:        (p: string)                          => ipcRenderer.invoke('scraper:set-path', p),
  scraperPickFile:       ()                                   => ipcRenderer.invoke('scraper:pick-file'),
  scraperDetect:         ()                                   => ipcRenderer.invoke('scraper:detect'),
  scraperOpenLog:            ()                               => ipcRenderer.invoke('scraper:open-log'),
  scraperReadLog:            ()                               => ipcRenderer.invoke('scraper:read-log'),
  scraperReinstallPlaywright: ()                              => ipcRenderer.invoke('scraper:reinstall-playwright'),
  pickLogFiles:          ()                                   => ipcRenderer.invoke('data:pick-log-files'),
}

// ─── Update API ───────────────────────────────────────────────────────────────
type UpdateAvailablePayload  = { version: string }
type UpdateProgressPayload   = { percent: number }
type UpdateDownloadedPayload = { version: string }
type UpdateErrorPayload      = { message: string }

type Unsubscribe = () => void

// O updater possui dois consumidores na janela principal: Sidebar e
// UpdateNotifier. Um único callback por canal fazia a última inscrição apagar
// a anterior, deixando o estado do botão de atualização sem evento terminal.
const updateAvailableListeners = new Set<(p: UpdateAvailablePayload) => void>()
const updateProgressListeners = new Set<(p: UpdateProgressPayload) => void>()
const updateDownloadedListeners = new Set<(p: UpdateDownloadedPayload) => void>()
const updateNotAvailableListeners = new Set<() => void>()
const updateErrorListeners = new Set<(p: UpdateErrorPayload) => void>()
const updateStalledListeners = new Set<() => void>()

function subscribe<T>(listeners: Set<(payload: T) => void>, callback: (payload: T) => void): Unsubscribe {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function subscribeWithoutPayload(listeners: Set<() => void>, callback: () => void): Unsubscribe {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

ipcRenderer.on('update:available', (_event, payload: UpdateAvailablePayload) => {
  updateAvailableListeners.forEach(listener => listener(payload))
})
ipcRenderer.on('update:not-available', () => {
  updateNotAvailableListeners.forEach(listener => listener())
})
ipcRenderer.on('update:progress', (_event, payload: UpdateProgressPayload) => {
  updateProgressListeners.forEach(listener => listener(payload))
})
ipcRenderer.on('update:downloaded', (_event, payload: UpdateDownloadedPayload) => {
  updateDownloadedListeners.forEach(listener => listener(payload))
})
ipcRenderer.on('update:error', (_event, payload: UpdateErrorPayload) => {
  updateErrorListeners.forEach(listener => listener(payload))
})
ipcRenderer.on('update:stalled', () => {
  updateStalledListeners.forEach(listener => listener())
})

const updateAPI = {
  onAvailable: (cb: (p: UpdateAvailablePayload) => void) => subscribe(updateAvailableListeners, cb),
  onNotAvailable: (cb: () => void) => subscribeWithoutPayload(updateNotAvailableListeners, cb),
  onProgress: (cb: (p: UpdateProgressPayload) => void) => subscribe(updateProgressListeners, cb),
  onDownloaded: (cb: (p: UpdateDownloadedPayload) => void) => subscribe(updateDownloadedListeners, cb),
  onError: (cb: (p: UpdateErrorPayload) => void) => subscribe(updateErrorListeners, cb),
  onStalled: (cb: () => void) => subscribeWithoutPayload(updateStalledListeners, cb),
  install:   () => ipcRenderer.send('update:install'),
  checkNow:  () => ipcRenderer.send('update:check'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('dataAPI', dataAPI)
    contextBridge.exposeInMainWorld('updateAPI', updateAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.dataAPI = dataAPI
}
