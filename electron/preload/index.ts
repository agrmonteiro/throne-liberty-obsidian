import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ─── Stored listener refs — use removeListener instead of removeAllListeners ──
// removeAllListeners would destroy listeners registered by other components.
type ProgressPayload = { stage: 'starting' | 'downloading-browser' | 'extracting' | 'done' }
type LogPayload      = { line: string }
let _progressCb: ((_e: Electron.IpcRendererEvent, p: ProgressPayload) => void) | null = null
let _logCb:      ((_e: Electron.IpcRendererEvent, p: LogPayload)      => void) | null = null

// ─── Data API exposed to renderer ─────────────────────────────────────────────
const dataAPI = {
  read:                  (filename: string)                   => ipcRenderer.invoke('data:read', filename),
  write:                 (filename: string, data: unknown)    => ipcRenderer.invoke('data:write', filename, data),
  importFile:            ()                                   => ipcRenderer.invoke('data:import-file'),
  exportFile:            (data: unknown, defaultName: string) => ipcRenderer.invoke('data:export-file', data, defaultName),
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
  // Combat log folder management
  combatlogPickFolder:   ()                                   => ipcRenderer.invoke('combatlog:pick-folder'),
  combatlogGetFolder:    ()                                   => ipcRenderer.invoke('combatlog:get-folder'),
  combatlogListFiles:    (folder: string)                     => ipcRenderer.invoke('combatlog:list-files', folder),
  combatlogReadFile:     (filePath: string)                   => ipcRenderer.invoke('combatlog:read-file', filePath),
  combatlogDeleteFile:   (filePath: string)                   => ipcRenderer.invoke('combatlog:delete-file', filePath),
  // Scraper setup
  scraperGetPath:        ()                                   => ipcRenderer.invoke('scraper:get-path'),
  scraperSetPath:        (p: string)                          => ipcRenderer.invoke('scraper:set-path', p),
  scraperPickFile:       ()                                   => ipcRenderer.invoke('scraper:pick-file'),
  scraperDetect:         ()                                   => ipcRenderer.invoke('scraper:detect'),
  scraperOpenLog:        ()                                   => ipcRenderer.invoke('scraper:open-log'),
  scraperReadLog:        ()                                   => ipcRenderer.invoke('scraper:read-log'),
}

// ─── Update API ───────────────────────────────────────────────────────────────
type UpdateAvailablePayload  = { version: string }
type UpdateProgressPayload   = { percent: number }
type UpdateDownloadedPayload = { version: string }
let _updateAvailableCb:  ((_e: Electron.IpcRendererEvent, p: UpdateAvailablePayload)  => void) | null = null
let _updateProgressCb:   ((_e: Electron.IpcRendererEvent, p: UpdateProgressPayload)   => void) | null = null
let _updateDownloadedCb: ((_e: Electron.IpcRendererEvent, p: UpdateDownloadedPayload) => void) | null = null
let _updateNotAvailableCb: ((_e: Electron.IpcRendererEvent) => void) | null = null

const updateAPI = {
  onAvailable: (cb: (p: UpdateAvailablePayload) => void) => {
    if (_updateAvailableCb) ipcRenderer.removeListener('update:available', _updateAvailableCb)
    _updateAvailableCb = (_e, p) => cb(p)
    ipcRenderer.on('update:available', _updateAvailableCb)
  },
  onNotAvailable: (cb: () => void) => {
    if (_updateNotAvailableCb) ipcRenderer.removeListener('update:not-available', _updateNotAvailableCb)
    _updateNotAvailableCb = (_e) => cb()
    ipcRenderer.on('update:not-available', _updateNotAvailableCb)
  },
  onProgress: (cb: (p: UpdateProgressPayload) => void) => {
    if (_updateProgressCb) ipcRenderer.removeListener('update:progress', _updateProgressCb)
    _updateProgressCb = (_e, p) => cb(p)
    ipcRenderer.on('update:progress', _updateProgressCb)
  },
  onDownloaded: (cb: (p: UpdateDownloadedPayload) => void) => {
    if (_updateDownloadedCb) ipcRenderer.removeListener('update:downloaded', _updateDownloadedCb)
    _updateDownloadedCb = (_e, p) => cb(p)
    ipcRenderer.on('update:downloaded', _updateDownloadedCb)
  },
  install: () => ipcRenderer.send('update:install'),
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
