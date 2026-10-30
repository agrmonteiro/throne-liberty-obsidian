import React from 'react'
import type { DamageBreakdown, DamageKind, OverlayState } from '../engine/overlayMeter'
import { overlaySourceWarning } from '../engine/overlayMeter'
import { overlayAppearance } from './overlayAppearance'
import { MeterSkillIcon } from './MeterSkillIcon'

export const number = (value: number): string => Math.round(value).toLocaleString('pt-BR')
export function duration(seconds: number): string {
  const value = Math.floor(seconds)
  return `${Math.floor(value / 3600) ? `${Math.floor(value / 3600)}:` : ''}${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
const percentage = (value: number, total: number): string => `${total ? (100 * value / total).toFixed(1).replace('.', ',') : '0'}%`
const damageKinds: Array<{ key: DamageKind; label: string; color: string }> = [
  { key: 'normal', label: 'Normal', color: 'var(--meter-normal, #8c9cac)' },
  { key: 'critical', label: 'Crítico', color: 'var(--meter-critical, #e2bd65)' },
  { key: 'heavy', label: 'Pesado', color: 'var(--meter-heavy, #67bdc3)' },
  { key: 'criticalHeavy', label: 'Crítico pesado', color: 'var(--meter-criticalHeavy, #c38bd8)' },
]
function breakdownTitle(values: DamageBreakdown): string {
  return damageKinds.map(kind => `${kind.label}: ${number(values[kind.key])}`).join(' · ')
}
function skillBar(values: DamageBreakdown, damage: number, maximum: number): React.CSSProperties {
  let offset = 0
  const stops = damageKinds.map(kind => {
    const start = offset
    offset += damage ? values[kind.key] / damage * 100 : 0
    return `color-mix(in srgb, ${kind.color} 32%, transparent) ${start}% ${offset}%`
  })
  return { backgroundImage: `linear-gradient(to right, ${stops.join(', ')})`,
    backgroundSize: `${maximum ? damage / maximum * 100 : 0}% 100%` }
}
function DamageStack({ values, total, className = '' }: { values: DamageBreakdown; total: number; className?: string }): React.ReactElement {
  return <span className={`meter-damage-stack ${className}`} role="img" aria-label={breakdownTitle(values)} title={breakdownTitle(values)}>
    {damageKinds.map(kind => <span key={kind.key} data-damage-kind={kind.key}
      style={{ width: `${total ? values[kind.key] / total * 100 : 0}%`, backgroundColor: kind.color }} />)}
  </span>
}
function DamageLegend({ values, total }: { values?: DamageBreakdown; total?: number }): React.ReactElement {
  return <div className={`meter-damage-legend ${values ? 'with-values' : ''}`}>
    {damageKinds.map(kind => <span key={kind.key} title={values ? `${kind.label}: ${number(values[kind.key])} de dano` : kind.label}>
      <i style={{ backgroundColor: kind.color }} />{kind.label}
      {values && <b>{percentage(values[kind.key], total ?? 0)}</b>}
    </span>)}
  </div>
}

export function MeterPanel({ panel, state, onReset, onHide, onSelectSource, preview = false, historical = false }: {
  panel: 'total' | 'skills'; state: OverlayState; onReset: () => void; onHide?: () => void
  onSelectSource?: (id: number | null) => void; preview?: boolean; historical?: boolean
}): React.ReactElement {
  const { session, config } = state
  const maximumDamage = Math.max(0, ...session.skills.map(row => row.damage))
  const editable = !historical && (!config.locked || preview)
  const sourceWarning = overlaySourceWarning(state)
  const captureNotice = state.status === 'error' ? state.message : sourceWarning
  return <section className={`meter-panel meter-${panel}`} style={{ ...overlayAppearance(config), backgroundColor: 'var(--meter-background)' }}>
    <header className="meter-panel-header">
      <span className={`meter-dot ${state.status === 'live' && !sourceWarning ? 'on' : ''}`} />
      <strong>{panel === 'total' ? 'Total geral' : 'Por habilidade'}</strong>
      <span className="meter-mode" title={`Origem ${config.sourceId ?? 'não identificada'} · Medição ${state.capture?.encounterId ?? '—'}`}>{state.mode === 'replay' ? 'REPRODUÇÃO' : historical ? 'HISTÓRICO' : state.capture?.player?.sourceId === config.sourceId ? 'VOCÊ' : 'TL'}</span>
      {editable && <div className="meter-panel-actions">
        {onSelectSource && <button className="meter-identify-button" title="Detectar origem novamente: reinicia o acumulado e usa a próxima origem com dano" aria-label="Detectar origem automaticamente"
          onClick={() => onSelectSource(null)}>Auto</button>}
        <button onClick={onReset} title="Resetar os dois painéis" aria-label="Resetar os dois painéis">↺</button>
        {onHide && <button onClick={onHide} title="Ocultar painel" aria-label="Ocultar painel">×</button>}
      </div>}
    </header>
    {panel === 'total' ? <div className="meter-total-body">
      <div className="meter-label">DANO ACUMULADO</div>
      <div className="meter-total-number" data-testid="meter-total">{number(session.total)}</div>
      <div className="meter-total-footer">
        <div><span>DPS médio</span><strong data-testid="meter-dps">{number(session.dps)}</strong></div>
        <div><span>Tempo da sessão</span><strong>{duration(session.elapsedSec)}</strong></div>
        <div><span>Acertos</span><strong>{number(session.hits)}</strong></div>
      </div>
      <div className="meter-damage-summary"><DamageStack values={session.damageByKind} total={session.total} />
        <DamageLegend values={session.damageByKind} total={session.total} /></div>
    </div> : <><div className="meter-skills-scroll">
      <table className="meter-table">
        <thead><tr><th>Habilidade</th><th>Dano</th><th>%</th><th>Acertos</th><th>Crít.</th><th>Pes.</th></tr></thead>
        <tbody>{session.skills.map(row => <tr key={row.key} style={skillBar(row.damageByKind, row.damage, maximumDamage)}>
          <td title={`${row.name}${row.skillIds?.length ? ` · IDs ${row.skillIds.join(', ')}` : ''} · ${breakdownTitle(row.damageByKind)}`}>
            <span className="meter-skill-label"><MeterSkillIcon name={row.name} iconFile={row.iconFile} /><span className="meter-skill-name">{row.name}</span></span></td>
          <td>{number(row.damage)}</td><td>{percentage(row.damage, session.total)}</td><td>{number(row.hits)}</td>
          <td>{percentage(row.critical, row.hits)}</td><td>{percentage(row.heavy, row.hits)}</td>
        </tr>)}</tbody>
      </table>
      {!session.skills.length && <div className="meter-empty">{captureNotice ?? 'Aguardando dano do seu personagem…'}</div>}
    </div><DamageLegend /></>}
    <footer className="meter-session-status">
      <span>{historical ? 'Registro salvo' : state.status === 'error' ? state.message : session.paused && ['live', 'replay'].includes(state.status) ? 'Medição pausada · tempo congelado' : captureNotice ?? (session.waitingReset ? 'Nova sessão no próximo dano' : session.lastDamageAt ? `Sem dano há ${duration(session.idleSec)}` : 'Aguardando primeiro dano')}</span>
      <span>{historical ? 'SOMENTE LEITURA' : editable ? 'Reset após 5 min' : 'TRAVADO'}</span>
    </footer>
  </section>
}
