#!/usr/bin/env node
/**
 * Envia notificação de novo release para o Discord via webhook.
 *
 * Uso:
 *   npm run notify -- "Novidade 1" "Novidade 2" "Novidade 3"
 *
 * Ou com tag específica:
 *   npm run notify -- --tag v1.0.0-beta.16 "Novidade 1" "Novidade 2"
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Carrega .env manualmente (sem dependência externa)
function loadEnv() {
  try {
    const env = readFileSync(join(ROOT, '.env'), 'utf8')
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.trim().split('=')
      if (key && rest.length) process.env[key] = rest.join('=').trim()
    }
  } catch { /* .env opcional */ }
}

loadEnv()

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
if (!WEBHOOK_URL) {
  console.error('❌ DISCORD_WEBHOOK_URL não definido no .env')
  process.exit(1)
}

// Lê version do package.json
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const version = pkg.version

// Parseia args: --tag vX.Y.Z e os itens de novidades
const args = process.argv.slice(2)
let tag = `v${version}`
const features = []

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tag' && args[i + 1]) {
    tag = args[++i]
  } else {
    features.push(args[i])
  }
}

const REPO = 'agrmonteiro/throne-liberty-obsidian'
const releaseUrl = `https://github.com/${REPO}/releases/tag/${tag}`
const downloadUrl = `https://github.com/${REPO}/releases/download/${tag}/Tier2-Command-Lab-Setup-${version}.exe`

// Formata lista de novidades
const featureLines = features.length
  ? features.map(f => `> ✦ ${f}`).join('\n')
  : '> ✦ Melhorias gerais e correções de bugs'

const payload = {
  content: '||@everyone||',
  embeds: [
    {
      title: `⚔️  Tier2 Command Lab  •  ${tag}  foi lançado!`,
      description: [
        '### 🎉 Nova versão disponível!',
        '',
        '**O que há de novo:**',
        featureLines,
        '',
        `📥  [**Baixar instalador**](${downloadUrl})`,
        `📋  [Ver release completo no GitHub](${releaseUrl})`,
        '',
        '> 💡 *Quem já tem o app instalado receberá a atualização automática em breve.*',
      ].join('\n'),
      color: 0xd4a843, // dourado Throne & Liberty
      thumbnail: {
        url: 'https://raw.githubusercontent.com/agrmonteiro/throne-liberty-obsidian/master/build/icon.png',
      },
      footer: {
        text: 'Tier2 Command Lab • by AgrMonteiro',
      },
      timestamp: new Date().toISOString(),
    },
  ],
}

const res = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

if (res.ok) {
  console.log(`✅ Notificação enviada para o Discord! (${tag})`)
} else {
  const body = await res.text()
  console.error(`❌ Erro ao enviar: ${res.status} — ${body}`)
  process.exit(1)
}
