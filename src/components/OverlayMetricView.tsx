import React from 'react'
import type { OverlayState } from '../engine/overlayMeter'
import { number } from './MeterPanels'
import { MeterSkillTable } from './MeterSkillTable'
import { overlayAppearance } from './overlayAppearance'
import { metricData, metricRate, type MetricPage } from '../engine/overlayAnalysis'
export type { MetricPage } from '../engine/overlayAnalysis'

export const metricPages = [
  { id: 'damage', label: 'Dano causado' },
  { id: 'damageTargets', label: 'Dano causado por alvo' },
  { id: 'receivedSources', label: 'Dano recebido por fonte' },
  { id: 'receivedSkills', label: 'Dano recebido por habilidade' },
  { id: 'healingDone', label: 'Cura feita' },
  { id: 'healingReceived', label: 'Cura recebida' },
] as const

export const overlayGraphPages = [...metricPages, { id: 'buffs', label: 'Buffs e debuffs' }, { id: 'deaths', label: 'Causa mortis' }] as const

export function OverlayMetricView({ state, page, historical = false }: {
  state: OverlayState; page: Exclude<MetricPage, 'damage'>; historical?: boolean
}): React.ReactElement {
  const data = metricData(state.session, page)
  const { healing, total } = data
  const title = metricPages.find(item => item.id === page)!.label
  return <section className="meter-panel overlay-metric-view" style={overlayAppearance(state.config)} aria-label={title}>
    <header className="meter-panel-header"><strong>{title}</strong>
      <span className="meter-mode">{historical ? 'HISTÓRICO' : state.session.paused ? 'PAUSADO' : 'EXPERIMENTAL'}</span></header>
    {!data.available ? <div className="overlay-metric-unavailable" role="status">
      <strong>Registro sem dados de {healing ? 'cura' : page === 'damageTargets' ? 'dano por alvo' : 'dano recebido'}</strong>
      <p>Esta medição é anterior à coleta desta métrica.</p>
    </div> : <>
      <div className="overlay-metric-summary"><strong data-testid="received-total">{number(total)}</strong>
        <span>{healing ? 'de cura bruta' : page === 'damageTargets' ? 'de dano causado' : 'de dano recebido'} · {number(data.hits)} {healing ? 'aplicações' : 'acertos'}</span>
        <span className="meter-metric-rate">{number(metricRate(total, state.session.elapsedSec))} {data.rateLabel}</span></div>
      <MeterSkillTable key={page} state={state} page={page} emptyMessage={state.config.sourceId === null ? 'Aguardando identificação do personagem.'
        : healing ? 'Aguardando uma cura identificada na captura.' : page === 'damageTargets' ? 'Aguardando dano causado pelo personagem.' : 'Aguardando dano contra o personagem selecionado.'} />
      <footer className="meter-session-status">{healing ? state.session.healing?.coverage === 'self-observed'
        ? 'Registro antigo: inclui somente autocuras. Curas externas não coletadas não podem ser reconstruídas neste encontro.'
        : 'Cura bruta experimental: feita pela origem e recebida pelo alvo, incluindo autocura e cura de terceiros. Cobertura parcial; cura efetiva e escudos não medidos.'
        : page === 'damageTargets' ? 'Alvos identificados nesta conexão. Expanda um alvo para ver a distribuição do dano entre habilidades.'
        : page === 'receivedSources' ? 'Fontes identificadas pelo perfil do jogador ou pelo template do NPC recebido nesta conexão. IDs sem nome aguardam os dados da entidade.'
        : 'Ataques de monstros sem nome de exibição usam rótulos descritivos. Clique na habilidade para consultar os detalhes.'}</footer>
    </>}
  </section>
}
