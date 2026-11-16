import React, { useEffect, useState } from 'react'
import type { OverlayState } from '../engine/overlayMeter'
import type { DeathCombatEvent, DeathLogResult, DeathReport } from '../engine/overlayDeathLog'
import { overlayMasteryInsight, overlaySkillFiles, overlaySkillNames } from '../engine/overlaySkillReference'
import { MeterSkillIcon } from './MeterSkillIcon'
import { number } from './MeterPanels'
import { buffName } from './OverlayBuffView'
import { EventTimeline, TimelineToggle } from './EventTimeline'

const clock = (time: number): string => new Date(time * 1000).toLocaleString('pt-BR')
function actor(event: DeathCombatEvent, side: 'source' | 'target', report: DeathReport): string {
  const id = side === 'source' ? event.sourceId : event.targetId
  return id === report.playerId ? report.playerName : event[side === 'source' ? 'sourceName' : 'targetName'] ?? (id ? `Entidade ${id}` : '—')
}
function kind(event: DeathCombatEvent, playerId: number): string {
  if (event.type === 'buff') return event.buff?.action === 'remove' ? 'Efeito removido' : event.buff?.action === 'update' ? 'Efeito atualizado' : 'Efeito aplicado'
  if (event.type === 'damage') return event.targetId === playerId ? 'Dano recebido' : 'Dano causado'
  if (event.type === 'healing') return event.sourceId === playerId && event.targetId === playerId ? 'Autocura' : event.targetId === playerId ? 'Cura recebida' : 'Cura feita'
  return event.type === 'effect' ? ((event.observedAmount ?? 0) > 0 ? 'Efeito (com dano)' : 'Efeito não classificado') : 'Estado da entidade'
}
/**
 * An effect may have no localized name in the static effect catalogue even
 * when the packet identifies the skill that created it.  The recap is an
 * analysis surface, so the linked skill is more useful than a numeric effect
 * identifier.  The ID remains available in the expanded raw event.
 */
