import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import electronUpdaterPkg from 'electron-updater'
const { autoUpdater } = electronUpdaterPkg
import fs from 'fs'
import path from 'path'
import { spawn, execSync } from 'child_process'

// ─── Data directory (AppData/Roaming/Tier2 Command Lab/data) ──────────────────
const DATA_DIR = path.join(app.getPath('userData'), 'data')

// ─── Data migration (Throne & Liberty → Tier2 Command Lab) ────────────────────
function migrateOldDataDir(): { files: string[] } | null {
  const oldDir   = path.join(app.getPath('appData'), 'throne-liberty', 'data')
  const flagFile = path.join(DATA_DIR, '.migrated-from-throne')
  // Flag prevents re-running even if DATA_DIR already existed from beta.7/beta.8
  if (!fs.existsSync(oldDir) || fs.existsSync(flagFile)) return null
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const migrated: string[] = []
    for (const file of fs.readdirSync(oldDir)) {
      const src  = path.join(oldDir, file)
      const dest = path.join(DATA_DIR, file)
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest)
        migrated.push(file)
        console.log(`[migration] Migrated: ${file}`)
      }
    }
    fs.writeFileSync(flagFile, new Date().toISOString(), 'utf-8')
    console.log('[migration] Data migrated from Throne & Liberty → Tier2 Command Lab')
    return { files: migrated }
  } catch (err) {
    console.error('[migration] Migration failed:', err)
    return null
  }
}

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

// Pick multiple combat log files via OS dialog (multi-selection)
// SEC: paths vêm exclusivamente do dialog do SO — nenhum input do renderer
ipcMain.handle('data:pick-log-files', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Selecionar logs de combate',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Combat Logs', extensions: ['log', 'txt'] }],
  })
  if (result.canceled || !result.filePaths.length) return []
  return result.filePaths.map(p => ({
    name: path.basename(p),
    content: fs.readFileSync(p, 'utf-8'),
  }))
})

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

// Resolve scraper — bundled exe first, then .py fallbacks
function findPythonScraper(): string | null {
  // 1. Bundled exe in app resources (packaged production)
  const bundledExe = path.join(process.resourcesPath ?? '', 'questlog_scraper.exe')
  if (fs.existsSync(bundledExe)) return bundledExe

  // 2. Dev: sibling resources folder
  const devExe = path.join(process.cwd(), 'resources', 'questlog_scraper.exe')
  if (fs.existsSync(devExe)) return devExe

  // 3. User-configured .py path in settings.json
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json')
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      if (settings.scraperPath && fs.existsSync(settings.scraperPath)) return settings.scraperPath
    }
  } catch { /* ignore */ }

  // 4. Env var override
  const envPath = process.env['TL_SCRAPER_PATH']
  if (envPath && fs.existsSync(envPath)) return envPath

  // 5. Auto-detect .py in common locations
  const home = app.getPath('home')
  const pyFile = path.join('throne_and_liberty_agent', 'scraper', 'questlog_scraper_standalone.py')
  for (const base of [
    path.join(home, 'Documents', 'python'),
    path.join(home, 'Documents'),
    path.join(home, 'Desktop'),
    home,
    path.dirname(process.cwd()),
  ]) {
    const p = path.join(base, pyFile)
    if (fs.existsSync(p)) return p
  }

  return null
}

// ─── Scraper setup IPC handlers ───────────────────────────────────────────────

// Get current scraper path (from settings)
ipcMain.handle('scraper:get-path', () => {
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json')
    if (!fs.existsSync(settingsPath)) return null
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    return settings.scraperPath ?? null
  } catch { return null }
})

// Save a scraper path to settings
ipcMain.handle('scraper:set-path', (_event, scraperPath: string) => {
  try {
    if (!scraperPath || !fs.existsSync(scraperPath)) return { ok: false, error: 'Arquivo não encontrado' }
    const settingsPath = path.join(DATA_DIR, 'settings.json')
    let settings: Record<string, unknown> = {}
    if (fs.existsSync(settingsPath)) {
      try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) } catch { /* ignore */ }
    }
    settings.scraperPath = scraperPath
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao salvar configuração' }
  }
})

