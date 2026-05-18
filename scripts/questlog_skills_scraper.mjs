#!/usr/bin/env node
/**
 * Extrai dados de skills de builds do questlog.gg via API tRPC (sem Playwright).
 *
 * Uso:
 *   node scripts/questlog_skills_scraper.mjs <url>              # todos os builds
 *   node scripts/questlog_skills_scraper.mjs <url> --index 2   # build por índice (0-based)
 *   node scripts/questlog_skills_scraper.mjs <url> --weapons staff/wand  # filtrar por armas
 *
 * Saída: JSON no stdout compatível com o IPC handler do Electron
 *   { url, scrapedAt, builds: [ { buildName, weapons, skills, count } ] }
 *
 * Fluxo:
 *   1. Extrai o character slug da URL
 *   2. GET characterBuilder.getCharacter → obtém user.slug
 *   3. GET skillBuilder.getSkillBuildsBySlug → todos os skill builds do usuário
 *   4. GET skillBuilder.getSkillSets → lookup de nome/ícone por skillId
 *   5. Transforma e emite JSON
 */

const BASE = 'https://questlog.gg/throne-and-liberty/api/trpc'
const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
}

// ── tRPC GET helper ───────────────────────────────────────────────────────────
async function trpc(procedure, input) {
  const qs = input !== undefined
    ? `?input=${encodeURIComponent(JSON.stringify(input))}`
    : ''
  const url = `${BASE}/${procedure}${qs}`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`tRPC ${procedure} → HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`tRPC ${procedure} error: ${JSON.stringify(json.error)}`)
  return json.result.data
}

// ── Extrai o character slug da URL ────────────────────────────────────────────
function extractCharSlug(url) {
  const m = url.match(/character-builder\/([^/?#]+)/)
  if (!m) throw new Error(`Não foi possível extrair o character slug da URL: ${url}`)
  return m[1]
}

// ── Monta o output de um skill build no formato esperado pelo Electron ────────
function formatBuild(build, skillLookup) {
  const mapSkills = (arr) =>
    (arr || []).map(s => {
      const meta = skillLookup[s.skillId] || {}
      return {
        skillId:  s.skillId,
        name:     meta.name || s.skillId,
        equipped: true,
        level:    s.lvl ?? 0,
        order:    s.order ?? 0,
        traits:   s.traits || [],
        imageUrl: meta.icon
          ? `https://cdn.questlog.gg/throne-and-liberty/assets/Game/Image/Skill/${meta.icon.split('/Skill/')[1]?.split('.')[0] || meta.icon}.webp`
          : '',
      }
    })

  const active  = mapSkills(build.active)
  const passive = mapSkills(build.passive)
  const defense = mapSkills(build.defensive)

  return {
    buildName: build.name,
    buildId:   build.id,
    weapons: {
      mainHand: build.mainHand || '',
      offHand:  build.offHand  || '',
    },
    skills: { active, passive, defense },
    count:  { active: active.length, passive: passive.length, defense: defense.length },
    tags:   build.tags || [],
    isPublic: build.isPublic,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(level, ...args) {
  console.error(`[skills-scraper] [${level}]`, ...args)
}

function parseArgs() {
  const args = process.argv.slice(2)
  const url      = args.find(a => a.startsWith('http'))
  const idxArg   = args.indexOf('--index')
  const index    = idxArg !== -1 ? parseInt(args[idxArg + 1]) : null
  const wpnArg   = args.indexOf('--weapons')
  const weapons  = wpnArg !== -1 ? args[wpnArg + 1]?.split('/') : null  // ['staff','wand']
  return { url, index, weapons }
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  const { url, index, weapons } = parseArgs()

  if (!url) {
    console.error('Uso: node questlog_skills_scraper.mjs <url> [--index N] [--weapons staff/wand]')
    process.exit(1)
  }

  if (!/^https:\/\/questlog\.gg\//.test(url)) {
    console.error('URL inválida — apenas https://questlog.gg/ é aceito')
    process.exit(1)
  }

  const charSlug = extractCharSlug(url)
  log('info', `URL: ${url}`)
  log('info', `Character slug: ${charSlug}`)

  // 1. Character → user.slug
  log('info', 'Buscando dados do personagem...')
  const charData = await trpc('characterBuilder.getCharacter', { slug: charSlug })
  const userSlug = charData.character?.user?.slug
  if (!userSlug) throw new Error('user.slug não encontrado na resposta do personagem')
  log('info', `User slug: ${userSlug} (${charData.character?.name})`)

  // 2. Todos os skill builds do usuário
  log('info', 'Buscando skill builds...')
  const buildsData = await trpc('skillBuilder.getSkillBuildsBySlug', { slug: userSlug })
  const allBuilds = buildsData.builds || []
  log('info', `Total de builds: ${allBuilds.length}`)

  // 3. Lookup de skills (nome + ícone)
  log('info', 'Buscando catálogo de skills...')
  const skillSetsData = await trpc('skillBuilder.getSkillSets', { language: 'en' })
  const skillLookup = {}
  for (const skill of (skillSetsData || [])) {
    skillLookup[skill.id] = { name: skill.name, icon: skill.icon }
  }
  log('info', `Skills no catálogo: ${Object.keys(skillLookup).length}`)

  // 4. Seleciona builds a exportar
  let selectedBuilds = allBuilds

  if (weapons) {
    const [main, off] = weapons.map(w => w.toLowerCase())
    selectedBuilds = allBuilds.filter(b =>
      (!main || b.mainHand?.toLowerCase() === main) &&
      (!off  || b.offHand?.toLowerCase()  === off)
    )
    log('info', `Filtrado por weapons ${weapons.join('/')}: ${selectedBuilds.length} builds`)
  }

  if (index != null) {
    if (index >= selectedBuilds.length) {
      throw new Error(`Índice ${index} fora do range (total: ${selectedBuilds.length})`)
    }
    selectedBuilds = [selectedBuilds[index]]
  }

  // 5. Formata e emite
  const builds = selectedBuilds.map(b => {
    const fmt = formatBuild(b, skillLookup)
    log('info', `  ✓ "${fmt.buildName}" | ${fmt.weapons.mainHand}/${fmt.weapons.offHand} | active:${fmt.count.active} passive:${fmt.count.passive} defense:${fmt.count.defense}`)
    return fmt
  })

  console.log(JSON.stringify({ url, scrapedAt: new Date().toISOString(), builds }, null, 2))
  log('info', `Concluído: ${builds.length} build(s) extraído(s).`)
}

main().catch(err => {
  console.error('[skills-scraper] FATAL:', err.message)
  process.exit(1)
})
