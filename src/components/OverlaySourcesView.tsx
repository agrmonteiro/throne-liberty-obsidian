import React, { useMemo, useState } from 'react'
import { number } from './MeterPanels'
import { MeterSkillIcon } from './MeterSkillIcon'
import type { GroupSource, OverlayCombatSegment, OverlayState } from '../engine/overlayMeter'
import { OverlaySessionTimeline } from './OverlaySessionTimeline'

type View = 'skills' | 'targets'

const percent = (value: number, total: number): string => total ? `${(value / total * 100).toFixed(1).replace('.', ',')}%` : '0%'
const sourceName = (source: GroupSource): string => source.name ?? `Origem ${source.id}`
const sourceKind = (source: GroupSource): string => {
  const kind = source.kind === 'player' ? 'Jogador' : source.kind === 'npc' ? 'NPC' : source.kind === 'conflict' ? 'Identidade' : 'Entidade'
  const evidence = source.evidence === 'profile' ? 'Perfil confirmado' : source.evidence === 'npc-template' ? 'Template confirmado'
    : source.evidence === 'conflict' ? 'Conflito' : 'ID pendente'
  return `${kind} · ${evidence}`
}
const targetEvidence = (value?: string): string => value === 'profile' ? 'Perfil confirmado' : value === 'npc-template' ? 'Template confirmado'
  : value === 'conflict' ? 'Conflito de identidade' : 'ID pendente'
