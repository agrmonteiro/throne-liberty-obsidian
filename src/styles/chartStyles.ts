import type { CSSProperties } from 'react'

/**
 * Chart styling tokens — escalam automaticamente via tiers
 * (res-fhd / res-qhd / res-qhd-plus / res-4k) aplicados em <html>.
 *
 * Recharts aceita strings CSS em contentStyle/labelStyle/itemStyle — então
 * usar `var(--fs-chart-*)` já funciona para todos os tooltips do app.
 */

export const TOOLTIP_CONTENT: CSSProperties = {
  background:   'var(--bg-panel)',
  border:       '1px solid var(--border-gold)',
  borderRadius: 8,
  boxShadow:    '0 4px 24px rgba(0,0,0,0.55), 0 0 12px var(--gold-glow)',
  fontFamily:   'JetBrains Mono, monospace',
  fontSize:     'var(--fs-chart-body)',
  color:        'var(--text)',
  padding:      '10px 14px',
}

export const TOOLTIP_LABEL: CSSProperties = {
  color:        'var(--gold-l)',
  fontWeight:   600,
  fontSize:     'var(--fs-chart-title)',
  marginBottom: 4,
}

export const TOOLTIP_ITEM: CSSProperties = {
  color:    'var(--text-soft)',
  fontSize: 'var(--fs-chart-body)',
}

/**
 * Tick / label / legend helpers
 * Recharts aceita fontSize como string nas props `tick` e `label`,
 * portanto `var()` funciona uniformemente.
 */
export const AXIS_TICK = {
  fontSize:   'var(--fs-chart-tick)',
  fontFamily: 'JetBrains Mono, monospace',
  fill:       '#7a8099',
}

export const AXIS_TICK_EMPHASIS = {
  ...AXIS_TICK,
  fill: '#e2e4ec',
}

export const BAR_LABEL = {
  fontSize:   'var(--fs-chart-label)',
  fontFamily: 'JetBrains Mono, monospace',
  fill:       '#a8b5d4',
}

export const LEGEND_STYLE: CSSProperties = {
  fontSize:   'var(--fs-chart-label)',
  fontFamily: 'Inter, system-ui, sans-serif',
  color:      'var(--text)',
}
