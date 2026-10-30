import React from 'react'
import type { OverlayConfig, OverlayState } from '../engine/overlayMeter'
import { number } from './MeterPanels'
import { MeterSkillIcon } from './MeterSkillIcon'
import { overlayAppearance } from './overlayAppearance'

export const metricPages = [
  { id: 'damage', label: 'Dano causado' },
  { id: 'receivedSources', label: 'Dano recebido por fonte' },
  { id: 'receivedSkills', label: 'Dano recebido por habilidade' },
  { id: 'healingDone', label: 'Cura feita' },
  { id: 'healingReceived', label: 'Cura recebida' },
] as const
export type MetricPage = NonNullable<OverlayConfig['metricPage']>

export function OverlayMetricView({ state, page, historical = false }: {
  state: OverlayState; page: Exclude<MetricPage, 'damage'>; historical?: boolean
}): React.ReactElement {
  const healing = page === 'healingDone' || page === 'healingReceived'
  const received = state.session.received
  const heals = page === 'healingDone' ? state.session.healing?.done : state.session.healing?.received
  const rows = page === 'receivedSources' ? received?.sources.map(row => ({
    key: String(row.id), name: row.name ?? `Origem ${row.id}`, damage: row.damage, hits: row.hits,
    detail: `ID ${row.id}`, iconFile: undefined as string | undefined,
  })) ?? [] : (healing ? heals?.skills : received?.skills)?.map(row => ({ ...row, detail: `IDs ${row.skillIds?.join(', ') ?? row.key}` })) ?? []
  const maximum = Math.max(0, ...rows.map(row => row.damage))
  const total = (healing ? heals?.total : received?.total) ?? 0
  const title = metricPages.find(item => item.id === page)!.label
  return <section className="meter-panel overlay-metric-view" style={overlayAppearance(state.config)} aria-label={title}>
    <header className="meter-panel-header"><strong>{title}</strong>
      <span className="meter-mode">{historical ? 'HISTÓRICO' : state.session.paused ? 'PAUSADO' : 'EXPERIMENTAL'}</span></header>
    {healing && !heals ? <div className="overlay-metric-unavailable" role="status">
      <strong>Registro sem dados de cura</strong>
      <p>Esta medição é anterior à leitura experimental de autocura bruta.</p>
    </div> : <>
      <div className="overlay-metric-summary"><strong data-testid="received-total">{number(total)}</strong>
        <span>{healing ? 'de cura bruta' : 'de dano recebido'} · {number((healing ? heals?.hits : received?.hits) ?? 0)} {healing ? 'aplicações' : 'acertos'}</span></div>
      <div className="meter-skills-scroll"><table className="meter-table">
        <thead><tr><th>{page === 'receivedSources' ? 'Fonte' : 'Habilidade'}</th><th>{healing ? 'Cura' : 'Dano'}</th><th>%</th><th>{healing ? 'Aplicações' : 'Acertos'}</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.key} style={{ backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--meter-accent) 20%, transparent), color-mix(in srgb, var(--meter-accent) 20%, transparent))',
          backgroundSize: `${maximum ? row.damage / maximum * 100 : 0}% 100%` }}>
          <td title={`${row.name} · ${row.detail}`}><span className="meter-skill-label">
            {page !== 'receivedSources' && <MeterSkillIcon name={row.name} iconFile={row.iconFile} />}
            <span className="meter-skill-name">{row.name}</span></span></td>
          <td>{number(row.damage)}</td><td>{total ? (row.damage / total * 100).toFixed(1).replace('.', ',') : '0'}%</td><td>{number(row.hits)}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <div className="meter-empty">{historical && !received ? 'Este registro é anterior à coleta de dano recebido.'
        : state.config.sourceId === null ? 'Aguardando identificação do personagem.' : healing ? 'Aguardando uma autocura identificada na captura.' : 'Aguardando dano contra o personagem selecionado.'}</div>}
      </div>
      <footer className="meter-session-status">{healing ? 'Autocura bruta experimental: efeitos de cura identificados no catálogo local. Cobertura parcial; cura efetiva, escudos e cura entre jogadores não medidos.'
        : 'Somente eventos cujo alvo é o personagem selecionado. Nomes de fontes dependem dos perfis recebidos.'}</footer>
    </>}
  </section>
}
