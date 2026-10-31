import React from 'react'
import type { DamageBreakdown, OverlayState } from '../engine/overlayMeter'
import { overlaySourceWarning } from '../engine/overlayMeter'
import { overlayAppearance } from './overlayAppearance'
import { MeterSkillTable } from './MeterSkillTable'
import { damageKinds, duration, number, percentage } from './meterFormatting'

export { number, duration } from './meterFormatting'
function breakdownTitle(values: DamageBreakdown): string {
  return damageKinds.map(kind => `${kind.label}: ${number(values[kind.key])}`).join(' · ')
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
  const editable = !historical && (!config.locked || preview)
  const sourceWarning = overlaySourceWarning(state)
  const captureNotice = state.status === 'error' ? state.message : sourceWarning
  return <section className={`meter-panel meter-${panel}`} style={overlayAppearance(config)}>
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
    </div> : <><MeterSkillTable state={state} page="damage" emptyMessage={captureNotice ?? 'Aguardando dano do seu personagem…'} /><DamageLegend /></>}
    <footer className="meter-session-status">
      <span>{historical ? 'Registro salvo' : state.status === 'error' ? state.message : session.paused && ['live', 'replay'].includes(state.status) ? 'Medição pausada · tempo congelado' : captureNotice ?? (session.waitingReset ? 'Nova sessão no próximo dano' : session.lastDamageAt ? `Sem dano há ${duration(session.idleSec)}` : 'Aguardando primeiro dano')}</span>
      <span>{historical ? 'SOMENTE LEITURA' : editable ? 'Reset após 5 min' : 'TRAVADO'}</span>
    </footer>
  </section>
}
