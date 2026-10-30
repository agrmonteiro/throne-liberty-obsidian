import type { CSSProperties } from 'react'
import type { OverlayConfig } from '../engine/overlayMeter'
import { overlayBackground, overlayTheme } from '../engine/overlayLayout'

export function overlayAppearance(config: OverlayConfig): CSSProperties {
  const theme = overlayTheme(config)
  return { fontFamily: `${config.fontFamily ?? 'Inter'}, Arial, sans-serif`,
    '--meter-chart-padding': `${Number.isFinite(config.chartPadding) ? Math.max(0, Math.min(32, config.chartPadding!)) : 12}px`,
    '--meter-chart-padding-vertical': `${Number.isFinite(config.chartPaddingVertical) ? Math.max(0, Math.min(32, config.chartPaddingVertical!)) : 10}px`,
    '--meter-text': theme.text, '--meter-accent': theme.accent,
    '--meter-muted': `color-mix(in srgb, ${theme.text} 68%, transparent)`,
    '--meter-background': overlayBackground(theme.background, config.opacity),
    '--meter-normal': theme.normal, '--meter-critical': theme.critical,
    '--meter-heavy': theme.heavy, '--meter-criticalHeavy': theme.criticalHeavy } as CSSProperties
}
