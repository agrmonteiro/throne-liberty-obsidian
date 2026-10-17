import { desktopCapturer, nativeImage, screen } from 'electron'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createWorker } from 'tesseract.js'

type WindowBounds = { left: number; top: number; right: number; bottom: number; pid: number; process: string }
export type GameCapture = { sourceId: string; title: string; imageDataUrl: string; imagePath: string; width: number; height: number; bounds: WindowBounds; imageBounds: { left: number; top: number; right: number; bottom: number } }

const WINDOWS_API = String.raw`
Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
public static class TLWindow {
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
'@
[void][TLWindow]::SetProcessDPIAware()
`

function windowHandle(sourceId: string): number {
  const match = /^window:(\d+):\d+$/.exec(sourceId)
  if (!match) throw new Error('Janela inválida.')
  const handle = Number(match[1])
  if (!Number.isSafeInteger(handle) || handle <= 0) throw new Error('Identificador de janela inválido.')
  return handle
}

function powershell(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64')
    const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { windowsHide: true })
    let stdout = ''
    let stderr = ''
    const timeout = setTimeout(() => proc.kill(), 10000)
    proc.stdout.on('data', chunk => { stdout += chunk.toString(); if (stdout.length > 20000) proc.kill() })
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); if (stderr.length > 20000) proc.kill() })
    proc.on('error', reject)
    proc.on('close', code => {
      clearTimeout(timeout)
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(stderr.trim() || stdout.trim() || 'Não foi possível acessar a janela do jogo.'))
    })
  })
}

async function inspectWindow(sourceId: string): Promise<WindowBounds> {
  if (process.platform !== 'win32') throw new Error('Captura do jogo disponível apenas no Windows.')
  const handle = windowHandle(sourceId)
  const raw = await powershell(`${WINDOWS_API}
$h = [IntPtr]::new([long]${handle})
$r = New-Object TLWindow+Rect
if (-not [TLWindow]::GetWindowRect($h, [ref]$r)) { throw 'Janela não encontrada' }
[uint32]$pidValue = 0
[void][TLWindow]::GetWindowThreadProcessId($h, [ref]$pidValue)
$p = Get-Process -Id $pidValue -ErrorAction Stop
if ($p.ProcessName -ne 'TL' -or $r.Right -le $r.Left -or $r.Bottom -le $r.Top) { throw 'A janela não é o jogo TL' }
@{left=$r.Left;top=$r.Top;right=$r.Right;bottom=$r.Bottom;pid=$pidValue;process=$p.ProcessName} | ConvertTo-Json -Compress`)
  const bounds = JSON.parse(raw) as WindowBounds
  if (bounds.process !== 'TL') throw new Error('A janela selecionada não é do jogo.')
  return bounds
}

export async function listGameWindows(): Promise<Array<{ sourceId: string; title: string }>> {
  const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 320, height: 180 } })
  const game = sources.filter(source => /Throne and Liberty/i.test(source.name))
  const valid: Array<{ sourceId: string; title: string }> = []
  for (const source of game) {
    try { await inspectWindow(source.id); valid.push({ sourceId: source.id, title: source.name }) } catch { /* ignore unrelated windows */ }
  }
  return valid
}

export async function focusGameWindow(sourceId: string): Promise<void> {
  await inspectWindow(sourceId)
  const handle = windowHandle(sourceId)
  await powershell(`${WINDOWS_API}
$h = [IntPtr]::new([long]${handle})
if (-not [TLWindow]::SetForegroundWindow($h)) { throw 'Não foi possível ativar a janela do jogo' }`)
}