// Open file picker to locate the scraper .py
ipcMain.handle('scraper:pick-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(win ?? ({} as BrowserWindow), {
    title: 'Localizar questlog_scraper_standalone.py',
    filters: [{ name: 'Python Script', extensions: ['py'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const picked = result.filePaths[0]
  // Auto-save
  const settingsPath = path.join(DATA_DIR, 'settings.json')
  let settings: Record<string, unknown> = {}
  try { if (fs.existsSync(settingsPath)) settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) } catch { /* ignore */ }
  settings.scraperPath = picked
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
  return picked
})

// Auto-detect scraper and Python, return status
ipcMain.handle('scraper:detect', () => {
  const scraperPath = findPythonScraper()

  // Check Python
  let pythonOk = false
  let pythonVersion = ''
  for (const bin of ['python', 'python3', 'py']) {
    try {
      pythonVersion = execSync(`${bin} --version`, { timeout: 5000, encoding: 'utf-8' }).trim()
      pythonOk = true
      break
    } catch { /* try next */ }
  }

  return {
    scraperFound: !!scraperPath,
    scraperPath: scraperPath ?? null,
    pythonOk,
    pythonVersion,
  }
})

// Active scraper process + resolve ref — allows cancel from renderer
let activeScraperProc:    ReturnType<typeof spawn> | null = null
let activeScraperResolve: ((val: unknown) => void) | null = null
let activeScraperTimeout: ReturnType<typeof setTimeout> | null = null

const SCRAPER_LOG_FILE = path.join(DATA_DIR, 'scraper.log')

function writeScraperLog(lines: string): void {
  try {
    fs.appendFileSync(SCRAPER_LOG_FILE, lines, 'utf-8')
  } catch { /* ignore — log failure must not crash the import */ }
}

ipcMain.handle('scraper:open-log', () => {
  try {
    if (!fs.existsSync(SCRAPER_LOG_FILE)) {
      fs.writeFileSync(SCRAPER_LOG_FILE, '(sem logs ainda)\n', 'utf-8')
    }
    shell.openPath(SCRAPER_LOG_FILE)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('scraper:read-log', () => {
  try {
    if (!fs.existsSync(SCRAPER_LOG_FILE)) return ''
    return fs.readFileSync(SCRAPER_LOG_FILE, 'utf-8').slice(-8000)
  } catch { return '' }
})

ipcMain.handle('questlog:import-python', (_event, url: string): Promise<unknown> => {
  return new Promise((resolve) => {
    // Guard: reject concurrent imports — prevents activeScraperResolve being overwritten
    if (activeScraperProc) {
      resolve({ error: 'Já existe uma importação em andamento — aguarde ou cancele.' })
      return
    }

    activeScraperResolve = resolve

    // SEC-01: validate URL before spawning subprocess — only questlog.gg allowed
    const QUESTLOG_URL_RE = /^https:\/\/questlog\.gg\//
    const trimmedUrl = url?.trim() ?? ''
    if (!trimmedUrl || !QUESTLOG_URL_RE.test(trimmedUrl)) {
      resolve({ error: 'URL inválida — apenas links de https://questlog.gg/ são aceitos' })
      return
    }

    const scriptPath = findPythonScraper()
    if (!scriptPath) {
      resolve({ error: 'Scraper não encontrado — reinstale o Tier2 Command Lab ou verifique a pasta do agente' })
      return
    }

    const sender = _event.sender
    const emitProgress = (stage: 'starting' | 'downloading-browser' | 'extracting' | 'done') => {
      if (!sender.isDestroyed()) sender.send('questlog:progress', { stage })
    }

    emitProgress('starting')

    // Run .exe directly (bundled) or via python interpreter (dev)
    const isExe = scriptPath.endsWith('.exe')
    const [cmd, spawnArgs] = isExe
      ? [scriptPath, [trimmedUrl]]
      : [process.platform === 'win32' ? 'python' : 'python3', [scriptPath, trimmedUrl]]

    const logHeader = `\n${'─'.repeat(60)}\n[${new Date().toISOString()}] cmd=${cmd}\nargs=${JSON.stringify(spawnArgs)}\n${'─'.repeat(60)}\n`
    writeScraperLog(logHeader)

    let stdout = ''
    let stderr = ''
    let extractingEmitted = false
    let cancelled = false

    // Auto-timeout: kill process if it doesn't finish within 3 minutes
    const TIMEOUT_MS = 3 * 60 * 1000
    const timeoutHandle = activeScraperTimeout = setTimeout(() => {
      if (!activeScraperResolve) return // already resolved
      console.warn('[scraper] timeout after 3 minutes — killing process')
      const proc2  = activeScraperProc
      const res2   = activeScraperResolve
      activeScraperProc    = null
      activeScraperResolve = null
      try {
        if (process.platform === 'win32' && proc2?.pid) {
          execSync(`taskkill /F /T /PID ${proc2.pid}`, { stdio: 'ignore' })
        } else {
          proc2?.kill('SIGKILL')
        }
      } catch { /* ignore */ }
      writeScraperLog('[TIMEOUT] Processo encerrado após 3 minutos.\n')
      res2({ error: 'Tempo limite excedido (3 min) — o site pode estar lento ou bloqueando o acesso.' })
      if (!sender.isDestroyed()) sender.send('questlog:progress', { stage: 'done' })
    }, TIMEOUT_MS)

    // Strip ANSI escape codes from subprocess output lines
    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '')

    const emitLog = (raw: string) => {
      const lines = stripAnsi(raw).split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !sender.isDestroyed()) {
          sender.send('questlog:log', { line: trimmed })
        }
      }
    }

    const proc = spawn(cmd, spawnArgs, { env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } })
    activeScraperProc = proc

    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stdout += text
      writeScraperLog(`[stdout] ${stripAnsi(text)}`)

      // First-run: Chromium download in progress
      if (text.includes('[SETUP]') && text.includes('baixando')) {
        if (!sender.isDestroyed()) sender.send('questlog:progress', { stage: 'downloading-browser' })
        emitLog(text)
        return
      }

      emitLog(text)

      if (!extractingEmitted && stdout.length > 0) {
        extractingEmitted = true
        emitProgress('extracting')
      }
    })

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stderr += text
      writeScraperLog(`[stderr] ${stripAnsi(text)}`)
      emitLog(text)  // relay stderr live (playwright download progress goes here)
    })

    proc.on('close', (code) => {
      // Already resolved by cancel/timeout handler — ignore
      if (!activeScraperResolve) return
      clearTimeout(timeoutHandle)
      activeScraperProc    = null
      activeScraperResolve = null

      writeScraperLog(`[exit] code=${code}\n`)

      if (cancelled) {
        resolve({ error: 'cancelled' })
        return
      }
      if (code !== 0) {
        console.error('[scraper] stderr:', stderr)
        writeScraperLog(`[ERRO] código ${code}\nstderr:\n${stderr}\n`)
        resolve({ error: `Scraper encerrou sem dados (código ${code}) — verifique o link e tente novamente` })
        return
      }
      const jsonStart = stdout.indexOf('{')
      if (jsonStart === -1) {
        console.error('[scraper] stdout sem JSON:', stdout.slice(0, 200))
        writeScraperLog(`[ERRO] stdout sem JSON:\n${stdout.slice(0, 500)}\n`)
        resolve({ error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' })
        return
      }
      try {
        resolve(JSON.parse(stdout.slice(jsonStart)))
      } catch (e) {
        console.error('[scraper] JSON parse error:', e)
        writeScraperLog(`[ERRO] JSON parse: ${e}\nstdout:\n${stdout.slice(0, 500)}\n`)
        resolve({ error: 'Scraper retornou dados inválidos — tente novamente ou reporte o erro' })
      }
    })

    proc.on('error', (err) => {
      if (!activeScraperResolve) return
      clearTimeout(timeoutHandle)
      activeScraperProc    = null
      activeScraperResolve = null
      console.error('[scraper] spawn error:', err)
      writeScraperLog(`[ERRO] spawn: ${err}\n`)
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        resolve({ error: isExe
          ? 'Scraper não encontrado — reinstale o aplicativo'
          : 'Python não encontrado no PATH — verifique a instalação do Python'
        })
      } else {
        resolve({ error: `Scraper encerrou sem dados — verifique o link e tente novamente` })
      }
    })
  })
})

