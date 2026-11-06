import React, { useEffect, useRef, useState } from 'react'
import { MeterPanel } from '../components/MeterPanels'
import { useOverlay } from '../hooks/useOverlay'
import { resolveOverlayNames, type OverlayHistoryResult } from '../engine/overlayMeter'
import { overlaySkillNames as names, overlaySkillFiles, overlayNpcNames } from '../engine/overlaySkillReference'
import { OverlaySourcesView } from '../components/OverlaySourcesView'
import { overlayAppearance } from '../components/overlayAppearance'
import { OverlayMetricView, overlayGraphPages } from '../components/OverlayMetricView'
import { OverlayDeathView } from '../components/OverlayDeathView'
import { OverlayBuffView } from '../components/OverlayBuffView'
import { useOverlayGraphPage, type OverlayGraphPage } from '../hooks/useOverlayGraphPage'
import { OverlayTimerStatus } from '../components/OverlayTimer'
import { OverlayDragLabel } from '../components/OverlayDragLabel'
import '../styles/overlay.css'

export function OverlayWindow({ panel }: { panel: 'total' | 'skills' }): React.ReactElement {
  const { state, act } = useOverlay()
  const [history, setHistory] = useState<OverlayHistoryResult>({ encounters: [], error: null })
  // A leitura começa sem grupo/perfis confirmados. Mostrar primeiro o medidor
  // individual dá retorno imediato ao jogador; o ranking continua a um clique.
  const [groupSources, setGroupSources] = useState(false)
  const { page, selectPage } = useOverlayGraphPage(state.config.metricPage, patch => act(() => window.overlayAPI.configure(patch)))
  const deathView = panel === 'skills' && page === 'deaths'
  const buffView = panel === 'skills' && page === 'buffs'
  const journalView = deathView || buffView
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
  useEffect(() => {
    let active = true
    const refresh = async (): Promise<void> => {
      try { const result = await window.overlayAPI.history(); if (active) setHistory(result) }
      catch (error) { if (active) setHistory(value => ({ ...value, error: String(error) })) }
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 2000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  const selected = history.encounters.find(row => row.id === state.config.reviewEncounterId)
  const display = selected ? resolveOverlayNames({ ...state, session: selected.session, groupConnections: selected.groupConnections,
    mode: selected.mode, status: 'stopped', config: { ...state.config, locked: true, sourceId: selected.sourceId } }, names, overlaySkillFiles, overlayNpcNames) : state
  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  return <div className="overlay-window" style={{ ...overlayAppearance(state.config), fontSize: `${(state.config.fontSize ?? 13) * state.config.scale}px` }}>
    <header className={`overlay-record-toolbar overlay-titlebar ${state.config.locked ? 'is-locked' : 'meter-drag'}`}
      aria-label={state.config.locked ? 'Barra de título travada' : 'Barra de título para mover a janela'}>
      <OverlayDragLabel label={`${panel === 'total' ? 'Total' : state.config.singleWindow !== false ? 'Combate' : 'Gráfico'} · DEV`} locked={state.config.locked} />
      <button data-overlay-interactive aria-label={state.session.paused ? 'Retomar medição' : 'Pausar medição'}
        aria-pressed={Boolean(state.session.paused)} disabled={!['live', 'replay'].includes(state.status) || Boolean(state.timer)}
        title="Pausar ou retomar todos os painéis; o tempo pausado fica fora do DPS"
        onClick={() => act(() => window.overlayAPI.pause(!state.session.paused))}>{state.session.paused ? '▶' : 'Ⅱ'}</button>
      <select aria-label="Registro do overlay" disabled={state.config.locked || journalView}
        title={history.error ?? (state.config.locked ? 'Ctrl+Shift+F9 para escolher registros' : 'Escolher registro salvo')}
        value={journalView ? '' : selected?.id ?? ''} onChange={event => act(() => window.overlayAPI.configure({ reviewEncounterId: event.target.value || null }))}>
        <option value="">{buffView ? 'Buffs da leitura atual' : deathView ? 'Registros de morte abaixo' : `Atual${state.mode === 'replay' ? ' · reprodução' : ' · ao vivo'}`}</option>
        {history.encounters.map(row => <option key={row.id} value={row.id}>
          {new Date(row.session.startedAt!).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {Math.round(row.session.total).toLocaleString('pt-BR')}{row.mode === 'replay' ? ' · Replay' : ''}
        </option>)}
      </select>
      <button title="Voltar ao atual · Ctrl+Shift+F8" disabled={journalView}
        onClick={() => act(() => window.overlayAPI.configure({ reviewEncounterId: null }))}>Atual</button>
      {panel === 'skills' && <button data-overlay-interactive aria-label="Importar build" title="Abrir a ficha do jogo para importar uma build"
        onClick={() => act(() => window.overlayAPI.openBuildImport())}>Build</button>}
      {panel === 'skills' && <><button data-overlay-interactive disabled={state.config.locked || Boolean(selected) || journalView}
        aria-pressed={groupSources} title="Ranking do grupo observado nesta luta" onClick={() => setGroupSources(true)}>Grupo</button>
      <button data-overlay-interactive disabled={state.config.locked || journalView}
        aria-pressed={!groupSources} title="Seu medidor individual e páginas de métricas" onClick={() => setGroupSources(false)}>Meu dano</button></>}
    </header>
    <OverlayTimerStatus state={state} />
    {panel === 'skills' && !groupSources && <select data-overlay-interactive className="overlay-metric-switch" aria-label="Página do gráfico" disabled={state.config.locked}
      value={page} onChange={event => {
        setGroupSources(false); selectPage(event.target.value as OverlayGraphPage)
      }}>{overlayGraphPages.map(page => <option key={page.id} value={page.id}>{page.label}</option>)}</select>}
    {!journalView && selected && selected.attributionVersion !== 2 && <div role="alert">Registro anterior à correção de atacante/alvo; atribuição pode estar incorreta.</div>}
    <div className="overlay-panel-content">{buffView ? <section className="meter-panel overlay-death-panel" aria-label="Buffs e debuffs">
      <OverlayBuffView state={state} active compact /></section> : deathView ? <section className="meter-panel overlay-death-panel" aria-label="Causa mortis">
      <OverlayDeathView state={state} active compact /></section> : panel === 'skills' && groupSources && (selected ? Boolean(selected.groupConnections?.length) : true) ? <OverlaySourcesView state={display} compact
        onSelectSegment={groupSegmentId => act(() => window.overlayAPI.configure({ groupSegmentId }))} /> : panel === 'skills' && state.config.metricPage && state.config.metricPage !== 'damage'
      ? <OverlayMetricView state={display} page={state.config.metricPage} historical={Boolean(selected)} /> : <MeterPanel panel={panel} state={display} historical={Boolean(selected)} onReset={() => act(() => window.overlayAPI.reset())}
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
