import type { DamageBreakdown, MeterSession, OverlayConfig, OverlayEncounter } from './overlayMeter'

export type MetricPage = NonNullable<OverlayConfig['metricPage']>
export type MeterSort = 'name' | 'damage' | 'hits' | 'average'
export interface AnalysisRow {
  key: string; name: string; damage: number; hits: number
  skillIds?: number[]; iconFile?: string; damageByKind?: DamageBreakdown
  critical?: number; heavy?: number
}
export interface MetricData {
  rows: AnalysisRow[]; total: number; hits: number; available: boolean; healing: boolean
  rateLabel: string
}
export const normalizeSearch = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
/** A mesma duração da sessão/cronômetro é usada para todas as habilidades. */
export const metricRate = (amount: number, seconds: number): number => Number.isFinite(seconds) && seconds >= 1 ? amount / seconds : 0
export const hitAverage = (row: AnalysisRow): number => row.hits > 0 ? row.damage / row.hits : 0

export function metricData(session: MeterSession, page: MetricPage): MetricData {
  const healing = page === 'healingDone' || page === 'healingReceived'
  if (page === 'damage') return { rows: session.skills, total: session.total, hits: session.hits, available: true, healing, rateLabel: 'DPS' }
  if (healing) {
    const data = page === 'healingDone' ? session.healing?.done : session.healing?.received
    return { rows: data?.skills ?? [], total: data?.total ?? 0, hits: data?.hits ?? 0, available: Boolean(data), healing, rateLabel: 'HPS bruto' }
  }
  const data = session.received
  return { rows: page === 'receivedSources' ? data?.sources.map(row => ({
    key: String(row.id), name: row.name ?? `Origem ${row.id}`, damage: row.damage, hits: row.hits,
  })) ?? [] : data?.skills ?? [], total: data?.total ?? 0, hits: data?.hits ?? 0,
  available: Boolean(data), healing, rateLabel: 'Dano/s' }
}

export function analyzeRows(rows: AnalysisRow[], query: string, sort: MeterSort, ascending: boolean): AnalysisRow[] {
  const text = normalizeSearch(query)
  return rows.filter(row => !text || normalizeSearch(`${row.name} ${row.key} ${row.skillIds?.join(' ') ?? ''}`).includes(text))
    .sort((a, b) => {
      const difference = sort === 'name' ? a.name.localeCompare(b.name, 'pt-BR')
        : sort === 'average' ? hitAverage(a) - hitAverage(b) : a[sort] - b[sort]
      return (ascending ? difference : -difference) || a.key.localeCompare(b.key)
    })
}

export function comparableEncounters(a: OverlayEncounter, b: OverlayEncounter): boolean {
  if (a.id === b.id || a.attributionVersion !== 2 || b.attributionVersion !== 2 || a.mode !== b.mode) return false
  if (a.sourceName && b.sourceName) return a.sourceName.trim().toLocaleLowerCase('pt-BR') === b.sourceName.trim().toLocaleLowerCase('pt-BR')
  return Boolean(a.captureId && a.captureId === b.captureId && a.connectionId && a.connectionId === b.connectionId
    && a.sourceId !== null && a.sourceId === b.sourceId)
}

export interface MetricComparisonRow {
  key: string; name: string; iconFile?: string; current: number; reference: number; delta: number; percent: number | null
}
export function compareMetrics(current: MeterSession, reference: MeterSession, page: MetricPage,
  basis: 'total' | 'rate'): MetricComparisonRow[] {
  const left = metricData(current, page), right = metricData(reference, page)
  if (!left.available || !right.available) return []
  const used = new Set<string>()
  const value = (row: AnalysisRow, session: MeterSession): number => basis === 'rate' ? metricRate(row.damage, session.elapsedSec) : row.damage
  const pairs = left.rows.map(row => {
    const exact = right.rows.find(candidate => candidate.key === row.key)
    const byId = right.rows.filter(candidate => row.skillIds?.some(id => candidate.skillIds?.includes(id)))
    const match = exact ?? (byId.length === 1 ? byId[0] : undefined)
    // Nunca reutilizar a mesma parcela da referência para duas variantes.
    const other = match && !used.has(match.key) ? match : undefined
    if (other) used.add(other.key)
    return { row, other }
  })
  return [...pairs.map(({ row, other }) => ({ key: `current:${row.key}`, name: row.name, iconFile: row.iconFile,
    current: value(row, current), reference: other ? value(other, reference) : 0 })),
  ...right.rows.filter(row => !used.has(row.key)).map(row => ({ key: `reference:${row.key}`, name: row.name, iconFile: row.iconFile,
    current: 0, reference: value(row, reference) }))]
    .map(row => ({ ...row, delta: row.current - row.reference,
      percent: row.reference > 0 ? (row.current / row.reference - 1) * 100 : null }))
    .sort((a, b) => Math.max(b.current, b.reference) - Math.max(a.current, a.reference) || a.key.localeCompare(b.key))
}

const csvCell = (value: string | number): string => {
  const text = typeof value === 'string' && /^(?:\s*[=+@\-]|[\t\r\n])/.test(value) ? `'${value}` : String(value)
  return `"${text.replace(/"/g, '""')}"`
}
export function metricCsv(session: MeterSession, page: MetricPage): string {
  const data = metricData(session, page)
  const headings = ['Página', 'Nome', 'IDs', 'Total', 'Participação (%)', data.rateLabel, 'Acertos/aplicações', 'Média por acerto/aplicação', 'Duração (s)', 'Cobertura']
  return '\uFEFF' + [headings, ...data.rows.map(row => [page, row.name, row.skillIds?.join(', ') ?? row.key, row.damage,
    data.total > 0 ? row.damage / data.total * 100 : 0, metricRate(row.damage, session.elapsedSec), row.hits, hitAverage(row), session.elapsedSec,
    data.healing ? 'Autocura bruta experimental; cobertura parcial' : 'Eventos capturados'])]
    .map(row => row.map(csvCell).join(';')).join('\r\n')
}
