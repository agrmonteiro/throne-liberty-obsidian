import React, { useEffect, useState } from 'react'
import type { OverlayState } from '../engine/overlayMeter'
import type { BuffEvent, BuffKind, BuffResult, ObservedBuff } from '../engine/overlayBuffs'

const kinds: Record<BuffKind, string> = { buff: 'Buff', debuff: 'Debuff', neutral: 'Neutro', unknown: 'Não classificado' }
const actions = { apply: 'Aplicação', update: 'Atualização', remove: 'Remoção' }
export const buffName = (event: BuffEvent): string => event.effectNames?.length ? event.effectNames.join(' / ') : `Efeito ${event.effectId}`
function remaining(buff: ObservedBuff): string {
  if (buff.remainingMsCandidate == null || buff.remainingMsCandidate < 0) return 'Sem prazo observado'
  const seconds = buff.remainingMsCandidate / 1000 - (Date.now()/1000 - buff.time)
  return seconds > 0 ? `~${seconds.toFixed(1)} s` : 'Sem remoção recebida'
}
export function OverlayBuffView({ state, active, compact = false }: { state: OverlayState; active: boolean; compact?: boolean }): React.ReactElement {
  const [data, setData] = useState<BuffResult>({ scope: null, observed: [], recent: [], overflow: false,
    journal: { file: null, events: 0, bytes: 0, error: null } })
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('all')
  useEffect(() => {
    if (!active) return
    let disposed = false, timer: ReturnType<typeof setTimeout>
    const refresh = async (): Promise<void> => {
      try { const result = await window.overlayAPI.buffs(); if (!disposed) { setData(result); setError(null) } }
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
  const actor = (id: number, name?: string): string => id === data.scope?.playerId ? state.config.playerName ?? 'Você' : name ?? `Entidade ${id}`
  return <div className={`overlay-buffs${compact ? ' is-compact' : ''}`} data-overlay-interactive={compact ? true : undefined}>
    <div className="overlay-section-heading"><h2>Buffs e debuffs</h2><span className="overlay-buff-count">{observed.length} estados observados</span></div>
    <div className="overlay-buff-filters"><label>Buscar efeito ou origem<input aria-label="Buscar buffs" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome ou ID" /></label>
      <label>Tipo<select aria-label="Tipo de efeito" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Todos</option>
        {Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <p className="overlay-note">Efeitos recebidos nesta leitura. Tempo e acúmulos são experimentais; o fim estimado não substitui a remoção enviada pelo jogo.</p>
    {(error ?? data.journal.error) && <p role="alert">{error ?? data.journal.error}</p>}
    {data.overflow && <p role="alert">Limite de estados observados atingido; consulte o registro bruto.</p>}
    {state.mode === 'replay' ? <p role="status">A página de buffs acompanha a leitura ao vivo.</p> : !current ? <p role="status">Aguardando a identificação do personagem nesta conexão.</p> : <>
      <div className="overlay-buff-scroll"><table className="overlay-buff-table"><caption className="sr-only">Efeitos recebidos sem remoção observada</caption>
        <thead><tr><th>Efeito</th><th>Origem</th><th>Acúmulos*</th><th>Prazo estimado*</th></tr></thead>
        <tbody>{observed.map(buff => <tr key={buff.serialRaw}>
          <td><strong title={buffName(buff)}>{buffName(buff)}</strong><small>{kinds[buff.kind ?? 'unknown']} · {buff.effectId}{buff.startedAt === null ? ' · Início não observado' : ''}</small></td>
          <td title={String(buff.sourceId)}>{actor(buff.sourceId, buff.sourceName)}</td><td>{buff.stackCountCandidate ?? '—'}</td><td>{remaining(buff)}</td>
        </tr>)}</tbody></table></div>
      {!observed.length && <p className="overlay-note">{search || filter !== 'all' ? 'Nenhum efeito neste filtro.' : 'Nenhum efeito recebido sem remoção observada.'}</p>}
      <details className="overlay-buff-timeline"><summary>Eventos recentes · {recent.length}/200</summary><ol>{recent.map((buff, index) => <li key={`${buff.time}-${buff.serialRaw}-${index}`}><details>
        <summary><time>{new Date(buff.time * 1000).toLocaleTimeString('pt-BR')}</time><span>{actions[buff.action]}</span><strong>{buffName(buff)}</strong>
          <small>{actor(buff.sourceId, buff.sourceName)} → {actor(buff.targetId, buff.targetName)}</small></summary><pre>{JSON.stringify(buff, null, 2)}</pre>
      </details></li>)}</ol></details>
    </>}
    <p className="overlay-note">Cobertura parcial: efeitos já ativos antes da leitura podem não aparecer. Pausa, reset e cronômetro do DPS não interrompem este registro.{state.status === 'stopped' ? ' Leitura parada.' : ''}</p>
    <details className="overlay-buff-journal"><summary>Registro local · {data.journal.events.toLocaleString('pt-BR')} eventos</summary>
      <p>O arquivo inclui efeitos de todas as entidades e perfis recebidos, mesmo antes da identificação. Cada captura guarda até 256 MiB.</p>
      <p>{data.journal.file ?? 'Inicie a leitura para gravar.'}</p></details>
  </div>
}
