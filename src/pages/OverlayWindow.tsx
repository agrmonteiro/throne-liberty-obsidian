import React, { useEffect, useRef, useState } from 'react'
import { MeterPanel } from '../components/MeterPanels'
import { useOverlay } from '../hooks/useOverlay'
import { resolveOverlayNames, type OverlayHistoryResult } from '../engine/overlayMeter'
import names from '../data/overlaySkillNames.json'
import { OverlaySourcesView } from '../components/OverlaySourcesView'
import { overlayAppearance } from '../components/overlayAppearance'
import '../styles/overlay.css'

export function OverlayWindow({ panel }: { panel: 'total' | 'skills' }): React.ReactElement {
  const { state, act } = useOverlay()
  const [history, setHistory] = useState<OverlayHistoryResult>({ encounters: [], error: null })
  const [groupSources, setGroupSources] = useState(false)
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
  const display = selected ? resolveOverlayNames({ ...state, session: selected.session,
    mode: selected.mode, status: 'stopped', config: { ...state.config, locked: true, sourceId: selected.sourceId } }, names) : state
  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  return <div className="overlay-window" style={{ ...overlayAppearance(state.config), fontSize: `${(state.config.fontSize ?? 13) * state.config.scale}px` }}>
    <div className="overlay-record-toolbar">
      <select aria-label="Registro do overlay" disabled={state.config.locked}
        title={history.error ?? (state.config.locked ? 'Ctrl+Shift+F9 para escolher registros' : 'Escolher registro salvo')}
        value={selected?.id ?? ''} onChange={event => act(() => window.overlayAPI.configure({ reviewEncounterId: event.target.value || null }))}>
        <option value="">Atual{state.mode === 'replay' ? ' · reprodução' : ' · ao vivo'}</option>
        {history.encounters.map(row => <option key={row.id} value={row.id}>
          {new Date(row.session.startedAt!).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {Math.round(row.session.total).toLocaleString('pt-BR')}{row.mode === 'replay' ? ' · Replay' : ''}
        </option>)}
      </select>
      <button title="Voltar ao atual · Ctrl+Shift+F8"
        onClick={() => act(() => window.overlayAPI.configure({ reviewEncounterId: null }))}>Atual</button>
      {panel === 'skills' && <button disabled={state.config.locked || Boolean(selected)}
        title="Alternar entre habilidades e origens da leitura atual" onClick={() => setGroupSources(value => !value)}>
        {groupSources ? 'Habilidades' : 'Origens'}</button>}
    </div>
    {selected && selected.attributionVersion !== 2 && <div role="alert">Registro anterior à correção de atacante/alvo; atribuição pode estar incorreta.</div>}
    <div className="overlay-panel-content">{panel === 'skills' && groupSources && !selected ? <OverlaySourcesView state={state} compact /> : <MeterPanel panel={panel} state={display} historical={Boolean(selected)} onReset={() => act(() => window.overlayAPI.reset())}
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
