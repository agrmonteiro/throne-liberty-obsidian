import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
async function catalog(language) {
  const cache = path.join(root, `scratch/questlog-skill-icons-${language}.json`)
  if (process.argv.includes('--cached')) return JSON.parse(await fs.readFile(cache, 'utf8'))
  const input = encodeURIComponent(JSON.stringify({ language }))
  const response = await fetch(`https://questlog.gg/throne-and-liberty/api/trpc/skillBuilder.getSkillSets?input=${input}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw Error(`Catálogo ${language}: HTTP ${response.status}`)
  const body = await response.json()
  const data = body.result?.data?.json ?? body.result?.data
  if (!Array.isArray(data)) throw Error('Formato de catálogo desconhecido')
  return data
}
const catalogs = await Promise.all(['en', 'pt'].map(catalog))
const variants = JSON.parse(await fs.readFile(path.join(root, 'src/data/overlaySkillVariants.json'), 'utf8'))
const candidates = new Map()
const byCatalogId = new Map()
function add(skill, specialization = false) {
  if (!skill.name || !skill.icon) return
  byCatalogId.set(skill.id, { id: skill.id, icon: skill.icon, specialization })
  const key = normalize(skill.name)
  const list = candidates.get(key) ?? []
  list.push({ id: skill.id, icon: skill.icon, specialization })
  candidates.set(key, list)
  for (const child of skill.specializations ?? []) add(child, true)
}
for (const skills of catalogs) for (const skill of skills) add(skill)
function resolve(name) {
  let list = candidates.get(normalize(name)) ?? []
  if (list.some(row => !row.specialization)) list = list.filter(row => !row.specialization)
  return new Set(list.map(row => row.icon)).size === 1 ? list[0] : null
}
const source = await fs.readFile(path.join(root, 'src/engine/skillsDB.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { SKILLS_DB } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const aliases = new Map()
for (const [name, info] of Object.entries(SKILLS_DB)) {
  if (!aliases.has(info)) aliases.set(info, [])
  aliases.get(info).push(name)
}
const names = new Set(Object.values(JSON.parse(await fs.readFile(path.join(root, 'src/data/overlaySkillNames.json'), 'utf8'))))
const mappings = {}, metadata = {}, missing = []
for (const name of names) {
  const variant = Object.values(variants).find(row => row.name === name)
  const group = [...aliases.values()].find(rows => rows.some(alias => normalize(alias) === normalize(name))) ?? [name]
  const match = variant ? byCatalogId.get(variant.catalogId) : resolve(name) ?? group.map(resolve).find(Boolean)
  if (!match) { missing.push(name); continue }
  const relative = match.icon.split('/Skill/')[1]?.split('.')[0]
  if (!relative || !/^[\w/-]+$/.test(relative)) throw Error(`Caminho de ícone inválido: ${name}`)
  const file = `${relative.replaceAll('/', '__')}.webp`
  mappings[name] = file
  for (const alias of group) if (!resolve(alias) || resolve(alias).icon === match.icon) mappings[alias] ??= file
  metadata[file] = { skillSet: match.id, source: `https://cdn.questlog.gg/throne-and-liberty/assets/Game/Image/Skill/${relative}.webp` }
}
const destination = path.join(root, 'src/assets/skills')
await fs.mkdir(destination, { recursive: true })
const assets = Object.entries(metadata)
for (let offset = 0; offset < assets.length; offset += 4) {
  await Promise.all(assets.slice(offset, offset + 4).map(async ([file, item]) => {
    const response = await fetch(item.source, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw Error(`${file}: HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > 256 * 1024 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw Error(`Imagem WebP inválida: ${file}`)
    await fs.writeFile(path.join(destination, file), bytes)
    item.bytes = bytes.length
  }))
}
await fs.writeFile(path.join(root, 'src/data/overlaySkillIcons.json'), JSON.stringify(mappings, null, 2) + '\n')
await fs.writeFile(path.join(root, 'docs/overlay-skill-icon-sources.json'), JSON.stringify({ source: 'Questlog public skill catalog',
  createdAt: new Date().toISOString(), mappedNames: [...names].filter(name => mappings[name]), missing, assets: metadata }, null, 2) + '\n')
console.log(JSON.stringify({ mappedNames: [...names].filter(name => mappings[name]).length, totalNames: names.size, icons: assets.length,
  bytes: assets.reduce((sum, [, item]) => sum + item.bytes, 0), missing }))
