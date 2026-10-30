import React, { useState } from 'react'
import { useOverlay } from '../hooks/useOverlay'
import { defaultOverlayTheme, overlayTheme } from '../engine/overlayLayout'
import type { OverlayConfig, OverlayPanel, OverlayTheme } from '../engine/overlayMeter'
import { overlaySourceWarning } from '../engine/overlayMeter'
import { metricPages, type MetricPage } from '../components/OverlayMetricView'
import { OverlayTimer } from '../components/OverlayTimer'
import { OverlayDragLabel } from '../components/OverlayDragLabel'
import { OverlayCombatSettings } from '../components/OverlayCombatSettings'
import '../styles/overlay.css'

const palette: Array<{ key: keyof OverlayTheme; label: string }> = [
  { key: 'background', label: 'Fundo' }, { key: 'text', label: 'Texto' }, { key: 'accent', label: 'Destaque' },
  { key: 'normal', label: 'Normal' }, { key: 'critical', label: 'Crítico' },
  { key: 'heavy', label: 'Pesado' }, { key: 'criticalHeavy', label: 'Crítico pesado' },
]
const positions = [
  ['↖', 'Superior esquerda', 0, 0], ['↑', 'Superior centro', .5, 0], ['↗', 'Superior direita', 1, 0],
  ['←', 'Centro esquerda', 0, .5], ['·', 'Centro', .5, .5], ['→', 'Centro direita', 1, .5],
  ['↙', 'Inferior esquerda', 0, 1], ['↓', 'Inferior centro', .5, 1], ['↘', 'Inferior direita', 1, 1],
] as const

