import { _electron as electron } from 'playwright'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-lab-qa-'))
const videoPath = process.argv[2]
const app = await electron.launch({ args: ['.', `--user-data-dir=${userData}`], cwd: process.cwd(), timeout: 30000 })
try {
  const page = await app.firstWindow()
  await page.getByText('Laboratório de combate', { exact: true }).first().click()
  await page.getByRole('heading', { name: 'Laboratório de combate' }).waitFor()
  await page.getByRole('button', { name: 'Criar catálogo desta build' }).click()
  await page.getByText('Golpe Sombrio', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Buscar prioridades para 120 s' }).click()
  await page.getByText(/Revise ao menos uma skill/).waitFor()
  let videoFrames = 0
  if (videoPath) {
    await app.evaluate(({ dialog }, picked) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [picked] })
    }, videoPath)
    await page.getByRole('button', { name: 'Abrir vídeo da build' }).click()
    await page.locator('video').waitFor()
    await page.waitForFunction(() => Number.isFinite(document.querySelector('video')?.duration))
    await page.getByRole('button', { name: 'Extrair quadros' }).click()
    await page.getByText(/quadros amostrados/).waitFor({ timeout: 120000 })
    videoFrames = await page.getByRole('img', { name: /^Quadro / }).count()
    assert.ok(videoFrames > 1)
    await page.getByRole('button', { name: /0.3 s/ }).first().click()
    await page.getByRole('button', { name: 'Usar quadro atual' }).click()
    await page.getByText(/Quadro de .* salvo/).waitFor()
    const frameImage = page.getByAltText('Captura da janela do jogo')
    const box = await frameImage.boundingBox()
    assert.ok(box)
    await frameImage.click({ position: { x: box.width * 0.78, y: box.height * 0.1 } })
    await frameImage.click({ position: { x: box.width * 0.98, y: box.height * 0.8 } })
    await page.getByRole('button', { name: 'Ler OCR' }).click()
    await page.getByText('OCR concluído.', { exact: false }).waitFor({ timeout: 120000 })
  }
  await page.getByRole('button', { name: 'Detectar janela' }).click()
  await page.getByText(/Janela do jogo localizada|Jogo não encontrado/).waitFor()
  const gameFound = await page.getByText('Janela do jogo localizada.', { exact: false }).count() > 0
  if (gameFound) {
    await page.getByRole('button', { name: 'Capturar print' }).click()
    await page.getByAltText('Captura da janela do jogo').waitFor({ timeout: 15000 })
    const source = await page.getByAltText('Captura da janela do jogo').getAttribute('src')
    assert.ok(source?.startsWith('data:image/png;base64,'))
  }
  const screenshotPath = path.join(userData, 'combat-lab-qa.png')
  await page.screenshot({ path: screenshotPath, timeout: 60000 })
  console.log(JSON.stringify({ gameFound, videoFrames, screenshotPath, title: await page.title() }))
} finally {
  await app.close()
}
