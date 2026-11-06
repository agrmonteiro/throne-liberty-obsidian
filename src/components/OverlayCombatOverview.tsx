import React from 'react'
import type { OverlayState } from '../engine/overlayMeter'
import { duration, number } from './meterFormatting'

/** Resumo compacto usado pela janela única antes da análise detalhada. */
export function OverlayCombatOverview({ state, historical = false }: { state: OverlayState; historical?: boolean }): React.ReactElement {
  const { session } = state
  return <section className="overlay-combat-overview" aria-label="Resumo do combate">
    <div className="overlay-combat-overview-title"><span className={`meter-dot ${state.status === 'live' && !historical ? 'on' : ''}`} />
      <strong>{historical ? 'Registro salvo' : 'Combate atual'}</strong><span>{historical ? 'HISTÓRICO' : session.paused ? 'PAUSADO' : 'AO VIVO'}</span></div>
    <div className="overlay-combat-overview-values">
      <div><small>DANO</small><strong>{number(session.total)}</strong></div>
      <div><small>DPS</small><strong>{number(session.dps)}</strong></div>
      <div><small>TEMPO</small><strong>{duration(session.elapsedSec)}</strong></div>
      <div><small>ACERTOS</small><strong>{number(session.hits)}</strong></div>
    </div>
  </section>
}
