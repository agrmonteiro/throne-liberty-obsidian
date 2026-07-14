/// <reference types="vite/client" />

type DataWriteResult = { ok: true } | { ok: false; error?: string }

type CombatLogFile = {
  name: string
  path: string
  sizeBytes: number
  mtime: number
}

type ScraperDetection = {
  scraperFound: boolean
  scraperPath: string | null
  pythonOk: boolean
  pythonVersion: string
}

interface DataAPI {
  read: (filename: string) => Promise<any>
  write: (filename: string, data: unknown) => Promise<DataWriteResult>
  importFile: () => Promise<any>
  exportFile: (data: unknown, defaultName: string) => Promise<{ ok: boolean; path?: string; error?: string }>
  dir: () => Promise<string>
  pickLogFiles: () => Promise<Array<{ name: string; content: string }>>
  questlogImportPython: (url: string) => Promise<any>
  questlogCancel: () => Promise<{ ok: boolean }>
  onProgress: (cb: (payload: { stage: 'starting' | 'downloading-browser' | 'extracting' | 'done' }) => void) => void
  offProgress: () => void
  onLog: (cb: (payload: { line: string }) => void) => void
  offLog: () => void
  combatlogPickFolder: () => Promise<string | null | { error: string }>
  combatlogGetFolder: () => Promise<string | null>
  combatlogListFiles: (folder: string) => Promise<CombatLogFile[]>
  combatlogReadFile: (filePath: string) => Promise<string | null>
  combatlogDeleteFile: (filePath: string) => Promise<DataWriteResult>
  onMigration: (cb: (payload: { files: string[] }) => void) => void
  sendReport: (note: string) => Promise<DataWriteResult>
  scraperGetPath: () => Promise<string | null>
  scraperSetPath: (path: string) => Promise<DataWriteResult>
  scraperPickFile: () => Promise<string | null>
  scraperDetect: () => Promise<ScraperDetection>
  scraperOpenLog: () => Promise<DataWriteResult>
  scraperReadLog: () => Promise<string>
  scraperReinstallPlaywright: () => Promise<{ ok: boolean; output?: string; error?: string }>
}

interface UpdateAPI {
  onAvailable:    (cb: (p: { version: string }) => void) => void
  onNotAvailable: (cb: () => void) => void
  onProgress:     (cb: (p: { percent: number }) => void) => void
  onDownloaded:   (cb: (p: { version: string }) => void) => void
  onError:        (cb: (p: { message: string }) => void) => void
  onStalled:      (cb: () => void) => void
  install:        () => void
  checkNow:       () => void
}

interface Window {
  updateAPI?: UpdateAPI
  dataAPI: DataAPI
}
