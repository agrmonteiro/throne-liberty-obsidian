import React, { useState } from 'react'
import { compareMetrics, metricData, metricRate, type MetricPage } from '../engine/overlayAnalysis'
import type { OverlayEncounter } from '../engine/overlayMeter'
import { MeterSkillIcon } from './MeterSkillIcon'
import { duration, number } from './meterFormatting'

export function OverlayEncounterComparison({ current, reference, page }: {
  current: OverlayEncounter; reference: OverlayEncounter; page: MetricPage
}): React.ReactElement {
  const [basis, setBasis] = useState<'rate' | 'total'>('rate')
  const left = metricData(current.session, page), right = metricData(reference.session, page)
  const sameConnection = Boolean(current.captureId && current.captureId === reference.captureId
    && current.connectionId && current.connectionId === reference.connectionId)
  const unavailable = !left.available || !right.available ? 'Um dos registros é anterior à coleta desta métrica.'
    : (page === 'receivedSources' || page === 'damageTargets') && !sameConnection ? 'Comparar entidades exige registros da mesma conexão; os IDs mudam entre conexões.'
    : basis === 'rate' && (current.session.elapsedSec < 1 || reference.session.elapsedSec < 1) ? 'É necessário pelo menos 1 segundo medido em cada registro para comparar taxas.' : null
  const rows = unavailable ? [] : compareMetrics(current.session, reference.session, page, basis)
  const currentValue = basis === 'rate' ? metricRate(left.total, current.session.elapsedSec) : left.total
  const referenceValue = basis === 'rate' ? metricRate(right.total, reference.session.elapsedSec) : right.total
  const signed = (value: number): string => `${value > 0 ? '+' : value < 0 ? '−' : ''}${number(Math.abs(value))}`
  return <section className="overlay-comparison" aria-label="Comparação dos encontros">
    <header><h3>Selecionado × referência</h3><label>Comparar por<select aria-label="Base da comparação" value={basis}
      onChange={event => setBasis(event.target.value as 'total' | 'rate')}>
      <option value="rate">Por segundo · {left.rateLabel}</option><option value="total">Total acumulado</option></select></label></header>
    <p>Selecionado: {duration(current.session.elapsedSec)}{current.reason === 'current' ? ' · parcial' : ''} · Referência: {duration(reference.session.elapsedSec)}{reference.reason === 'current' ? ' · parcial' : ''}.
      {' '}A duração completa de cada medição é usada; alvo e condições de combate não são compensados.</p>
    {unavailable ? <p role="status">{unavailable}</p> : <>
      <div className="overlay-comparison-summary"><span>Selecionado <strong>{number(currentValue)}</strong></span>
        <span>Referência <strong>{number(referenceValue)}</strong></span><span>Diferença <strong>{signed(currentValue - referenceValue)}</strong></span></div>
      <div className="overlay-comparison-scroll"><table className="meter-table meter-comparison-table">
        <thead><tr><th>{page === 'receivedSources' ? 'Fonte' : page === 'damageTargets' ? 'Alvo' : 'Habilidade'}</th><th>Selecionado</th><th>Referência</th><th>Diferença</th><th>Variação</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.key}><td title={row.name}><span className="meter-skill-label">
          {page !== 'receivedSources' && page !== 'damageTargets' && <MeterSkillIcon name={row.name} iconFile={row.iconFile} />}<span className="meter-skill-name">{row.name}</span></span></td>
          <td>{number(row.current)}</td><td>{number(row.reference)}</td><td>{signed(row.delta)}</td>
          <td>{row.percent === null ? row.current > 0 ? 'Nova' : '—' : `${row.percent > 0 ? '+' : ''}${row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</td></tr>)}</tbody>
      </table>{!rows.length && <p>Nenhuma habilidade registrada nesta página.</p>}</div>
    </>}
  </section>
}
