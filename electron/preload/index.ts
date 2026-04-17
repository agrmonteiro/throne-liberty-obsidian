import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ─── Data API exposed to renderer ─────────────────────────────────────────────
const dataAPI = {
  read:                  (filename: string)                   => ipcRenderer.invoke('data:read', filename),
  write:                 (filename: string, data: unknown)    => ipcRenderer.invoke('data:write', filename, data),
  importFile:            ()                                   => ipcRenderer.invoke('data:import-file'),
  exportFile:            (data: unknown, defaultName: string) => ipcRenderer.invoke('data:export-file', data, defaultName),
  dir:                   ()                                   => ipcRenderer.invoke('data:dir'),
  questlogImportPython:  (url: string)                        => ipcRenderer.invoke('questlog:import-python', url),
  onProgress:            (cb: (payload: { stage: 'starting' | 'extracting' | 'done' }) => void) => {
    ipcRenderer.on('questlog:progress', (_event, payload) => cb(payload))
  },
  offProgress:           () => {
    ipcRenderer.removeAllListeners('questlog:progress')
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
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('dataAPI', dataAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.dataAPI = dataAPI
}
