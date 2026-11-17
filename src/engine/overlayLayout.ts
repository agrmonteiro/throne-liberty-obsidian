import type { OverlayConfig, OverlayPanel, OverlayTheme, PanelAnchor, PanelBounds } from './overlayMeter'

export const defaultOverlayTheme: OverlayTheme = {
  background: '#0d0f13', text: '#eee9dd', accent: '#ead08d',
  normal: '#8c9cac', critical: '#e2bd65', heavy: '#67bdc3', criticalHeavy: '#c38bd8',
}
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))
/** Visibilidade por dano local observado; não é uma flag nativa de combate do jogo. */
export function overlayCombatVisible(config: Pick<OverlayConfig, 'hideOutOfCombat' | 'combatHideDelaySec' | 'reviewEncounterId'>,
  lastDamageAt: number | null, now: number, context: { replay?: boolean; timed?: boolean; editing?: boolean } = {}): boolean {
  if (!config.hideOutOfCombat || config.reviewEncounterId || context.replay || context.timed || context.editing) return true
  const delay = Number.isFinite(config.combatHideDelaySec) ? clamp(config.combatHideDelaySec!, 3, 60) : 10
  return lastDamageAt !== null && Number.isFinite(lastDamageAt) && now - lastDamageAt < delay * 1000
}
export function overlayHasFocus(foreground: { foreground?: string; foregroundOwner?: string; foregroundAncestors?: string[] },
  windows: Array<{ handle: string; focused: boolean; requested: boolean }>): boolean {
  const handles = new Set([foreground.foreground, foreground.foregroundOwner,
    ...(Array.isArray(foreground.foregroundAncestors) ? foreground.foregroundAncestors.slice(0, 24) : [])])
  // Não depender de isVisible: um snapshot transitório não pode tornar a ocultação irreversível.
  return windows.some(window => window.requested && (window.focused || handles.has(window.handle)))
}
export function overlaySceneActive(foreground: Parameters<typeof overlayHasFocus>[0] & { active: boolean }, ownerFocused: boolean,
  windows: Parameters<typeof overlayHasFocus>[1]): boolean {
  // O foco interno do Electron pode atrasar ao voltar ao jogo por uma janela de outro processo.
  return foreground.active || (!ownerFocused && overlayHasFocus(foreground, windows))
}
export function overlayAnchor(bounds: PanelBounds, area: PanelBounds): PanelAnchor {
  return { x: clamp((bounds.x - area.x) / Math.max(1, area.width - bounds.width), 0, 1),
    y: clamp((bounds.y - area.y) / Math.max(1, area.height - bounds.height), 0, 1) }
}
export function overlayBounds(panel: OverlayPanel, config: OverlayConfig, area: PanelBounds): PanelBounds {
  const saved = config[`${panel}Bounds`]
  const scale = config.scale
  const minimized = panel === 'total' ? Boolean(config.totalMinimized)
    : panel === 'skills' ? Boolean(config.skillsMinimized) : false
  const defaults = panel === 'controls' ? { width: 310, height: config.controlsExpanded === false ? 48 : 568 }
    : panel === 'total' ? { width: 320, height: 270 } : { width: 560, height: 310 }
  const fontScale = (config.fontSize ?? 13) / 13
  const minimum = panel === 'controls' ? defaults : minimized
    ? { width: 280 * scale, height: (panel === 'skills' ? 136 : 96) * scale }
    : panel === 'total'
    ? { width: 280 * scale, height: 32 + 260 * scale * fontScale } : { width: 480 * scale, height: 32 + 240 * scale }
  // Em telas menores, um tamanho salvo de um monitor grande não pode ocupar a cena.
  // O teto é deliberadamente proporcional; em monitores grandes a preferência do usuário
  // continua intacta, enquanto 720p preserva espaço para a interface do jogo.
  const cap = panel === 'skills' ? { width: Math.round(area.width * .5), height: Math.round(area.height * .48) }
    : panel === 'total' ? { width: Math.round(area.width * .36), height: Math.round(area.height * .42) }
      : { width: area.width, height: area.height }
  const maximum = panel === 'controls' ? area : { width: Math.min(area.width, Math.max(minimum.width, cap.width)), height: Math.min(area.height, Math.max(minimum.height, cap.height)) }
  const width = Math.round(clamp(panel === 'controls' ? defaults.width : saved?.width ?? defaults.width, Math.min(minimum.width, area.width), maximum.width))
  const requestedHeight = panel === 'controls' ? defaults.height : minimized ? minimum.height : saved?.height ?? defaults.height
  const height = Math.round(clamp(requestedHeight, Math.min(minimum.height, area.height), maximum.height))
  const fallback = panel === 'controls' ? { x: .99, y: .05 } : panel === 'total' ? { x: .02, y: .08 } : { x: .02, y: .58 }
  // Migra posições absolutas antigas somente quando a janela do jogo é conhecida.
  const anchor = config.anchors?.[panel] ?? (saved ? overlayAnchor({ ...saved, width, height }, area) : fallback)
  return { x: Math.round(area.x + clamp(anchor.x, 0, 1) * (area.width - width)),
    y: Math.round(area.y + clamp(anchor.y, 0, 1) * (area.height - height)), width, height }
}
export function overlayTheme(config: OverlayConfig): OverlayTheme {
  return { ...defaultOverlayTheme, ...config.theme }
}
export function overlayBackground(color: string, opacity: number): string {
  return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`
}
