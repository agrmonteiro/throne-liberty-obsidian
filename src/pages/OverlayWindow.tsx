import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MeterPanel } from '../components/MeterPanels'
import { useOverlay } from '../hooks/useOverlay'
import { OverlaySourcesView } from '../components/OverlaySourcesView'
import { overlayAppearance } from '../components/overlayAppearance'
import { OverlayMetricView, overlayGraphPages } from '../components/OverlayMetricView'
import { OverlayDeathView } from '../components/OverlayDeathView'
import { useOverlayGraphPage, type OverlayGraphPage } from '../hooks/useOverlayGraphPage'
import { OverlayTimerStatus } from '../components/OverlayTimer'
import { OverlayDragLabel } from '../components/OverlayDragLabel'
import { OverlayCombatOverview } from '../components/OverlayCombatOverview'
import { sessionForTarget } from '../engine/overlayMeter'
import '../styles/overlay.css'

export function OverlayWindow({ panel }: { panel: 'total' | 'skills' }): React.ReactElement {
  const { state, act } = useOverlay()
  // A leitura começa sem grupo/perfis confirmados. Mostrar primeiro o medidor
  // individual dá retorno imediato ao jogador; o ranking continua a um clique.
  const [groupSources, setGroupSources] = useState(false)
  /** `null` é o total; os IDs continuam no snapshot para permitir rever qualquer alvo da luta. */
  const [targetId, setTargetId] = useState<number | null>(null)
  const { page, selectPage } = useOverlayGraphPage(state.config.metricPage, patch => act(() => window.overlayAPI.configure(patch)))
  const deathView = panel === 'skills' && page === 'deaths'
  const journalView = deathView
  const targets = useMemo(() => [...(state.session.targets ?? [])]
    .sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0) || b.damage - a.damage), [state.session.targets])
  const targetName = (target: typeof targets[number]): string => target.name
    ?? (target.id > 0 ? `Alvo #${target.id}` : 'Alvo desconhecido')
  const canFilterTargets = panel === 'skills' && !groupSources && page === 'damage'
  useEffect(() => {
    if (targetId !== null && !targets.some(target => target.id === targetId)) setTargetId(null)
  }, [targetId, targets])
  useEffect(() => {
    if (!state.config.locked) return
    let interactive = false
    const update = (enabled: boolean): void => {
      if (interactive === enabled) return
      interactive = enabled
      void window.overlayAPI.interactive(enabled)
    }
    const move = (event: MouseEvent): void => update(event.target instanceof Element && Boolean(event.target.closest('[data-overlay-interactive]')))
    const leave = (): void => update(false)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseleave', leave)
      void window.overlayAPI.interactive(false)
    }
  }, [state.config.locked])
  // O overlay é exclusivamente ao vivo: históricos e comparações pertencem à
  // tela principal, onde há espaço para análise sem poluir o jogo.
  const display = canFilterTargets && targetId !== null ? { ...state, session: sessionForTarget(state.session, targetId) } : state
  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  return <div className="overlay-window" style={{ ...overlayAppearance(state.config), fontSize: `${(state.config.fontSize ?? 13) * state.config.scale}px` }}>
    <header className={`overlay-record-toolbar overlay-titlebar ${state.config.locked ? 'is-locked' : 'meter-drag'}`}
      aria-label={state.config.locked ? 'Barra de título travada' : 'Barra de título para mover a janela'}>
      <OverlayDragLabel label={`${panel === 'total' ? 'Total' : state.config.singleWindow !== false ? 'Combate' : 'Gráfico'} · DEV`} locked={state.config.locked} />
      <button data-overlay-interactive aria-label={state.session.paused ? 'Retomar medição' : 'Pausar medição'}
        aria-pressed={Boolean(state.session.paused)} disabled={!['live', 'replay'].includes(state.status) || Boolean(state.timer)}
        title="Pausar ou retomar todos os painéis; o tempo pausado fica fora do DPS"
        onClick={() => act(() => window.overlayAPI.pause(!state.session.paused))}>{state.session.paused ? '▶' : 'Ⅱ'}</button>
      <button data-overlay-interactive aria-label="Resetar medição" title="Resetar a medição atual"
        disabled={!['live', 'replay'].includes(state.status)} onClick={() => {
          setTargetId(null); act(() => window.overlayAPI.reset())
        }}>↺</button>
      {panel === 'skills' && <button data-overlay-interactive aria-label="Importar build" title="Abrir a ficha do jogo para importar uma build"
        onClick={() => act(() => window.overlayAPI.openBuildImport())}>Build</button>}
      {canFilterTargets && <select data-overlay-interactive className="overlay-target-filter" aria-label="Filtrar dano por alvo"
        value={targetId ?? 'total'} onChange={event => setTargetId(event.target.value === 'total' ? null : Number(event.target.value))}>
        <option value="total">Total · {targets.length} {targets.length === 1 ? 'alvo' : 'alvos'}</option>
        {targets.map(target => <option key={target.id} value={target.id}>{targetName(target)} · {target.hits} {target.hits === 1 ? 'acerto' : 'acertos'}</option>)}
      </select>}
      {panel === 'skills' && <div className="overlay-view-switch" data-overlay-interactive aria-label="Visão do combate">
        <button disabled={state.config.locked || journalView}
          aria-pressed={groupSources} title="Ranking do grupo observado nesta luta" onClick={() => setGroupSources(true)}>Grupo</button>
        <button disabled={state.config.locked || journalView}
          aria-pressed={!groupSources} title="Seu medidor individual e páginas de métricas" onClick={() => setGroupSources(false)}>Eu</button>
      </div>}
    </header>
    <OverlayTimerStatus state={state} />
    {panel === 'skills' && !groupSources && <select data-overlay-interactive className="overlay-metric-switch" aria-label="Página do gráfico" disabled={state.config.locked}
      value={page} onChange={event => {
        setGroupSources(false); selectPage(event.target.value as OverlayGraphPage)
      }}>{overlayGraphPages.map(page => <option key={page.id} value={page.id}>{page.label}</option>)}</select>}
    <div className="overlay-panel-content">{deathView ? <section className="meter-panel overlay-death-panel" aria-label="Causa mortis">
      <OverlayDeathView state={state} active compact showTimeline={false} /></section> : panel === 'skills' && groupSources ? <OverlaySourcesView state={display} compact showTimeline={false}
        onSelectSegment={groupSegmentId => act(() => window.overlayAPI.configure({ groupSegmentId }))}
        onSelectEncounter={groupEncounterId => act(() => window.overlayAPI.configure({ groupEncounterId }))} /> : panel === 'skills' && state.config.metricPage && state.config.metricPage !== 'damage'
      ? <div className="overlay-unified-content"><OverlayCombatOverview state={display} />
        <OverlayMetricView state={display} page={state.config.metricPage} showSearch={false} showTimeline={false} /></div>
      : panel === 'skills' && state.config.singleWindow !== false ? <div className="overlay-unified-content"><OverlayCombatOverview state={display} />
        <MeterPanel panel="skills" state={display} showSearch={false} showReset={false} showTimeline={false} onReset={() => act(() => window.overlayAPI.reset())}
          onSelectSource={sourceId => act(() => window.overlayAPI.configure({ sourceId }))}
          onHide={() => act(() => window.overlayAPI.configure({ skillsVisible: false }))} /></div>
      : <MeterPanel panel={panel} state={display} showSearch={false} onReset={() => act(() => window.overlayAPI.reset())}
        onSelectSource={sourceId => act(() => window.overlayAPI.configure({ sourceId }))}
        onHide={() => act(() => window.overlayAPI.configure(panel === 'total' ? { totalVisible: false } : { skillsVisible: false }))} />}</div>
    {!state.config.locked && <div className="overlay-resize" title="Arrastar para redimensionar" role="slider" aria-label="Redimensionar painel" aria-valuemin={0} aria-valuenow={window.innerWidth}
      onPointerDown={event => {
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { x: event.screenX, y: event.screenY, width: window.innerWidth, height: window.innerHeight }
      }}
      onPointerMove={event => {
        const start = drag.current
        if (!start) return
        act(() => window.overlayAPI.bounds(panel, { x: window.screenX, y: window.screenY,
          width: start.width + event.screenX - start.x, height: start.height + event.screenY - start.y }))
      }}
      onPointerUp={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }} />}
  </div>
}