ipcMain.handle('questlog:cancel', () => {
  const proc    = activeScraperProc
  const resolveImport = activeScraperResolve
  if (!proc) return { ok: false }

  // Clear refs before killing so close/timeout events ignore the signal
  activeScraperProc    = null
  activeScraperResolve = null
  if (activeScraperTimeout) { clearTimeout(activeScraperTimeout); activeScraperTimeout = null }

  let killFailed = false
  try {
    if (process.platform === 'win32' && proc.pid) {
      // taskkill /F /T kills the entire process tree on Windows
      execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' })
    } else {
      proc.kill('SIGKILL')
    }
  } catch (e) {
    // Log the error — process may have already exited, or kill failed (permissions, etc.)
    console.error('[scraper] taskkill failed:', e)
    killFailed = true
  }

  // Resolve the pending IPC promise immediately — don't wait for close event
  resolveImport?.({ error: killFailed ? 'Não foi possível cancelar — o processo pode continuar em background' : 'cancelled' })
  return { ok: !killFailed }
})

// Reinstall playwright + chromium (called from Settings when scraper deps are missing)
ipcMain.handle('scraper:reinstall-playwright', (): Promise<{ ok: boolean; output?: string; error?: string }> => {
  return new Promise((resolve) => {
    let pythonBin: string | null = null
    for (const bin of ['python', 'python3', 'py']) {
      try { execSync(`${bin} --version`, { timeout: 5000 }); pythonBin = bin; break } catch { /* try next */ }
    }
    if (!pythonBin) {
      resolve({ ok: false, error: 'Python não encontrado — instale o Python antes de continuar.' })
      return
    }
    const out: string[] = []
    const pip = spawn(pythonBin, ['-m', 'pip', 'install', 'playwright', '--upgrade'], { env: { ...process.env } })
    pip.stdout.on('data', (c: Buffer) => out.push(c.toString()))
    pip.stderr.on('data', (c: Buffer) => out.push(c.toString()))
    pip.on('error', (err) => resolve({ ok: false, error: err.message, output: out.join('') }))
    pip.on('close', (code) => {
      if (code !== 0) { resolve({ ok: false, error: `pip install falhou (código ${code})`, output: out.join('') }); return }
      const pw = spawn(pythonBin!, ['-m', 'playwright', 'install', 'chromium'], { env: { ...process.env } })
      pw.stdout.on('data', (c: Buffer) => out.push(c.toString()))
      pw.stderr.on('data', (c: Buffer) => out.push(c.toString()))
      pw.on('error', (err) => resolve({ ok: false, error: err.message, output: out.join('') }))
      pw.on('close', (code2) => {
        if (code2 !== 0) { resolve({ ok: false, error: `playwright install falhou (código ${code2})`, output: out.join('') }); return }
        resolve({ ok: true, output: out.join('') })
      })
    })
  })
})