export function OverlayControls(): React.ReactElement {
  const { state, act } = useOverlay()
  const { config } = state
  const [panel, setPanel] = useState<OverlayPanel>('total')
  const theme = overlayTheme(config)
  const expanded = config.controlsExpanded !== false
  const anchor = config.anchors?.[panel] ?? { x: 0, y: 0 }
  const busy = ['starting', 'live', 'replay'].includes(state.status)
  const warning = overlaySourceWarning(state)
  const player = state.capture?.player
  const configure = (patch: Partial<OverlayConfig>): void => act(() => window.overlayAPI.configure(patch))
  const move = (x: number, y: number): void => configure({ anchors: { [panel]: { x, y } } })
  return <aside className={`overlay-controls ${expanded ? 'expanded' : ''}`} aria-label="Configuração dos overlays">
    <header className="overlay-controls-header overlay-titlebar meter-drag" aria-label="Barra de título para mover a configuração">
      <OverlayDragLabel label="Overlays" />
      <button aria-label={state.session.paused ? 'Retomar medição' : 'Pausar medição'}
        aria-pressed={Boolean(state.session.paused)} disabled={!['live', 'replay'].includes(state.status) || Boolean(state.timer)}
        title="Pausa todos os painéis e o tempo da medição"
        onClick={() => act(() => window.overlayAPI.pause(!state.session.paused))}>{state.session.paused ? '▶' : 'Ⅱ'}</button>
      <button className="overlay-capture-toggle" aria-label={busy ? 'Parar leitura' : 'Iniciar leitura'}
        title={busy ? 'Parar leitura' : 'Iniciar leitura'} onClick={() => act(() => busy ? window.overlayAPI.stop() : window.overlayAPI.start())}>
        {busy ? '■' : '▶'}</button>
      <button className="overlay-controls-expand" aria-label={expanded ? 'Recolher ajustes' : 'Abrir ajustes'}
        aria-expanded={expanded} onClick={() => configure({ controlsExpanded: !expanded })}>
        {expanded ? 'Recolher ▴' : 'Ajustes ▾'}</button>
      <button aria-label="Ocultar configuração" title="Ocultar · Ctrl+Shift+F11" onClick={() => configure({ controlsVisible: false })}>×</button>
    </header>
    {expanded && <div className="overlay-controls-body">
      <div className="overlay-controls-status" role="status" data-status={state.status} title={state.message}>
        {state.status === 'error' ? state.message : state.session.paused && busy ? 'Medição pausada · tempo e valores congelados' : config.reviewEncounterId ? 'Exibindo histórico · captura continua' : warning ?? (state.status === 'live' ? 'Leitura ao vivo' : state.status === 'starting' ? 'Conectando…' : 'Leitura parada')}
      </div>
      <section className="overlay-control-session" aria-label="Sessão e personagem">
        <label>Nome do personagem<input key={config.playerName ?? ''} aria-label="Nome do personagem" defaultValue={config.playerName ?? ''} maxLength={64}
          placeholder="Nome exato no jogo" onBlur={event => configure({ playerName: event.target.value })} /></label>
        <label>Origem do medidor<select aria-label="Origem do medidor" value={config.autoSource !== false ? 'auto' : config.sourceId ?? ''}
          onChange={event => configure({ sourceId: event.target.value === 'auto' ? null : Number(event.target.value) })}>
          <option value="auto">Meu personagem{player ? ` · ${player.sourceId}` : ' · aguardando identificação'}</option>
          {config.autoSource === false && config.sourceId === null && <option value="" disabled>Selecione uma origem</option>}
          {config.sourceId !== null && !state.sources.some(row => row.id === config.sourceId) && <option value={config.sourceId}>Origem {config.sourceId}</option>}
          {state.sources.map(row => <option key={row.id} value={row.id}>{row.localPlayer ? 'Entidade local (manual)' : row.name ?? 'Origem manual'} · {row.id}</option>)}
        </select></label>
        <div><span title={state.capture?.encounterId}>Medição {state.capture?.encounterId.slice(0, 8) ?? '—'}</span>
          <button onClick={() => configure({ reviewEncounterId: null })}>{config.reviewEncounterId ? 'Voltar ao vivo' : 'Ao vivo'}</button>
          <button onClick={() => act(() => window.overlayAPI.reset())}>Nova medição</button></div>
      </section>
      <div className="overlay-control-visibility">
        <label><input type="checkbox" checked={config.totalVisible} onChange={event => configure({ totalVisible: event.target.checked })} />Total</label>
        <label><input type="checkbox" checked={config.skillsVisible} onChange={event => configure({ skillsVisible: event.target.checked })} />Habilidades</label>
        <button aria-pressed={!config.locked} onClick={() => configure({ locked: !config.locked })}
          title="Permitir arrastar os painéis; desative para passar cliques ao jogo">{config.locked ? 'Trava ativa' : 'Mover livre'}</button>
      </div>
      <button className="overlay-restore-total" onClick={() => configure({ totalVisible: true, anchors: { total: { x: .5, y: 0 } } })}>Restaurar total no topo</button>
      <OverlayCombatSettings config={config} configure={configure} />
      <label className="overlay-control-page">Página do gráfico<select aria-label="Página do gráfico" value={config.metricPage ?? 'damage'}
        onChange={event => configure({ metricPage: event.target.value as MetricPage })}>
        {metricPages.map(page => <option key={page.id} value={page.id}>{page.label}</option>)}
      </select></label>
      <OverlayTimer state={state} act={act} compact />
      <section className="overlay-control-section" aria-label="Aparência">
        <label className="overlay-control-range">Transparência do fundo <output>{Math.round((1 - config.opacity) * 100)}%</output>
          <input aria-label="Transparência do fundo" type="range" min="0" max="75" value={Math.round((1 - config.opacity) * 100)}
            onChange={event => configure({ opacity: 1 - Number(event.target.value) / 100 })} /></label>
        <div className="overlay-control-font">
          <label>Fonte<select aria-label="Fonte" value={config.fontFamily ?? 'Inter'} onChange={event => configure({ fontFamily: event.target.value as OverlayConfig['fontFamily'] })}>
            <option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Consolas">Consolas</option>
          </select></label>
          <label>Tamanho <select aria-label="Tamanho da fonte" value={config.fontSize ?? 13} onChange={event => configure({ fontSize: Number(event.target.value) })}>
            {Array.from({ length: 11 }, (_, index) => index + 10).map(size => <option key={size} value={size}>{size} px</option>)}
          </select></label>
        </div>
        <label className="overlay-control-range">Margem horizontal do gráfico <output>{config.chartPadding ?? 12} px</output>
          <input aria-label="Margem horizontal do gráfico" type="range" min="0" max="32" step="1" value={config.chartPadding ?? 12}
            onChange={event => configure({ chartPadding: Number(event.target.value) })} /></label>
        <label className="overlay-control-range">Margem vertical do gráfico <output>{config.chartPaddingVertical ?? 10} px</output>
          <input aria-label="Margem vertical do gráfico" type="range" min="0" max="32" step="1" value={config.chartPaddingVertical ?? 10}
            onChange={event => configure({ chartPaddingVertical: Number(event.target.value) })} /></label>
        <details className="overlay-control-colors"><summary>Cores <span aria-hidden="true">{palette.slice(0, 3).map(item => <i key={item.key} style={{ backgroundColor: theme[item.key] }} />)}</span></summary>
          <div>{palette.map(item => <label key={item.key}><input aria-label={`Cor: ${item.label}`} type="color" value={theme[item.key]}
            onChange={event => configure({ theme: { ...theme, [item.key]: event.target.value } })} />{item.label}</label>)}</div>
          <button onClick={() => configure({ theme: { ...defaultOverlayTheme } })}>Restaurar cores</button>
        </details>
      </section>
      <section className="overlay-control-section overlay-position" aria-label="Posicionamento">
        <label>Posição na janela do TL<select aria-label="Painel para posicionar" value={panel} onChange={event => setPanel(event.target.value as OverlayPanel)}>
          <option value="total">Total geral</option><option value="skills">Por habilidade</option><option value="controls">Este controle</option>
        </select></label>
        <div className="overlay-position-layout">
          <div className="overlay-anchor-grid" role="group" aria-label="Posições rápidas">{positions.map(([symbol, label, x, y]) => <button key={label}
            aria-label={label} title={label} aria-pressed={anchor.x === x && anchor.y === y} onClick={() => move(x, y)}>{symbol}</button>)}</div>
          <div className="overlay-position-ranges">
            <label className="overlay-control-range">Horizontal <output>{Math.round(anchor.x * 100)}%</output>
              <input aria-label="Posição horizontal" type="range" min="0" max="100" value={Math.round(anchor.x * 100)} onChange={event => move(Number(event.target.value) / 100, anchor.y)} /></label>
            <label className="overlay-control-range">Vertical <output>{Math.round(anchor.y * 100)}%</output>
              <input aria-label="Posição vertical" type="range" min="0" max="100" value={Math.round(anchor.y * 100)} onChange={event => move(anchor.x, Number(event.target.value) / 100)} /></label>
          </div>
        </div>
      </section>
      <footer className="overlay-controls-footer"><span className={`meter-dot ${state.game?.attached ? 'on' : ''}`} />{state.game?.attached ? 'Ancorado à janela do TL' : 'Aguardando janela do TL'}<span>Ctrl ⇧ F11</span></footer>
    </div>}
  </aside>
}
