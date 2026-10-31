import React, { useEffect, useState } from 'react'
import type { OverlayState } from '../engine/overlayMeter'
import type { DeathCombatEvent, DeathLogResult, DeathReport } from '../engine/overlayDeathLog'
import { overlaySkillFiles, overlaySkillNames } from '../engine/overlaySkillReference'
import { MeterSkillIcon } from './MeterSkillIcon'
import { number } from './MeterPanels'

const clock = (time: number): string => new Date(time * 1000).toLocaleString('pt-BR')
function actor(event: DeathCombatEvent, side: 'source' | 'target', report: DeathReport): string {
  const id = side === 'source' ? event.sourceId : event.targetId
  return id === report.playerId ? report.playerName : event[side === 'source' ? 'sourceName' : 'targetName'] ?? (id ? `Entidade ${id}` : '—')
}
function kind(event: DeathCombatEvent, playerId: number): string {
  if (event.type === 'damage') return event.targetId === playerId ? 'Dano recebido' : 'Dano causado'
  if (event.type === 'healing') return event.sourceId === playerId && event.targetId === playerId ? 'Autocura' : 'Cura'
  return event.type === 'effect' ? 'Efeito não classificado' : 'Estado da entidade'
}
function EventRow({ event, report }: { event: DeathCombatEvent; report: DeathReport }): React.ReactElement {
  const [expanded, setExpanded] = useState(false)
  const skill = event.skillName ?? overlaySkillNames[String(event.skillId)] ?? (event.skillId ? `Habilidade ${event.skillId}` : '—')
  const amount = event.type === 'damage' ? event.damage : event.type === 'healing' ? event.healing : undefined
  const relative = event.time - report.time
  return <li className={`death-event death-event-${event.type}`}><details onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary title="Abrir todos os campos deste evento"><time>{relative.toFixed(3)} s</time>
      <span className="death-event-kind">{kind(event, report.playerId)}</span>
      <span className="death-event-actors" title={`${actor(event, 'source', report)} → ${actor(event, 'target', report)}`}>
        {event.sourceId !== undefined && <span>{actor(event, 'source', report)} → </span>}{actor(event, 'target', report)}</span>
      <span className="death-event-skill" title={skill}>{event.skillId !== undefined && <MeterSkillIcon name={skill} iconFile={overlaySkillFiles[String(event.skillId)]} />}{skill}</span>
      <strong>{amount !== undefined ? number(amount) : '—'}<small>{event.criticalCandidate ? ' Crítico' : ''}{event.heavyCandidate ? ' Pesado' : ''}</small></strong>
    </summary>
    {expanded && <div className="death-event-raw"><p>{clock(event.time)} · {event.raw?.opcode ?? 'Sem pacote bruto neste registro'}{event.raw?.truncated ? ' · Corpo truncado em 16 KiB' : ''}</p>
      <pre aria-label="Dados completos do evento">{JSON.stringify(event, null, 2)}</pre></div>}
  </details></li>
}
function exportReport(report: DeathReport): void {
  const link = document.createElement('a')
  link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ schemaVersion: 1, report }, null, 2))}`
  link.download = `throne-causa-mortis-${new Date(report.time * 1000).toISOString().replace(/[:.]/g, '-')}.json`
  link.hidden = true; document.body.appendChild(link); link.click(); link.remove()
}
export function OverlayDeathView({ state, active }: { state: OverlayState; active: boolean }): React.ReactElement {
  const [data, setData] = useState<DeathLogResult>({ records: [], recent: [], error: null })
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!active || !window.overlayAPI?.deaths) return
    let disposed = false, timer: ReturnType<typeof setTimeout>
    const refresh = async (): Promise<void> => {
      try { const result = await window.overlayAPI.deaths(); if (!disposed) setData(result) }
      catch { if (!disposed) setData(previous => ({ ...previous, error: 'Não foi possível consultar os eventos.' })) }
      if (!disposed) timer = setTimeout(() => void refresh(), 2000)
    }
    void refresh()
    return () => { disposed = true; clearTimeout(timer) }
  }, [active])
  const report = data.records.find(row => row.id === selected) ?? data.records[0]
  const events = report?.events.filter(event => filter === 'all' || event.type === filter) ?? []
  const buffered = state.deathLog?.buffered ?? data.recent.length
  const lastDamage = report?.events.slice().reverse().find(event => event.type === 'damage' && event.targetId === report.playerId && (event.damage ?? 0) > 0)
  return <div className="overlay-deaths">
    <div className="overlay-section-heading"><h2>Causa mortis</h2><div className="overlay-heading-actions">
      <button disabled={saving || state.status !== 'live' || state.config.sourceId === null || buffered === 0}
        title="Salvar os eventos atuais como uma morte informada por você" onClick={() => {
          setSaving(true)
          void window.overlayAPI.recordDeath().then(result => { setData(result); setSelected(result.records[0]?.id ?? null) })
            .catch(() => setData(previous => ({ ...previous, error: 'Não foi possível registrar a morte.' }))).finally(() => setSaving(false))
        }}>{saving ? 'Registrando…' : 'Registrar morte agora'}</button>
      <button disabled={!report} onClick={() => report && exportReport(report)}>Exportar JSON</button>
    </div></div>
    <p className="death-buffer" role="status"><strong>{buffered}/50</strong> eventos no buffer atual · {data.records.length}/20 registros salvos</p>
    <p className="overlay-note">O registro congela até 50 eventos, incluindo o acerto que sinaliza a morte. A detecção automática ainda é experimental. Use “Registrar morte agora” para informar uma morte manualmente.</p>
    {(data.error ?? state.deathLog?.error) && <p role="alert">{data.error ?? state.deathLog?.error}</p>}
    {!report ? <div className="death-empty"><h3>Nenhuma morte registrada</h3><p>{state.config.sourceId === null
      ? 'Aguardando a identificação do personagem para iniciar o buffer.' : buffered ? 'Os eventos estão sendo guardados enquanto você joga.' : 'Aguardando eventos do personagem na leitura ao vivo.'}</p></div>
      : <>
        <div className="death-controls"><label>Registro<select aria-label="Registro de causa mortis" value={report.id} onChange={event => setSelected(event.target.value)}>
          {data.records.map(row => <option key={row.id} value={row.id}>{clock(row.time)} · {row.playerName} · {row.trigger === 'manual' ? 'Manual' : row.trigger === 'damage-signal' ? 'Sinal no dano' : 'Sinal de estado'}</option>)}
        </select></label><label>Eventos<select aria-label="Filtrar eventos da morte" value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">Todos</option><option value="damage">Dano</option><option value="healing">Cura</option><option value="state">Estado</option><option value="effect">Efeitos não classificados</option>
        </select></label></div>
        <div className="death-summary"><span>{report.trigger === 'manual' ? 'Morte informada manualmente' : report.trigger === 'damage-signal' ? 'Morte sinalizada no acerto · experimental' : 'Possível morte · sinal de estado experimental'} · {report.events.length} eventos preservados</span>
          <p>{lastDamage ? <>Último dano recebido registrado: <strong>{number(lastDamage.damage!)} de {actor(lastDamage, 'source', report)}</strong>. Isso não confirma que foi o golpe fatal.</> : 'Nenhum dano recebido entre os eventos preservados.'}</p>
          <small>Personagem {report.playerId} · Conexão {report.connectionId.slice(0, 12)} · HP não decodificado</small></div>
        <div className="death-list-heading" aria-hidden="true"><span>Antes da morte</span><span>Evento</span><span>Origem → Alvo</span><span>Habilidade</span><span>Valor</span></div>
        <ol className="death-events" aria-label="Eventos anteriores à morte">{events.map((event, index) => <EventRow key={`${report.id}-${filter}-${index}`} event={event} report={report} />)}</ol>
        {!events.length && <p className="overlay-note">Nenhum evento neste filtro.</p>}
        {report.signal && <details className="death-signal"><summary>Pacote que gerou o sinal experimental</summary><pre>{JSON.stringify(report.signal, null, 2)}</pre></details>}
      </>}
    <p className="overlay-note">Cobertura: dano, autocura identificada, efeitos e estados decodificados do personagem nesta conexão. Cada linha abre os campos e o corpo bruto do pacote. Buffs, escudos e HP ainda não têm interpretação completa. Pausa e cronômetro do DPS não interrompem este buffer; parar a leitura interrompe a coleta.</p>
  </div>
}
