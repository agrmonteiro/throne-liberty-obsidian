import { useSyncExternalStore } from 'react'
import type { MetricPage } from '../engine/overlayAnalysis'
import type { OverlayConfig } from '../engine/overlayMeter'

export type OverlayGraphPage = MetricPage | 'deaths' | 'buffs'
const storageKey = 'throne.overlay.graph-view.v1'
const changeEvent = 'overlay-graph-view-change'
let fallback = 'meter'
function snapshot(): string {
  try { return window.localStorage.getItem(storageKey) ?? fallback } catch { return fallback }
}
function subscribe(notify: () => void): () => void {
  const changed = (event: StorageEvent): void => { if (event.key === storageKey || event.key === null) notify() }
  window.addEventListener('storage', changed)
  window.addEventListener(changeEvent, notify)
  return () => { window.removeEventListener('storage', changed); window.removeEventListener(changeEvent, notify) }
}
/** Navegação compartilhada entre gráfico e ajustes, sem alterar os dados da medição. */
export function useOverlayGraphPage(metricPage: MetricPage | undefined, configure: (patch: Partial<OverlayConfig>) => void): {
  page: OverlayGraphPage; selectPage: (page: OverlayGraphPage) => void
} {
  const view = useSyncExternalStore(subscribe, snapshot)
  return { page: view === 'deaths' || view === 'buffs' ? view : metricPage ?? 'damage', selectPage: page => {
    fallback = page === 'deaths' || page === 'buffs' ? page : 'meter'
    try { window.localStorage.setItem(storageKey, fallback) } catch { /* a navegação desta janela continua disponível */ }
    window.dispatchEvent(new Event(changeEvent))
    if (page !== 'deaths' && page !== 'buffs') configure({ metricPage: page })
  } }
}