export async function captureGameWindow(sourceId: string, dataDir: string): Promise<GameCapture> {
  const bounds = await inspectWindow(sourceId)
  const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 1920, height: 1080 } })
  const source = sources.find(item => item.id === sourceId)
  if (!source) throw new Error('Não foi possível capturar a janela do jogo.')
  const display = screen.getDisplayMatching({ x: bounds.left, y: bounds.top, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top })
  const screenSources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: display.size.width, height: display.size.height } })
  const screenSource = screenSources.find(item => item.display_id === String(display.id))
  if (!screenSource || screenSource.thumbnail.isEmpty()) throw new Error('Captura da tela indisponível; deixe o jogo visível.')
  const displayRect = display.bounds
  const left = Math.max(bounds.left, displayRect.x)
  const top = Math.max(bounds.top, displayRect.y)
  const right = Math.min(bounds.right, displayRect.x + displayRect.width)
  const bottom = Math.min(bounds.bottom, displayRect.y + displayRect.height)
  if (right - left < 500 || bottom - top < 300) throw new Error('A janela do jogo está fora da tela.')
  const size = screenSource.thumbnail.getSize()
  const scaleX = size.width / displayRect.width
  const scaleY = size.height / displayRect.height
  const crop = {
    x: Math.round((left - displayRect.x) * scaleX), y: Math.round((top - displayRect.y) * scaleY),
    width: Math.floor((right - left) * scaleX), height: Math.floor((bottom - top) * scaleY),
  }
  const png = screenSource.thumbnail.crop(crop).toPNG()
  const image = nativeImage.createFromBuffer(png)
  const { width, height } = image.getSize()
  if (width < 500 || height < 300) throw new Error('Captura pequena ou vazia; coloque o jogo em janela ou sem bordas.')
  const bitmap = image.toBitmap()
  let visibleSamples = 0
  for (let row = 1; row <= 9; row++) for (let col = 1; col <= 9; col++) {
    const x = Math.floor(width * col / 10)
    const y = Math.floor(height * row / 10)
    const offset = (y * width + x) * 4
    if (Math.max(bitmap[offset], bitmap[offset + 1], bitmap[offset + 2]) > 22) visibleSamples++
  }
  if (visibleSamples < 5) throw new Error('A captura está preta; deixe o jogo visível em janela ou sem bordas e tente novamente.')
  const dir = path.join(dataDir, 'combat-lab-captures')
  fs.mkdirSync(dir, { recursive: true })
  const imagePath = path.join(dir, `TL_${Date.now()}.png`)
  fs.writeFileSync(imagePath, png)
  return { sourceId, title: source.name, imageDataUrl: `data:image/png;base64,${png.toString('base64')}`, imagePath, width, height, bounds, imageBounds: { left, top, right, bottom } }
}

export async function recognizeGameCapture(imagePath: string, dataDir: string, area?: { x: number; y: number; width: number; height: number }): Promise<{ text: string; confidence: number }> {
  const dir = path.join(dataDir, 'combat-lab-captures')
  if (path.dirname(path.resolve(imagePath)) !== path.resolve(dir)) throw new Error('Print fora da pasta de capturas.')
  if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size > 20 * 1024 * 1024) throw new Error('Print indisponível ou muito grande.')
  let input: string | Buffer = imagePath
  if (area) {
    if (![area.x, area.y, area.width, area.height].every(Number.isFinite) || area.x < 0 || area.y < 0 || area.width < 0.02 || area.height < 0.02 || area.x + area.width > 1 || area.y + area.height > 1) throw new Error('Área OCR inválida.')
    const image = nativeImage.createFromPath(imagePath)
    const size = image.getSize()
    input = image.crop({ x: Math.floor(area.x * size.width), y: Math.floor(area.y * size.height), width: Math.max(1, Math.floor(area.width * size.width)), height: Math.max(1, Math.floor(area.height * size.height)) }).toPNG()
  }
  const worker = await createWorker('por+eng', 1, { cachePath: path.join(dataDir, 'ocr-cache') })
  try {
    const { data } = await worker.recognize(input)
    return { text: data.text.trim(), confidence: data.confidence }
  } finally { await worker.terminate() }
}
