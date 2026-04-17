import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
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
