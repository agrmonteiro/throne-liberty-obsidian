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

// ─── Security helpers ─────────────────────────────────────────────────────────

/**
 * Resolve `filePath` and assert it is inside `baseDir`.
 * Throws if the resolved path escapes the base (path traversal guard).
 */
function assertInsideDir(baseDir: string, filePath: string): string {
  const resolvedBase = path.resolve(baseDir)
  const resolvedFile = path.resolve(filePath)
  if (!resolvedFile.startsWith(resolvedBase + path.sep) && resolvedFile !== resolvedBase) {
    throw new Error(`Acesso negado: caminho fora do diretório autorizado.`)
  }
  return resolvedFile
}

/**
 * Read the saved combat-log folder from settings (main-process side, no renderer input).
 */
function getSavedCombatLogFolder(): string | null {
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json')
    if (!fs.existsSync(settingsPath)) return null
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    return typeof settings.combatLogFolder === 'string' ? settings.combatLogFolder : null
  } catch {
    return null
  }
}

/**
 * Sanitize a filename: reject anything with path separators or '..'
 */
function sanitizeDataFilename(filename: string): string {
  if (!filename || /[/\\]|\.\./.test(filename)) {
    throw new Error(`Nome de arquivo inválido: "${filename}"`)
  }
  return filename
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Read a JSON file from data dir
ipcMain.handle('data:read', (_event, filename: string) => {
  try {
    const safe = sanitizeDataFilename(filename)
    const filePath = path.join(DATA_DIR, safe)
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
    const safe = sanitizeDataFilename(filename)
    // SEC-03: validate payload structure for known files
    if (safe === 'builds.json') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { ok: false, error: 'Payload inválido para builds.json' }
      }
    }
    const filePath = path.join(DATA_DIR, safe)
    const tmp = filePath + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmp, filePath)
    return { ok: true }
  } catch (err) {
    console.error('data:write error', err)
    // SEC-04: never expose internal error details to renderer
    return { ok: false, error: 'Erro ao salvar arquivo — tente novamente' }
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

// ─── Combat Log folder management ────────────────────────────────────────────

// Let user pick a folder (returns the path or null)
ipcMain.handle('combatlog:pick-folder', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win || undefined as any, {
      title: 'Selecionar pasta de Combat Logs do T&L',
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const folder = result.filePaths[0]

    // Persist in settings.json
    const settingsPath = path.join(DATA_DIR, 'settings.json')
    let settings: any = {}
    if (fs.existsSync(settingsPath)) {
      try {
        const raw = fs.readFileSync(settingsPath, 'utf-8')
        settings = JSON.parse(raw)
      } catch (e) { settings = {} }
    }
    
    settings.combatLogFolder = folder
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    return folder
  } catch (err: any) {
    console.error('combatlog:pick-folder error', err)
    return { error: err.message || String(err) }
  }
})

// Get the saved combat log folder from settings
ipcMain.handle('combatlog:get-folder', () => {
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json')
    if (!fs.existsSync(settingsPath)) return null
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    return settings.combatLogFolder ?? null
  } catch {
    return null
  }
})

// List .txt/.log files in the combat log folder
// NOTE: ignora o folder enviado pelo renderer — usa sempre o salvo em settings.json
ipcMain.handle('combatlog:list-files', (_event, _folder: string) => {
  try {
    const folder = getSavedCombatLogFolder()
    if (!folder || !fs.existsSync(folder)) return []
    const entries = fs.readdirSync(folder, { withFileTypes: true })
    return entries
      .filter(e => e.isFile() && (e.name.endsWith('.txt') || e.name.endsWith('.log')))
      .map(e => {
        const fullPath = path.join(folder, e.name)
        const stat = fs.statSync(fullPath)
        return { name: e.name, path: fullPath, sizeBytes: stat.size, mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime) // newest first
  } catch (err) {
    console.error('combatlog:list-files error', err)
    return []
  }
})

// Read a combat log file — valida que está dentro da pasta autorizada
ipcMain.handle('combatlog:read-file', (_event, filePath: string) => {
  try {
    const folder = getSavedCombatLogFolder()
    if (!folder) return null
    const safe = assertInsideDir(folder, filePath)
    if (!fs.existsSync(safe)) return null
    return fs.readFileSync(safe, 'utf-8')
  } catch (err) {
    console.error('combatlog:read-file error', err)
    return null
  }
})

// Delete a combat log file — valida que está dentro da pasta autorizada
ipcMain.handle('combatlog:delete-file', (_event, filePath: string) => {
  try {
    const folder = getSavedCombatLogFolder()
    if (!folder) return { ok: false, error: 'Pasta de combat log não configurada.' }
    const safe = assertInsideDir(folder, filePath)
    if (!fs.existsSync(safe)) return { ok: false, error: 'Arquivo não encontrado.' }
    if (!fs.statSync(safe).isFile()) return { ok: false, error: 'Caminho não é um arquivo.' }
    fs.unlinkSync(safe)
    return { ok: true }
  } catch (err: any) {
    console.error('combatlog:delete-file error', err)
    // SEC-04: never expose internal error details to renderer
    return { ok: false, error: 'Erro ao deletar arquivo — tente novamente' }
  }
})

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
    // SEC-01: validate URL before spawning subprocess — only questlog.gg allowed
    const QUESTLOG_URL_RE = /^https:\/\/questlog\.gg\//
    if (!url || !QUESTLOG_URL_RE.test(url.trim())) {
      resolve({ error: 'URL inválida — apenas links de https://questlog.gg/ são aceitos' })
      return
    }

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
    console.log('[Main] Loading Dev URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    console.log('[Main] Loading Production Path:', indexPath)
    if (!fs.existsSync(indexPath)) {
      console.error('[Main] CRITICAL: index.html not found at', indexPath)
    }
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('[Main] Failed to load index.html:', err)
    })
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
