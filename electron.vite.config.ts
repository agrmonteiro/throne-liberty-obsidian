import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Lê .env manualmente (sem dependência externa) para embutir no binário
function loadDotEnv(): Record<string, string> {
  const vars: Record<string, string> = {}
  try {
    const content = readFileSync(resolve(__dirname, '.env'), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      vars[key] = val
    }
  } catch { /* .env opcional */ }
  return vars
}

const env = loadDotEnv()

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      // Embutido em build-time; nunca exposto ao renderer
      __DISCORD_WEBHOOK__: JSON.stringify(env['DISCORD_WEBHOOK_URL'] ?? ''),
    },
    build: {
      outDir: 'dist-electron/main',
      rollupOptions: {
        input: resolve(__dirname, 'electron/main/index.ts'),
        output: { entryFileNames: 'index.js' },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
      rollupOptions: {
        input: resolve(__dirname, 'electron/preload/index.ts'),
        output: { entryFileNames: 'index.cjs', format: 'cjs' },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, '.'),
    build: {
      outDir: 'dist-electron/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
      },
    },
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    plugins: [react()],
  },
})