function eventLabel(event: DeathCombatEvent): string {
  const effectName = event.buff?.effectNames?.find(name => name.trim())
  if (effectName) return effectName
  if (event.skillName) return event.skillName
  const knownSkill = event.skillId === undefined ? undefined : overlaySkillNames[String(event.skillId)]
  if (knownSkill) return knownSkill
  if (event.buff) return 'Efeito sem nome'
  return event.skillId ? `Habilidade ${event.skillId}` : '—'
}
function eventKey(event: DeathCombatEvent, index: number): string {
  return [event.time, event.type, event.sourceId ?? '', event.targetId ?? '', event.buff?.serialRaw ?? event.effectId ?? event.skillId ?? '', index].join(':')
}
function eventDetail(event: DeathCombatEvent, report: DeathReport): string {
  const amount = event.type === 'damage' ? event.damage : event.type === 'healing' ? event.healing : event.observedAmount
  if (event.type === 'damage') return amount === undefined ? 'Dano observado sem valor decodificado.' : `${number(amount)} de dano observado.`
  if (event.type === 'healing') return amount === undefined ? 'Cura observada sem valor decodificado.' : `${number(amount)} de cura observada.`
  if (event.type === 'buff') {
    const action = event.buff?.action === 'remove' ? 'removido' : event.buff?.action === 'update' ? 'atualizado' : 'aplicado'
    const stacks = event.buff?.stackCountCandidate ? ` · ${event.buff.stackCountCandidate} acúmulo${event.buff.stackCountCandidate === 1 ? '' : 's'}` : ''
    return `Efeito ${action}${stacks}.`
  }
  if (event.type === 'effect') return amount && amount > 0 ? `${number(amount)} observado em efeito ainda não classificado.` : 'Efeito ainda não classificado pelo protocolo.'
  return `Mudança de estado observada em ${actor(event, 'target', report)}.`
}
function EventRow({ event, report, compact = false, selected, onSelect }: { event: DeathCombatEvent; report: DeathReport; compact?: boolean; selected: boolean; onSelect: () => void }): React.ReactElement {
  const skill = eventLabel(event)
  const mastery = overlayMasteryInsight(event.skillId)
  const skillTitle = mastery ? `${skill} · Passiva de maestria (${mastery.weapon}) — ${mastery.description}` : skill
  const amount = event.type === 'damage' ? event.damage : event.type === 'healing' ? event.healing : event.type === 'effect' && (event.observedAmount ?? 0) > 0 ? event.observedAmount : undefined
  const relative = event.time - report.time
  return <li className={`death-event death-event-${event.type}${selected ? ' is-selected' : ''}`}><button type="button" className="death-event-summary" aria-pressed={selected} onClick={onSelect} title={compact ? `${actor(event, 'source', report)} → ${actor(event, 'target', report)}` : 'Mostrar detalhe deste evento'}><time>{relative.toFixed(3)}{compact ? '' : ' s'}</time>
      <span className="death-event-kind">{compact ? event.type === 'damage' ? 'Dano' : event.type === 'healing' ? 'Cura' : event.type === 'buff' ? 'Efeito' : kind(event, report.playerId) : kind(event, report.playerId)}</span>
      <span className="death-event-actors" title={`${actor(event, 'source', report)} → ${actor(event, 'target', report)}`}>
        {event.sourceId !== undefined && <span>{actor(event, 'source', report)} → </span>}{actor(event, 'target', report)}</span>
      <span className="death-event-skill" title={skillTitle}>{event.skillId !== undefined && <MeterSkillIcon name={skill} iconFile={overlaySkillFiles[String(event.skillId)]} />}{skill}</span>
      <strong>{amount !== undefined ? number(amount) : '—'}<small>{event.criticalCandidate ? ' Crítico' : ''}{event.heavyCandidate ? ' Pesado' : ''}</small></strong>
    </button></li>
}
function SelectedEventDetail({ event, report, compact }: { event?: DeathCombatEvent; report: DeathReport; compact: boolean }): React.ReactElement {
  if (!event) return <div className="death-selected-detail" aria-label="Detalhe do evento selecionado" />
  const skill = eventLabel(event)
  const mastery = overlayMasteryInsight(event.skillId)
  const amount = event.type === 'damage' ? event.damage : event.type === 'healing' ? event.healing : event.observedAmount
  return <div className="death-selected-detail" aria-live="polite">
    <span className="death-selected-kicker">{kind(event, report.playerId)}</span>
    <strong>{event.skillId !== undefined && <MeterSkillIcon name={skill} iconFile={overlaySkillFiles[String(event.skillId)]} />}{skill}</strong>
    <p>{mastery ? mastery.description : eventDetail(event, report)}</p>
    <small>{mastery ? `Passiva de maestria · ${mastery.weapon} · ${mastery.grade}` : `${actor(event, 'source', report)} → ${actor(event, 'target', report)}${amount !== undefined ? ` · ${number(amount)}` : ''}`}</small>
    {!compact && event.raw && <details className="death-selected-raw"><summary>Dados do pacote</summary><pre aria-label="Dados completos do evento">{JSON.stringify(event, null, 2)}</pre></details>}
  </div>
}
function exportReport(report: DeathReport): void {
  const link = document.createElement('a')
  link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ schemaVersion: 1, report }, null, 2))}`
  link.download = `throne-causa-mortis-${new Date(report.time * 1000).toISOString().replace(/[:.]/g, '-')}.json`
  link.hidden = true; document.body.appendChild(link); link.click(); link.remove()
}
export function OverlayDeathView({ state, active, compact = false, showTimeline = true }: { state: OverlayState; active: boolean; compact?: boolean; showTimeline?: boolean }): React.ReactElement {
  const [data, setData] = useState<DeathLogResult>({ records: [], recent: [], error: null })
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedEventKey, setSelectedEventKey] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [timeline, setTimeline] = useState(false)
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
  const selectedEvent = events.find((event, index) => eventKey(event, index) === selectedEventKey)
  const buffered = state.deathLog?.buffered ?? data.recent.length
  const playerId = report?.playerId
  const lastDamage = playerId !== undefined ? report?.events.slice().reverse().find(event =>
    event.targetId === playerId &&
    ((event.type === 'damage' && (event.damage ?? 0) > 0) || (event.type === 'effect' && (event.observedAmount ?? 0) > 0))) : undefined
  const recapButton = <button disabled={saving || state.status !== 'live' || state.config.sourceId === null || buffered === 0}
    title="Salvar um recap dos eventos atuais" onClick={() => {
      setSaving(true)
      void window.overlayAPI.recordDeath().then(result => { setData(result); setSelected(result.records[0]?.id ?? null); setSelectedEventKey(null) })
        .catch(() => setData(previous => ({ ...previous, error: 'Não foi possível salvar o recap.' }))).finally(() => setSaving(false))
    }}>{saving ? 'Registrando…' : 'Recap agora'}</button>
  return <div className={`overlay-deaths${compact ? ' is-compact' : ''}`} data-overlay-interactive={compact ? true : undefined}>
    {compact ? <div className="death-compact-inspector"><div className="death-compact-toolbar"><p className="death-buffer" role="status"><strong>{buffered}/50</strong> eventos</p><div className="overlay-heading-actions">{recapButton}{showTimeline && <TimelineToggle active={timeline} onClick={() => setTimeline(value => !value)} />}</div></div>
      {report && <SelectedEventDetail event={selectedEvent} report={report} compact />}
    </div> : <><div className="overlay-section-heading"><h2>Causa mortis</h2><div className="overlay-heading-actions">
      {recapButton}<button disabled={!report} onClick={() => report && exportReport(report)}>Exportar JSON</button>
      {showTimeline && <TimelineToggle active={timeline} onClick={() => setTimeline(value => !value)} />}
    </div></div>
    <p className="death-buffer" role="status"><strong>{buffered}/50</strong> eventos no buffer atual · {data.records.length}/20 registros salvos</p>
    <p className="overlay-note">O registro congela até 50 eventos, incluindo o acerto que sinaliza a morte. A detecção automática ainda é experimental. “Recap agora” salva os eventos também sem uma morte.</p></>}
    {(data.error ?? state.deathLog?.error) && <p role="alert">{data.error ?? state.deathLog?.error}</p>}
    {!report ? <div className="death-empty"><h3>Nenhuma morte registrada</h3><p>{state.config.sourceId === null
      ? 'Aguardando a identificação do personagem para iniciar o buffer.' : buffered ? 'Os eventos estão sendo guardados enquanto você joga.' : 'Aguardando eventos do personagem na leitura ao vivo.'}</p></div>
      : <>
        {!compact && <div className="death-controls"><label>Registro<select aria-label="Registro de causa mortis" value={report.id} onChange={event => { setSelected(event.target.value); setSelectedEventKey(null) }}>
          {data.records.map(row => <option key={row.id} value={row.id}>{clock(row.time)} · {row.playerName} · {row.trigger === 'manual' ? 'Manual' : row.trigger === 'damage-signal' ? 'Sinal no dano' : 'Sinal de estado'}</option>)}
        </select></label><label>Eventos<select aria-label="Filtrar eventos da morte" value={filter} onChange={event => { setFilter(event.target.value); setSelectedEventKey(null) }}>
          <option value="all">Todos</option><option value="damage">Dano</option><option value="healing">Cura</option><option value="buff">Buffs e debuffs</option><option value="state">Estado</option><option value="effect">Efeitos não classificados</option>
        </select></label></div>}
        {!compact && <div className="death-summary"><span>{report.trigger === 'manual' ? 'Recap manual' : report.trigger === 'damage-signal' ? 'Morte sinalizada no acerto · experimental' : 'Possível morte · sinal de estado experimental'} · {report.events.length} eventos preservados</span>
          <p>{lastDamage ? <>Último dano recebido registrado: <strong>{number((lastDamage.damage ?? lastDamage.observedAmount)!)} de {actor(lastDamage, 'source', report)}</strong>{lastDamage.type === 'effect' ? ' (efeito)' : ''}. Isso não confirma que foi o golpe fatal.</> : 'Nenhum dano recebido entre os eventos preservados.'}</p>
          <small>Personagem {report.playerId} · Conexão {report.connectionId.slice(0, 12)} · HP não decodificado</small></div>}
        {!compact && <SelectedEventDetail event={selectedEvent} report={report} compact={false} />}
        {showTimeline && timeline ? <EventTimeline ariaLabel="Linha do tempo anterior à morte" events={events.map((event, index) => ({ id: `${report.id}-${filter}-${index}`, time: event.time - report.time,
          label: `${kind(event, report.playerId)} · ${eventLabel(event)}`,
          detail: `${actor(event, 'source', report)} → ${actor(event, 'target', report)}`, tone: event.type === 'damage' || event.type === 'effect' ? 'damage' : event.type === 'healing' ? 'healing' : event.type === 'buff' ? 'buff' : 'state' }))} /> : <>
          <div className="death-list-heading" aria-hidden="true"><span>Antes da morte</span><span>Evento</span><span>Origem → Alvo</span><span>Habilidade</span><span>Valor</span></div>
          <ol className="death-events" aria-label="Eventos anteriores à morte">{events.map((event, index) => {
            const key = eventKey(event, index)
            return <EventRow key={`${report.id}-${filter}-${key}`} event={event} report={report} compact={compact} selected={key === selectedEventKey} onSelect={() => setSelectedEventKey(key)} />
          })}</ol>
          {!events.length && <p className="overlay-note">Nenhum evento neste filtro.</p>}
        </>}
        {!compact && report.buffs && <details className="overlay-buff-timeline"><summary>Efeitos sem remoção observada no recap · {report.buffs.length}</summary>
          <ul>{report.buffs.map((buff, index) => <li key={`${buff.serialRaw}-${index}`}>{buffName(buff)} · {buff.sourceId === report.playerId ? report.playerName : buff.sourceName ?? `Entidade ${buff.sourceId}`}{buff.startedAt === null ? ' · Início não observado' : ''}</li>)}</ul>
          <p className="overlay-note">Presença parcial observada nesta captura; o tempo estimado não confirma término nem presença até a morte.</p></details>}
        {!compact && report.signal && <details className="death-signal"><summary>Pacote que gerou o sinal experimental</summary><pre>{JSON.stringify(report.signal, null, 2)}</pre></details>}
      </>}
    {!compact && <p className="overlay-note">Cobertura: dano, cura identificada (própria e de terceiros), buffs/debuffs observados, efeitos e estados do personagem nesta conexão. Selecione uma linha para ver o detalhe no painel acima; os dados brutos continuam disponíveis ali. Escudos e HP ainda não têm interpretação completa. Pausa e cronômetro do DPS não interrompem este buffer; parar a leitura interrompe a coleta.</p>}
  </div>
}
