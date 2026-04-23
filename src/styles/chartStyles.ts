import type { CSSProperties } from 'react'

export const TOOLTIP_CONTENT: CSSProperties = {
  background:   'var(--bg-panel)',
  border:       '1px solid var(--border-gold)',
  borderRadius: 8,
  boxShadow:    '0 4px 24px rgba(0,0,0,0.55), 0 0 12px var(--gold-glow)',
  fontFamily:   'JetBrains Mono, monospace',
  fontSize:     'calc(var(--base-font-size) * 0.79)',
  color:        'var(--text)',
  padding:      '8px 12px',
}

export const TOOLTIP_LABEL: CSSProperties = {
  color:        'var(--gold-l)',
  fontWeight:   600,
  marginBottom: 4,
}

export const TOOLTIP_ITEM: CSSProperties = {
  color: 'var(--text-soft)',
}
