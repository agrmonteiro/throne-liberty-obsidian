import React from 'react'
import type { OverlayConfig, OverlayState } from '../engine/overlayMeter'
import { duration } from './MeterPanels'

export function OverlayTimerStatus({ state }: { state: OverlayState }): React.ReactElement | null {
  const timer = state.timer
  if (!timer) return null
  const label = timer.phase === 'countdown' ? `Começa em ${Math.ceil(timer.remainingSec)} s`
    : timer.phase === 'running' ? `Teste · ${duration(timer.elapsedSec)} / ${duration(timer.durationSec)} · faltam ${Math.ceil(timer.remainingSec)} s`
    : timer.phase === 'cancelled' ? 'Teste interrompido · resultado congelado' : 'Tempo encerrado · resultado congelado'
  return <div className={`overlay-timer-status ${timer.phase}`} role="status" aria-live={timer.phase === 'countdown' ? 'polite' : 'off'}>{label}</div>
}

export function OverlayTimer({ state, act, compact = false }: {
  state: OverlayState; act: (operation: () => Promise<unknown>) => void; compact?: boolean
}): React.ReactElement {
  const active = state.timer?.phase === 'countdown' || state.timer?.phase === 'running'
  const canStart = state.status === 'live' && state.mode === 'live' && state.config.sourceId !== null
  const configure = (patch: Partial<OverlayConfig>): void => act(() => window.overlayAPI.configure(patch))
  return <section className={`overlay-timer ${compact ? 'compact' : ''}`} aria-label="Teste com cronômetro">
    <strong>Teste com cronômetro</strong>
    <div className="overlay-timer-fields">
      <label>Preparação (s)<input aria-label="Preparação em segundos" type="number" min="0" max="60" step="1" disabled={active}
        value={state.config.countdownSec ?? 5} onChange={event => { if (Number.isFinite(event.target.valueAsNumber)) configure({ countdownSec: event.target.valueAsNumber }) }} /></label>
      <label>Duração (s)<input aria-label="Duração em segundos" type="number" min="1" max="3600" step="1" disabled={active}
        value={state.config.durationSec ?? 60} onChange={event => { if (Number.isFinite(event.target.valueAsNumber)) configure({ durationSec: event.target.valueAsNumber }) }} /></label>
      {active ? <button onClick={() => act(() => window.overlayAPI.timer('cancel'))}>Interromper teste</button>
        : <button disabled={!canStart} title={!canStart ? 'Inicie a leitura e selecione seu personagem' : 'Salva a medição atual e prepara uma nova contagem'}
          onClick={() => act(() => window.overlayAPI.timer('start'))}>Iniciar teste</button>}
      {state.timer && !active && <button onClick={() => act(() => window.overlayAPI.timer('clear'))}>Medição livre</button>}
    </div>
    <OverlayTimerStatus state={state} />
    {!state.timer && <p>Apenas eventos dentro do intervalo contam. O tempo começa no fim da preparação, mesmo sem atacar.</p>}
  </section>
}