// ─── Auto-updater ─────────────────────────────────────────────────────────────

function setupAutoUpdater(win: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update:available', { version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    win.webContents.send('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    win.webContents.send('update:progress', { percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update:downloaded', { version: info.version })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err)
  })

  // Verifica update 5 segundos após iniciar (deixa o app renderizar primeiro)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] checkForUpdates failed:', err)
    })
  }, 5000)
}

ipcMain.on('update:install', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.on('update:check', () => {
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[updater] manual checkForUpdates failed:', err)
  })
})

// ─── Window ────────────────────────────────────────────────────────────────────

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        960,
    minHeight:       600,
    show:            false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0c0e',
    icon:            join(__dirname, '../../build/icon.ico'),
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

  // Fallback: if ready-to-show never fires (GPU crash / driver issue), show after 10s
  const showFallback = setTimeout(() => {
    if (!mainWindow.isVisible()) mainWindow.show()
  }, 10_000)

  mainWindow.on('ready-to-show', () => {
    clearTimeout(showFallback)
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

  return mainWindow
}

// ─── App lifecycle ─────────────────────────────────────────────────────────────

// Workaround for GPU/driver issues on some Windows machines (blank window / no UI)
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')

app.whenReady().then(() => {
  // Manter estável — alterar o appId quebra a cadeia de atualizações no Windows
  electronApp.setAppUserModelId('com.thronebuilds.obsidian')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  const migrationResult = migrateOldDataDir()
  ensureDataDir()
  const mainWindow = createWindow()
  if (migrationResult) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('migration:done', migrationResult)
    })
  }
  if (!is.dev) setupAutoUpdater(mainWindow)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
