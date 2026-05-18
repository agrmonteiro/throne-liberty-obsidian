/**
 * useAutoScale — aplica um tier de escala (res-fhd/qhd/qhd-plus/4k) em <html>
 * baseado em window.innerWidth * devicePixelRatio (resolução física real).
 *
 * Aplica TUDO inline (--base-font-size, --ui-scale, --fs-chart-*) para garantir
 * precedência absoluta, além de adicionar a classe .res-* para estilos auxiliares.
 *
 * Respeita override manual do usuário:
 *   uiScale = 'auto' → detecta automaticamente
 *   uiScale = 'fhd' | 'qhd' | 'qhd+' | '4k' → força um tier específico
 *   fontSize (slider) → sobrepõe --base-font-size se diferente de 14
 */

import { useEffect } from 'react'
import { useSettings } from '../store/useSettings'

export type UiScaleTier = 'fhd' | 'qhd' | 'qhd+' | '4k'
export type UiScalePref = 'auto' | UiScaleTier

const CLASSES: Record<UiScaleTier, string> = {
  'fhd':    'res-fhd',
  'qhd':    'res-qhd',
  'qhd+':   'res-qhd-plus',
  '4k':     'res-4k',
}
const ALL_CLASSES = Object.values(CLASSES)

interface TierValues {
  fontSize:   string
  uiScale:    string
  chartTick:  string
  chartLabel: string
  chartBody:  string
  chartTitle: string
}

const TIER_VALUES: Record<UiScaleTier, TierValues> = {
  'fhd':  { fontSize: '14px',   uiScale: '1',    chartTick: '0.72rem', chartLabel: '0.70rem', chartBody: '0.78rem', chartTitle: '0.82rem' },
  'qhd':  { fontSize: '15px',   uiScale: '1.08', chartTick: '0.75rem', chartLabel: '0.74rem', chartBody: '0.82rem', chartTitle: '0.85rem' },
  'qhd+': { fontSize: '16px',   uiScale: '1.15', chartTick: '0.78rem', chartLabel: '0.76rem', chartBody: '0.85rem', chartTitle: '0.88rem' },
  '4k':   { fontSize: '19px',   uiScale: '1.40', chartTick: '0.82rem', chartLabel: '0.80rem', chartBody: '0.90rem', chartTitle: '0.94rem' },
}

/**
 * Detecta o tier com base na resolução física (width × DPR).
 * Limites escolhidos para cobrir os intervalos mais comuns:
 *   < 2240 → fhd
 *   2240–2559 → qhd
 *   2560–3199 → qhd+
 *   ≥ 3200 → 4k
 */
export function detectTier(): UiScaleTier {
  if (typeof window === 'undefined') return 'fhd'
  const physicalWidth = window.innerWidth * (window.devicePixelRatio || 1)
  if (physicalWidth >= 3200) return '4k'
  if (physicalWidth >= 2560) return 'qhd+'
  if (physicalWidth >= 2240) return 'qhd'
  return 'fhd'
}

function applyTier(tier: UiScaleTier, fontSizeOverride?: number): void {
  const html = document.documentElement
  const v = TIER_VALUES[tier]

  // Classe auxiliar (para qualquer CSS que queira reagir a tier específico)
  ALL_CLASSES.forEach(c => html.classList.remove(c))
  html.classList.add(CLASSES[tier])

  // Seta inline — precedência máxima, à prova de cascade
  html.style.setProperty('--base-font-size', fontSizeOverride ? `${fontSizeOverride}px` : v.fontSize)
  html.style.setProperty('--ui-scale',       v.uiScale)
  html.style.setProperty('--fs-chart-tick',  v.chartTick)
  html.style.setProperty('--fs-chart-label', v.chartLabel)
  html.style.setProperty('--fs-chart-body',  v.chartBody)
  html.style.setProperty('--fs-chart-title', v.chartTitle)
}

export function useAutoScale(): void {
  const uiScale  = useSettings(s => s.uiScale)
  const fontSize = useSettings(s => s.fontSize)

  useEffect(() => {
    const resolve = (): UiScaleTier => (uiScale === 'auto' ? detectTier() : uiScale)
    const override = fontSize !== 14 ? fontSize : undefined

    applyTier(resolve(), override)

    if (uiScale !== 'auto') return
    const onResize = (): void => applyTier(resolve(), override)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [uiScale, fontSize])
}
