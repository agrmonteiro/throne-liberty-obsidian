import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

// ─── Data directory (AppData/Roaming/throne-liberty/data) ─────────────────────
const DATA_DIR = path.join(app.getPath('userData'), 'data')

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  // Initialize empty files if they don't exist
  const defaults: Record<string, unknown> = {
    'builds.json': {},
    'settings.json': { theme: 'obsidian', port: 8501 },
  }
  for (const [file, defaultVal] of Object.entries(defaults)) {
    const filePath = path.join(DATA_DIR, file)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf-8')
    }
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Read a JSON file from data dir
ipcMain.handle('data:read', (_event, filename: string) => {
  try {
    const filePath = path.join(DATA_DIR, filename)
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('data:read error', err)
    return null
  }
})

// Write a JSON file to data dir
ipcMain.handle('data:write', (_event, filename: string, data: unknown) => {
  try {
    const filePath = path.join(DATA_DIR, filename)
    const tmp = filePath + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmp, filePath)
    return { ok: true }
  } catch (err) {
    console.error('data:write error', err)
    return { ok: false, error: String(err) }
  }
})

// Import builds from a user-selected JSON file
ipcMain.handle('data:import-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Importar Build (JSON)',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
})

// Export builds to a user-selected path
ipcMain.handle('data:export-file', async (_event, data: unknown, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    title: 'Exportar Build',
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (result.canceled || !result.filePath) return { ok: false }
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true, path: result.filePath }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

// Get data directory path (for display)
ipcMain.handle('data:dir', () => DATA_DIR)

// ─── Python scraper import ────────────────────────────────────────────────────
// Calls questlog_scraper_standalone.py from throne_and_liberty_agent project.
// The script prints debug to stderr and JSON result to stdout.

const PYTHON_SCRAPER = path.join(
  path.dirname(path.dirname(path.dirname(app.getPath('exe')))),
  'throne_and_liberty_agent', 'scraper', 'questlog_scraper_standalone.py'
)

// Resolve script path relative to project roots — tries a few locations
function findPythonScraper(): string | null {
  const candidates = [
    // Sibling project (dev: both under Documentos/python/)
    path.join(path.dirname(process.cwd()), 'throne_and_liberty_agent', 'scraper', 'questlog_scraper_standalone.py'),
    // Same parent as app exe (packaged)
    PYTHON_SCRAPER,
    // Explicit env var override
    process.env['TL_SCRAPER_PATH'] ?? '',
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return null
}

ipcMain.handle('questlog:import-python', (_event, url: string): Promise<unknown> => {
  return new Promise((resolve) => {
    const scriptPath = findPythonScraper()
    if (!scriptPath) {
      resolve({ error: 'Scraper não encontrado — verifique a instalação do throne_and_liberty_agent' })
      return
    }

    const sender = _event.sender
    const emitProgress = (stage: 'starting' | 'extracting' | 'done') => {
      if (!sender.isDestroyed()) sender.send('questlog:progress', { stage })
    }

    emitProgress('starting')

    const pythonBin = process.platform === 'win32' ? 'python' : 'python3'
    let stdout = ''
    let stderr = ''
    let extractingEmitted = false

    const proc = spawn(pythonBin, [scriptPath, url], { env: { ...process.env } })

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
      if (!extractingEmitted && stdout.length > 0) {
        extractingEmitted = true
        emitProgress('extracting')
      }
    })

    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[scraper] stderr:', stderr)
        resolve({ error: `Scraper encerrou sem dados (código ${code}) — verifique o link e tente novamente` })
        return
      }
      const jsonStart = stdout.indexOf('{')
      if (jsonStart === -1) {
        console.error('[scraper] stdout sem JSON:', stdout.slice(0, 200))
        resolve({ error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' })
        return
      }
      try {
        resolve(JSON.parse(stdout.slice(jsonStart)))
      } catch (e) {
        console.error('[scraper] JSON parse error:', e)
        resolve({ error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' })
      }
    })

    proc.on('error', (err) => {
      console.error('[scraper] spawn error:', err)
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        resolve({ error: 'Python não encontrado no PATH — verifique a instalação do Python' })
      } else {
        resolve({ error: `Scraper encerrou sem dados — verifique o link e tente novamente` })
      }
    })
  })
})

// ─── Window ────────────────────────────────────────────────────────────────────

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        960,
    minHeight:       600,
    show:            false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0c0e',
    titleBarStyle:   'hidden',
    titleBarOverlay: {
      color:        '#0b0c0e',
      symbolColor:  '#d4af37',
      height:       32,
    },
    webPreferences: {
      preload:           join(__dirname, '../preload/index.cjs'),
      sandbox:           false,
      contextIsolation:  true,
      nodeIntegration:   false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.thronebuilds.obsidian')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ensureDataDir()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