const rankHint = (value?: string, source?: string): string => {
  const label = value === 'boss' ? 'Chefe' : value === 'champion' ? 'Champion'
    : value === 'elite' ? 'Elite' : value === 'normal' ? 'Normal' : value === 'unique' ? 'Único' : ''
  if (!label) return ''
  return source === 'row-fallback' ? `Pista do template: ${label}` : `Classificação do cliente: ${label}`
}
const connectionLabel = (id: string, lastAt: number, sources: GroupSource[], currentId?: string | null): string => {
  const players = sources.filter(source => source.kind === 'player').length
  const at = Number.isFinite(lastAt) && lastAt > 0 ? new Date(lastAt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'sem horário'
  return `${id === currentId ? 'Atual · ' : ''}${at} · ${players} jogadores`
}
const segmentLabel = (segment: OverlayCombatSegment): string => {
  const time = new Date(segment.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const duration = Math.max(0, ((segment.endedAt ?? segment.lastActivityAt) - segment.startedAt) / 1000)
  const rank = segment.dominantTarget?.rank === 'boss' ? 'Chefe' : segment.dominantTarget?.rank === 'champion' ? 'Champion'
    : segment.dominantTarget?.rank === 'elite' ? 'Elite' : segment.dominantTarget?.rank === 'normal' ? 'Normal' : ''
  const target = segment.dominantTarget ? `${segment.dominantTarget.name ?? `NPC ${segment.dominantTarget.templateId}`} · ${rank}` : 'alvo pendente'
  return `${time} · ${duration.toFixed(0)} s · ${target}`
}

function SourceTargetRows({ source }: { source: GroupSource }): React.ReactElement {
  const [openTarget, setOpenTarget] = useState<number | null>(null)
  const targets = source.session.targets ?? []
  if (!targets.length) return <p className="meter-empty">Nenhum detalhe disponível.</p>
  return <div className="overlay-source-detail-list">
    {targets.map(target => <React.Fragment key={target.id}>
      <button type="button" data-overlay-interactive className="overlay-source-detail-row overlay-source-target-row"
        aria-expanded={openTarget === target.id} onClick={() => setOpenTarget(value => value === target.id ? null : target.id)}>
        <span className="overlay-source-target-chevron" aria-hidden="true">{openTarget === target.id ? '▾' : '▸'}</span>
        <span>{target.name ?? `Alvo ${target.id}`}<small>{targetEvidence(target.identity)}{rankHint(target.rank, target.rankSource) ? ` · ${rankHint(target.rank, target.rankSource)}` : ''} · {target.hits} acertos</small></span>
        <b>{number(target.damage)}</b><em>{percent(target.damage, source.session.total)}</em>
      </button>
      {openTarget === target.id && <div className="overlay-source-target-skills" aria-label={`Habilidades contra ${target.name ?? `alvo ${target.id}`} `}>
        {target.skills.length ? target.skills.map(skill => <div className="overlay-source-detail-row" key={skill.key}>
          <MeterSkillIcon name={skill.name} iconFile={skill.iconFile} /><span>{skill.name}<small>{skill.hits} acertos</small></span>
          <b>{number(skill.damage)}</b><em>{percent(skill.damage, target.damage)}</em>
        </div>) : <p className="meter-empty">Nenhuma habilidade registrada para este alvo.</p>}
      </div>}
    </React.Fragment>)}
  </div>
}

function SourceDetail({ source, view }: { source: GroupSource; view: View }): React.ReactElement {
  const skills = source.session.skills
  const targets = source.session.targets ?? []
  return <tr className="overlay-source-detail"><td colSpan={4}>
    <div className="overlay-source-detail-title">{view === 'skills' ? 'Habilidades desta origem' : 'Alvos desta origem'}</div>
    {view === 'skills' ? (!skills.length ? <p className="meter-empty">Nenhum detalhe disponível.</p> : <div className="overlay-source-detail-list">
      {skills.map(skill => <div className="overlay-source-detail-row" key={skill.key}>
        <MeterSkillIcon name={skill.name} iconFile={skill.iconFile} /><span>{skill.name}<small>{skill.identity === 'catalog' ? 'Catálogo confirmado' : `ID pendente · ${skill.skillIds?.join(', ') ?? skill.key}`} · {skill.hits} acertos</small></span>
        <b>{number(skill.damage)}</b><em>{percent(skill.damage, source.session.total)}</em>
      </div>)}
    </div>) : <SourceTargetRows source={source} />}
  </td></tr>
}

export function OverlaySourcesView({ state, compact = false, onSelectSegment }: { state: OverlayState; compact?: boolean; onSelectSegment?: (id: number | null) => void }): React.ReactElement {
  const [search, setSearch] = useState('')
  const [connectionId, setConnectionId] = useState('')
  // IDs de entidade só são únicos dentro da conexão. Guardar também a conexão
  // escolhida evita que uma atualização do ranking abra o detalhe da fonte local.
  const [detail, setDetail] = useState<{ connectionId: string; sourceId: number } | null>(null)
  const [view, setView] = useState<View>('skills')
  const [timeline, setTimeline] = useState(false)
  const connections = state.groupConnections ?? []
  const currentConnectionId = state.capture?.player?.connectionId
  const selectedConnection = connections.find(row => row.id === connectionId)
    ?? connections.find(row => row.id === currentConnectionId)
    ?? connections.find(row => !row.closed)
    ?? connections[0]
  // A evidência de identidade orienta a leitura, mas nunca deve esconder dano
  // observado: numa luta real o perfil/template pode chegar depois dos acertos.
  const sources = useMemo(() => [...(selectedConnection?.sources ?? [])]
    .sort((a, b) => b.session.total - a.session.total), [selectedConnection])
  const total = sources.reduce((sum, row) => sum + row.session.total, 0)
  const maximum = sources[0]?.session.total ?? 0
  const query = search.trim().toLocaleLowerCase()
  const visible = sources.filter(row => `${row.id} ${row.name ?? ''}`.toLocaleLowerCase().includes(query))
  const title = compact ? 'Grupo / origens observadas' : 'Dano por origem observada'
  const isCurrent = selectedConnection?.id === currentConnectionId
  const segments = state.combatSegments ?? []
  const detailConnection = detail ? connections.find(row => row.id === detail.connectionId) : undefined
  const detailSource = detail ? detailConnection?.sources.find(row => row.id === detail.sourceId) : undefined
  const showDetail = Boolean(detailSource)
  const resetDetail = (): void => { setDetail(null) }
  return <section id={compact ? undefined : 'overlay-sources'} className={`overlay-sources ${compact ? 'meter-panel compact' : ''}`} aria-label={title}>
    <header>{showDetail && <button className="overlay-source-back" data-overlay-interactive onClick={resetDetail}>‹ Voltar ao ranking</button>}<strong>{showDetail ? sourceName(detailSource!) : timeline ? 'Fases do combate' : title}</strong><span>{!showDetail && <button className="overlay-source-timeline-toggle" data-overlay-interactive aria-pressed={timeline} onClick={() => setTimeline(value => !value)}>{timeline ? 'Ranking' : 'Linha do tempo'}</button>}{!timeline && (isCurrent ? 'CONEXÃO ATUAL' : selectedConnection?.closed ? 'CONEXÃO ENCERRADA' : 'EVENTOS RECENTES')}</span></header>
    {showDetail ? <>
      <div className="overlay-source-detail-meta"><span>{sourceKind(detailSource!)} · ID {detailSource!.id}{rankHint(detailSource!.rank, detailSource!.rankSource) ? ` · ${rankHint(detailSource!.rank, detailSource!.rankSource)}` : ''}</span><strong>{number(detailSource!.session.total)} dano · {detailSource!.session.hits} acertos</strong></div>
      <nav className="overlay-source-detail-tabs" aria-label="Detalhes da origem" data-overlay-interactive>
        <button aria-pressed={view === 'skills'} onClick={() => setView('skills')}>Habilidades</button>
        <button aria-pressed={view === 'targets'} onClick={() => setView('targets')}>Alvos</button>
      </nav>
      <div className="overlay-sources-scroll overlay-source-detail-scroll"><table><tbody><SourceDetail source={detailSource!} view={view} /></tbody></table></div>
    </> : timeline ? <OverlaySessionTimeline segments={segments} className="overlay-source-timeline" /> : <>
    <div className="overlay-sources-intro"><p>{sources.length} origens exibidas · {number(total)} de dano</p>
      <input data-overlay-interactive aria-label="Buscar origem por nome ou ID" placeholder="Buscar nome ou ID" value={search} onChange={event => setSearch(event.target.value)} /></div>
    <div className="overlay-source-controls" data-overlay-interactive>
      <select aria-label="Segmento de combate" disabled={state.config.locked} value={state.config.groupSegmentId ?? ''}
        onChange={event => { resetDetail(); onSelectSegment?.(event.target.value ? Number(event.target.value) : null) }}>
        <option value="">Toda a leitura</option>
        {[...segments].reverse().map(segment => <option key={segment.id} value={segment.id}>{segmentLabel(segment)}</option>)}
      </select>
      <select aria-label="Conexão observada" value={selectedConnection?.id ?? ''} onChange={event => { setConnectionId(event.target.value); resetDetail() }}>
        {connections.map(row => <option key={row.id} value={row.id}>{connectionLabel(row.id, row.lastAt, row.sources, currentConnectionId)} · {row.closed ? 'encerrada' : 'ativa'}</option>)}
      </select>
    </div>
    <div className="overlay-sources-scroll"><table>
      <thead><tr><th>Origem</th><th>Dano</th><th>%</th><th></th></tr></thead>
      <tbody>{visible.map(row => <React.Fragment key={row.id}>
        <tr style={{ backgroundSize: `${maximum ? row.session.total / maximum * 100 : 0}% 100%` }}>
          <td>{sourceName(row)}<small>{sourceKind(row)}{rankHint(row.rank, row.rankSource) ? ` · ${rankHint(row.rank, row.rankSource)}` : ''} · ID {row.id}</small>{row.id === state.config.sourceId && <small>Selecionada no medidor individual</small>}</td>
          <td>{number(row.session.total)}<small>{row.session.hits} acertos</small></td><td>{percent(row.session.total, total)}</td>
          <td><button data-overlay-interactive className="overlay-source-expand" aria-label={`Ver detalhes de ${sourceName(row)}`}
            onClick={() => selectedConnection && setDetail({ connectionId: selectedConnection.id, sourceId: row.id })}>Ver detalhes ›</button></td>
        </tr>
      </React.Fragment>)}</tbody>
    </table>
      {!visible.length && <p className="meter-empty">{sources.length ? 'Nenhuma origem com esse nome ou ID.' : 'Aguardando eventos de dano nesta conexão…'}</p>}
    </div>
    <footer>Todas as origens com dano observado aparecem no ranking. “Perfil confirmado” e “Template confirmado” descrevem a evidência do nome; “ID pendente” não reduz nem exclui o dano. Os valores são cumulativos enquanto a leitura estiver ativa.</footer>
    </>}
  </section>
}
