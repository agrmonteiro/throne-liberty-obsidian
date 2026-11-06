import React, { useEffect, useState } from 'react'
import type { OverlayState } from '../engine/overlayMeter'
import type { BuffEvent, BuffKind, BuffResult, ObservedBuff } from '../engine/overlayBuffs'
import type { BuffContributionRow } from '../engine/overlayBuffContribution'
import { EventTimeline, TimelineToggle } from './EventTimeline'

const kinds: Record<BuffKind, string> = { buff: 'Buff', debuff: 'Debuff', neutral: 'Neutro', unknown: 'Não classificado' }
const actions = { apply: 'Aplicação', update: 'Atualização', remove: 'Remoção' }
type BuffView = 'active' | 'impact' | 'events'
export const buffName = (event: BuffEvent): string => event.effectNames?.length ? event.effectNames.join(' / ') : `Efeito ${event.effectId}`
function remaining(buff: ObservedBuff): string {
  if (buff.remainingMsCandidate == null || buff.remainingMsCandidate < 0) return 'Sem prazo observado'
  const seconds = buff.remainingMsCandidate / 1000 - (Date.now()/1000 - buff.time)
  return seconds > 0 ? `~${seconds.toFixed(1)} s` : 'Sem remoção recebida'
}
export function OverlayBuffView({ state, active, compact = false }: { state: OverlayState; active: boolean; compact?: boolean }): React.ReactElement {
  const [data, setData] = useState<BuffResult>({ scope: null, observed: [], recent: [], overflow: false,
    journal: { file: null, events: 0, bytes: 0, error: null } })
  const [contributions, setContributions] = useState<BuffContributionRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('all')
  const [timeline, setTimeline] = useState(false)
  const [view, setView] = useState<BuffView>('active')
  useEffect(() => {
    if (!active) return
    let disposed = false, timer: ReturnType<typeof setTimeout>
    const refresh = async (): Promise<void> => {
      try { const [result, attributed] = await Promise.all([window.overlayAPI.buffs(), window.overlayAPI.buffContributions()]); if (!disposed) { setData(result); setContributions(attributed); setError(null) } }
      catch { if (!disposed) setError('Não foi possível consultar os buffs.') }
      if (!disposed) timer = setTimeout(() => void refresh(), 1000)
    }
    void refresh()
    return () => { disposed = true; clearTimeout(timer) }
  }, [active])
  const current = data.scope !== null && data.scope.captureId === state.capture?.id && data.scope.connectionId === state.capture?.connectionId
    && data.scope?.playerId === state.config.sourceId
  const match = (event: BuffEvent): boolean => (filter === 'all' || (event.kind ?? 'unknown') === filter)
    && `${buffName(event)} ${event.effectId} ${event.sourceName ?? ''} ${event.sourceId}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR').trim())
  const observed = current ? data.observed.filter(match).sort((a,b) => buffName(a).localeCompare(buffName(b), 'pt-BR')) : []
  const recent = current ? data.recent.filter(match).slice().reverse() : []
  const contributionRows = contributions.filter(row => `${row.name} ${row.effectId}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR').trim()))
  const actor = (id: number, name?: string): string => id === data.scope?.playerId ? state.config.playerName ?? 'Você' : name ?? `Entidade ${id}`
  const direction = (buff: BuffEvent): string => buff.sourceId === data.scope?.playerId ? `Você → ${actor(buff.targetId, buff.targetName)}` : `${actor(buff.sourceId, buff.sourceName)} → Você`
  return <div className={`overlay-buffs${compact ? ' is-compact' : ''}`} data-overlay-interactive={compact ? true : undefined}>
    <div className="overlay-section-heading"><h2>Buffs e debuffs</h2><span className="overlay-buff-count">{observed.length} ativos em você</span></div>
    <div className="overlay-buff-summary" aria-label="Resumo de buffs"><span><b>{observed.length}</b> ativos em você</span><span><b>{contributions.length}</b> efeitos com impacto</span><span><b>{recent.length}</b> eventos recentes</span></div>
    <nav className="overlay-buff-tabs" aria-label="Visão de buffs e debuffs">
      <button aria-pressed={view === 'active'} onClick={() => setView('active')}>Ativos</button>
      <button aria-pressed={view === 'impact'} onClick={() => setView('impact')}>Impacto no dano</button>
      <button aria-pressed={view === 'events'} onClick={() => setView('events')}>Eventos</button>
    </nav>
    <div className="overlay-buff-filters"><label>Buscar efeito ou origem<input aria-label="Buscar buffs" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome ou ID" /></label>
      <label>Tipo<select aria-label="Tipo de efeito" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Todos</option>
        {Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {(error ?? data.journal.error) && <p role="alert">{error ?? data.journal.error}</p>}
    {data.overflow && <p role="alert">Limite de estados observados atingido; consulte o registro bruto.</p>}
    {state.mode === 'replay' ? <p role="status">A página de buffs acompanha a leitura ao vivo.</p> : !current ? <p role="status">Aguardando a identificação do personagem nesta conexão.</p> : <>
      {view === 'active' && <section className="overlay-buff-active" aria-label="Efeitos ativos em você"><div className="overlay-buff-view-heading"><div><h3>Ativos em você</h3><p>Somente efeitos cuja presença foi confirmada e ainda não recebeu remoção.</p></div></div>
        <div className="overlay-buff-scroll"><table className="overlay-buff-table"><caption className="sr-only">Efeitos ativos em você</caption>
          <thead><tr><th>Efeito</th><th>Origem</th><th>Acúmulos*</th><th>Prazo*</th></tr></thead>
          <tbody>{observed.map(buff => <tr key={buff.serialRaw}>
            <td><strong title={buffName(buff)}>{buffName(buff)}</strong><small><i className={`overlay-buff-kind is-${buff.kind ?? 'unknown'}`} />{kinds[buff.kind ?? 'unknown']} · ID {buff.effectId}{buff.startedAt === null ? ' · início não observado' : ''}</small></td>
            <td title={String(buff.sourceId)}>{actor(buff.sourceId, buff.sourceName)}</td><td>{buff.stackCountCandidate ?? '—'}</td><td>{remaining(buff)}</td>
          </tr>)}</tbody></table></div>
        {!observed.length && <p className="overlay-note">{search || filter !== 'all' ? 'Nenhum efeito ativo neste filtro.' : 'Nenhum buff ou debuff ativo confirmado em você.'}</p>}
        <p className="overlay-note">* Tempo e acúmulos são experimentais; a remoção enviada pelo jogo é a confirmação do término.</p>
      </section>}
      {view === 'impact' && <section className="overlay-buff-contribution" aria-label="Impacto estimado de debuffs"><div className="overlay-buff-view-heading"><div><h3>Impacto no seu dano</h3>
        <p>Estimativa para debuffs aplicados por você: compara acertos sob o efeito com a média anterior da mesma habilidade e alvo.</p></div></div>
        {contributionRows.length ? <table className="overlay-buff-table"><thead><tr><th>Efeito aplicado</th><th>Variação estimada</th><th>Amostras</th><th>Confiança</th></tr></thead><tbody>{contributionRows.map(row => <tr key={row.effectId}>
          <td><strong>{row.name}</strong><small>{row.stacks === null ? '' : `${row.stacks} acúmulos · `}{row.skills} habilidades / {row.targets} alvos</small></td>
          <td className={row.estimatedDamage > 0 ? 'is-positive' : row.estimatedDamage < 0 ? 'is-negative' : ''}>{row.estimatedDamage > 0 ? '+' : ''}{Math.round(row.estimatedDamage).toLocaleString('pt-BR')}<small>{Math.round(row.activeDamage).toLocaleString('pt-BR')} observado · {Math.round(row.expectedDamage).toLocaleString('pt-BR')} base</small></td>
          <td>{row.samples}</td><td>{row.confidence === 'medium' ? 'Média' : row.confidence === 'low' ? 'Baixa' : 'Insuficiente'}</td>
        </tr>)}</tbody></table> : <p className="overlay-note">Aguardando cinco acertos-base da mesma habilidade/alvo e acertos com o debuff aplicado.</p>}
        <p className="overlay-note">Crítico, pesado, buffs simultâneos e mudanças de alvo podem afetar a comparação; use a confiança como requisito mínimo antes de concluir.</p>
      </section>}
      {view === 'events' && <section className="overlay-buff-events" aria-label="Eventos recentes de buffs"><div className="overlay-buff-view-heading"><div><h3>Eventos recentes</h3><p>Aplicações, atualizações e remoções associadas a você nesta conexão.</p></div><TimelineToggle active={timeline} onClick={() => setTimeline(value => !value)} /></div>
        {timeline ? <EventTimeline ariaLabel="Linha do tempo de buffs e debuffs" events={recent.map((buff, index) => ({ id: `${buff.time}-${buff.serialRaw}-${index}`, time: buff.time,
          label: `${actions[buff.action]} · ${buffName(buff)}`, detail: direction(buff), tone: 'buff' }))} /> : <ol className="overlay-buff-event-list">{recent.map((buff, index) => <li key={`${buff.time}-${buff.serialRaw}-${index}`}>
          <time>{new Date(buff.time * 1000).toLocaleTimeString('pt-BR')}</time><span className={`overlay-buff-action is-${buff.action}`}>{actions[buff.action]}</span><div><strong>{buffName(buff)}</strong><small>{direction(buff)} · {kinds[buff.kind ?? 'unknown']} · ID {buff.effectId}</small></div>
          <details><summary>Dados</summary><pre>{JSON.stringify(buff, null, 2)}</pre></details>
        </li>)}</ol>}
        {!recent.length && <p className="overlay-note">Nenhum evento neste filtro.</p>}
      </section>}
    </>}
    <p className="overlay-note">Cobertura parcial: efeitos já ativos antes da leitura podem não aparecer. Pausa, reset e cronômetro do DPS não interrompem este registro.{state.status === 'stopped' ? ' Leitura parada.' : ''}</p>
    <details className="overlay-buff-journal"><summary>Registro local · {data.journal.events.toLocaleString('pt-BR')} eventos</summary>
      <p>O arquivo inclui efeitos de todas as entidades e perfis recebidos, mesmo antes da identificação. Cada captura guarda até 256 MiB.</p>
      <p>{data.journal.file ?? 'Inicie a leitura para gravar.'}</p></details>
  </div>
}
