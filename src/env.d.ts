/// <reference types="vite/client" />

interface UpdateAPI {
  onAvailable:    (cb: (p: { version: string }) => void) => void
  onNotAvailable: (cb: () => void) => void
  onProgress:     (cb: (p: { percent: number }) => void) => void
  onDownloaded:   (cb: (p: { version: string }) => void) => void
  install:        () => void
}

interface Window {
  updateAPI?: UpdateAPI
  dataAPI?: {
    onMigration:  (cb: (payload: { files: string[] }) => void) => void
    pickLogFiles: () => Promise<Array<{ name: string; content: string }>>
    [key: string]: unknown
  }
}
