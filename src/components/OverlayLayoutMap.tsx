import React, { useMemo, useRef, useState } from 'react'
import type { OverlayConfig, OverlayPanel, PanelAnchor } from '../engine/overlayMeter'

type Props = {
  config: OverlayConfig
  attached: boolean
  gameBounds?: { width: number; height: number } | null
  configure: (patch: Partial<OverlayConfig>) => void
}

const panels: Array<{ id: OverlayPanel; label: string; short: string; width: number; height: number }> = [
  { id: 'total', label: 'Total geral', short: 'Total', width: 340, height: 300 },
  { id: 'skills', label: 'Combate', short: 'Combate', width: 650, height: 340 },
  { id: 'controls', label: 'Ajustes rápidos', short: 'Ajustes', width: 310, height: 568 },
]

const defaults: Record<OverlayPanel, PanelAnchor> = {
  total: { x: .02, y: .08 }, skills: { x: .02, y: .58 }, controls: { x: .99, y: .05 },
}

function anchorFor(config: OverlayConfig, panel: OverlayPanel): PanelAnchor {
  return config.anchors?.[panel] ?? defaults[panel]
}

function anchorName(anchor: PanelAnchor): string {
  const horizontal = anchor.x < .34 ? 'esquerda' : anchor.x > .66 ? 'direita' : 'centro'
  const vertical = anchor.y < .34 ? 'superior' : anchor.y > .66 ? 'inferior' : 'meio'
  return `${vertical} · ${horizontal}`
}

export function OverlayLayoutMap({ config, attached, gameBounds, configure }: Props): React.ReactElement {
  const canvas = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<OverlayPanel>('skills')
  const [dragging, setDragging] = useState<OverlayPanel | null>(null)
  const ratio = gameBounds && gameBounds.width > 0 && gameBounds.height > 0 ? gameBounds.width / gameBounds.height : 16 / 9
  const mapSize = useMemo(() => ({ width: 1000, height: Math.round(1000 / ratio) }), [ratio])
  // No layout atual, total e análise compartilham a janela de combate. O painel Total
  // só aparece aqui quando o usuário opta deliberadamente pelo layout legado separado.
  const layoutPanels = config.singleWindow !== false ? panels.filter(item => item.id !== 'total') : panels
  const selectedPanel = layoutPanels.some(item => item.id === selected) ? selected : 'skills'
  const visible = (panel: OverlayPanel): boolean => panel === 'controls' ? Boolean(config.controlsVisible) : panel === 'total' ? config.totalVisible : config.skillsVisible
  const commit = (panel: OverlayPanel, clientX: number, clientY: number): void => {
    const rect = canvas.current?.getBoundingClientRect()
    if (!rect) return
    const item = panels.find(row => row.id === panel)!
    const previewWidth = Math.min(item.width * (config.scale ?? 1), mapSize.width)
    const previewHeight = Math.min(item.height * (config.scale ?? 1), mapSize.height)
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    // O cursor posiciona a âncora (canto superior esquerdo) e não o centro do painel.
    const next = {
      x: Math.min(1, Math.max(0, (x * mapSize.width) / Math.max(1, mapSize.width - previewWidth))),
      y: Math.min(1, Math.max(0, (y * mapSize.height) / Math.max(1, mapSize.height - previewHeight))),
    }
    configure({ anchors: { [panel]: next } })
  }
  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, panel: OverlayPanel): void => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
    setSelected(panel); setDragging(panel); commit(panel, event.clientX, event.clientY)
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (dragging) commit(dragging, event.clientX, event.clientY)
  }
  const stopDragging = (): void => setDragging(null)
  return <section className="overlay-layout-map" aria-labelledby="overlay-layout-map-title">
    <div className="overlay-layout-map-heading">
      <div><h3 id="overlay-layout-map-title">Mapa de ancoragem</h3><p>Arraste um painel para definir onde ele fica dentro da janela do jogo.</p></div>
      <span className={attached ? 'is-attached' : ''}>{attached ? '● Ancorado ao TL' : '○ Prévia do TL'}</span>
    </div>
    <div className="overlay-layout-panel-tabs" role="tablist" aria-label="Painel para posicionar">
      {layoutPanels.map(item => <button key={item.id} type="button" role="tab" aria-selected={selectedPanel === item.id}
        onClick={() => setSelected(item.id)}>{item.short}{visible(item.id) ? '' : ' · oculto'}</button>)}
    </div>
    <div ref={canvas} className={`overlay-layout-canvas ${dragging ? 'is-dragging' : ''}`} style={{ aspectRatio: `${ratio}` }}
      onPointerMove={onPointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging}>
      <div className="overlay-layout-grid" aria-hidden="true" />
      <div className="overlay-layout-window-label"><span>THRONE AND LIBERTY</span><small>{attached ? `${gameBounds?.width ?? '—'} × ${gameBounds?.height ?? '—'} px` : 'Proporção da janela'}</small></div>
      {layoutPanels.map(item => {
        const anchor = anchorFor(config, item.id)
        const width = Math.min(item.width * (config.scale ?? 1), mapSize.width) / mapSize.width * 100
        const height = Math.min(item.height * (config.scale ?? 1), mapSize.height) / mapSize.height * 100
        const left = anchor.x * (100 - width), top = anchor.y * (100 - height)
        const active = selectedPanel === item.id
        return <button key={item.id} type="button" className={`overlay-layout-card ${active ? 'is-selected' : ''} ${visible(item.id) ? '' : 'is-hidden'}`}
          style={{ width: `${width}%`, height: `${height}%`, left: `${left}%`, top: `${top}%` }}
          aria-label={`${item.label}. Âncora ${anchorName(anchor)}, horizontal ${Math.round(anchor.x * 100)}%, vertical ${Math.round(anchor.y * 100)}%. Arraste para mover.`}
          aria-pressed={active} onClick={() => setSelected(item.id)} onPointerDown={event => onPointerDown(event, item.id)}>
          <span className="overlay-layout-anchor" aria-hidden="true">⌖</span><strong>{item.label}</strong><small>{Math.round(anchor.x * 100)}% · {Math.round(anchor.y * 100)}%</small>
        </button>
      })}
    </div>
    <div className="overlay-layout-map-footer">
      <span><i aria-hidden="true" />Âncora atual: <b>{panels.find(row => row.id === selectedPanel)?.label}</b> · {anchorName(anchorFor(config, selectedPanel))}</span>
      <button type="button" onClick={() => configure({ anchors: { [selectedPanel]: defaults[selectedPanel] } })}>Restaurar posição</button>
    </div>
  </section>
}
