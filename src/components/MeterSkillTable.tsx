import React, { useId, useState } from 'react'
import { analyzeRows, hitAverage, metricData, metricRate, type AnalysisRow, type MeterSort, type MetricPage } from '../engine/overlayAnalysis'
import type { OverlayState } from '../engine/overlayMeter'
import { healingDescriptionTitle } from '../engine/overlayHealingClassification'
import { MeterSkillIcon } from './MeterSkillIcon'
import { damageKinds, duration, number, percentage } from './meterFormatting'
import { overlayDescriptiveSkillIds } from '../engine/overlaySkillReference'

function rowBar(row: AnalysisRow, maximum: number, healing: boolean): React.CSSProperties {
  let offset = 0
  const stops = damageKinds.map(kind => {
    const start = offset
    offset += row.damage && row.damageByKind ? row.damageByKind[kind.key] / row.damage * 100 : 0
    return `color-mix(in srgb, ${kind.color} 32%, transparent) ${start}% ${offset}%`
  })
  return { backgroundImage: !healing && row.damageByKind ? `linear-gradient(to right, ${stops.join(', ')})`
    : 'linear-gradient(to right, color-mix(in srgb, var(--meter-accent) 20%, transparent), color-mix(in srgb, var(--meter-accent) 20%, transparent))',
  backgroundSize: `${maximum ? row.damage / maximum * 100 : 0}% 100%` }
}

function SkillDetails({ row, state, page, onClose }: {
  row: AnalysisRow; state: OverlayState; page: MetricPage; onClose: () => void
}): React.ReactElement {
  const data = metricData(state.session, page)
  const healing = data.healing
  const critical = row.critical ?? 0, heavy = row.heavy ?? 0
  return <section className="meter-skill-details" data-overlay-interactive aria-label={`Detalhes de ${row.name}`}>
    <header><button type="button" onClick={onClose} aria-label="Voltar à lista">← Voltar</button>
      <span>{duration(state.session.elapsedSec)} de medição</span></header>
    <h3>{page !== 'receivedSources' && <MeterSkillIcon name={row.name} iconFile={row.iconFile} />}{row.name}</h3>
    <dl className="meter-detail-stats">
      <div><dt>{healing ? 'Cura bruta' : 'Dano'}</dt><dd>{number(row.damage)}</dd></div>
      <div><dt>{data.rateLabel} médio</dt><dd>{number(metricRate(row.damage, state.session.elapsedSec))}</dd></div>
      <div><dt>Participação</dt><dd>{percentage(row.damage, data.total)}</dd></div>
      <div><dt>{healing ? 'Aplicações' : 'Acertos'}</dt><dd>{number(row.hits)}</dd></div>
      <div><dt>{healing ? 'Média por aplicação' : 'Média por acerto'}</dt><dd>{number(hitAverage(row))}</dd></div>
      {!healing && row.critical !== undefined && <>
        <div><dt>Críticos</dt><dd>{number(critical)} <small>({percentage(critical, row.hits)})</small></dd></div>
        <div><dt>Pesados</dt><dd>{number(heavy)} <small>({percentage(heavy, row.hits)})</small></dd></div>
      </>}
    </dl>
    {!healing && row.damageByKind && <div className="meter-detail-breakdown" aria-label="Distribuição do dano">
      {damageKinds.map(kind => <div key={kind.key}>
        <span><i style={{ background: kind.color }} />{kind.label}</span>
        <strong>{number(row.damageByKind![kind.key])}</strong><small>{percentage(row.damageByKind![kind.key], row.damage)}</small>
      </div>)}
      <p>Crítico pesado participa dos dois contadores; o dano acima é separado em quatro parcelas.</p>
    </div>}
    {healing && <p className="meter-detail-description">{healingDescriptionTitle(row.skillIds)}
      <br />Cura bruta experimental. Cura efetiva e excesso de cura ainda não medidos.</p>}
    {row.skillIds?.some(id => overlayDescriptiveSkillIds.has(id)) && <p className="meter-detail-description">
      Nome descritivo do ataque: esta habilidade de NPC não possui um nome de exibição traduzido no catálogo do jogo.</p>}
    <p className="meter-detail-ids">{page === 'receivedSources' ? 'Fonte' : 'IDs'}: {row.skillIds?.join(', ') ?? row.key}</p>
  </section>
}

function SourceSkills({ row, state, target }: { row: AnalysisRow; state: OverlayState; target: boolean }): React.ReactElement {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const skills = row.sourceSkills
  if (!skills) return <p className="meter-source-legacy" role="status">
    Este registro não guardou as habilidades separadas {target ? 'por alvo' : 'por fonte'}. Novas medições incluem esse detalhamento.</p>
  const sourceState: OverlayState = { ...state, session: { ...state.session,
    received: { total: row.damage, hits: row.hits, skills, sources: [] } } }
  const selected = skills.find(skill => skill.key === selectedKey)
  if (selected) return <SkillDetails row={selected} state={sourceState} page="receivedSkills" onClose={() => setSelectedKey(null)} />
  let accumulated = 0
  return <div className="meter-source-skills" role="region" aria-label={`Habilidades de ${row.name}`}>
    <header><strong>Habilidades {target ? 'neste alvo' : 'desta fonte'}</strong><span>{number(row.damage)} de dano · {skills.length} {skills.length === 1 ? 'habilidade' : 'habilidades'}</span></header>
    <div className="meter-source-skills-scroll"><table className="meter-table meter-analysis-table meter-source-skills-table" aria-label={`Distribuição por habilidade de ${row.name}`}><tbody>
      {skills.map(skill => {
        const start = row.damage > 0 ? Math.min(100, accumulated / row.damage * 100) : 0
        accumulated += skill.damage
        const size = row.damage > 0 ? Math.max(0, Math.min(100 - start, skill.damage / row.damage * 100)) : 0
        return <tr key={skill.key} className="meter-source-step-row" data-step-bar={size > 0 ? 'true' : undefined}
          style={{ '--step-start': `${start}%`, '--step-size': `${size}%` } as React.CSSProperties}
          title={`${skill.name} · ${number(skill.damage)} de dano · ${percentage(skill.damage, row.damage)} ${target ? 'do alvo' : 'da fonte'}`}>
          <td>{size > 0 && <span className="meter-source-step-bar" aria-hidden="true" />}<button type="button" data-overlay-interactive className="meter-row-button"
          aria-label={`Ver detalhes de ${skill.name} de ${row.name}`} title={`${skill.name} · IDs ${skill.skillIds?.join(', ') ?? skill.key}`}
          onClick={() => setSelectedKey(skill.key)}>
            <MeterSkillIcon name={skill.name} iconFile={skill.iconFile} /><span className="meter-skill-name">{skill.name}</span>
            <span className="meter-row-chevron" aria-hidden="true">›</span>
          </button></td>
          <td>{number(skill.damage)}</td><td title={target ? 'Participação no dano deste alvo' : 'Participação no dano desta fonte'}>{percentage(skill.damage, row.damage)}</td>
          <td>{number(metricRate(skill.damage, state.session.elapsedSec))}</td><td>{number(skill.hits)}</td><td>{number(hitAverage(skill))}</td>
        </tr>
      })}
    </tbody></table></div>
    {!skills.length && <p className="meter-source-legacy">Nenhuma habilidade registrada {target ? 'para este alvo' : 'para esta fonte'}.</p>}
  </div>
}

export function MeterSkillTable({ state, page, emptyMessage }: {
  state: OverlayState; page: MetricPage; emptyMessage: string
}): React.ReactElement {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: MeterSort; ascending: boolean }>({ key: 'damage', ascending: false })
  const [selection, setSelection] = useState<{ scope: string; key: string } | null>(null)
  const [expanded, setExpanded] = useState<{ scope: string; keys: Set<string> }>({ scope: '', keys: new Set() })
  const searchId = useId()
  const data = metricData(state.session, page)
  const rows = analyzeRows(data.rows, query, sort.key, sort.ascending)
  const scope = `${page}:${state.config.sourceId}:${state.session.startedAt}`
  const selected = selection?.scope === scope ? data.rows.find(row => row.key === selection.key) : undefined
  const maximum = Math.max(0, ...data.rows.map(row => row.damage))
  const changeSort = (key: MeterSort): void => setSort(previous => ({ key,
    ascending: previous.key === key ? !previous.ascending : key === 'name' }))
  const toggleSource = (key: string): void => setExpanded(previous => {
    const keys = previous.scope === scope ? new Set(previous.keys) : new Set<string>()
    if (keys.has(key)) keys.delete(key)
    else keys.add(key)
    return { scope, keys }
  })
  const header = (key: MeterSort, label: string): React.ReactElement => <th aria-sort={sort.key === key ? sort.ascending ? 'ascending' : 'descending' : 'none'}>
    <button type="button" data-overlay-interactive onClick={() => changeSort(key)} aria-label={`Ordenar por ${label}`}>
      {label}{sort.key === key && <span aria-hidden="true">{sort.ascending ? ' ↑' : ' ↓'}</span>}</button></th>
  return selected ? <SkillDetails row={selected} state={state} page={page} onClose={() => setSelection(null)} /> : <>
    <div className="meter-analysis-tools">
      <label htmlFor={searchId} className="meter-search-label">Buscar</label>
      <input data-overlay-interactive id={searchId} type="search" aria-label="Buscar habilidade ou fonte" placeholder="Nome ou ID"
        value={query} onChange={event => setQuery(event.target.value)} />
      <span aria-live="polite">{rows.length}/{data.rows.length}</span>
    </div>
    <div className="meter-skills-scroll"><table className="meter-table meter-analysis-table">
      <thead><tr>{header('name', page === 'receivedSources' ? 'Fonte' : page === 'damageTargets' ? 'Alvo' : 'Habilidade')}
        {header('damage', data.healing ? 'Cura' : 'Dano')}<th>%</th><th title="Contribuição por segundo usando a duração completa da medição">{data.rateLabel}</th>
        {header('hits', data.healing ? 'Aplic.' : 'Acertos')}{header('average', 'Média')}</tr></thead>
      <tbody>{rows.map(row => {
        const source = page === 'receivedSources' || page === 'damageTargets'
        const open = source && expanded.scope === scope && expanded.keys.has(row.key)
        const detailId = `${searchId}-source-${row.key}`
        return <React.Fragment key={row.key}><tr className={open ? 'meter-source-expanded' : undefined} style={rowBar(row, maximum, data.healing)}>
        <td><button type="button" data-overlay-interactive className="meter-row-button"
          aria-label={source ? `${open ? 'Recolher' : 'Expandir'} habilidades de ${row.name}` : `Ver detalhes de ${row.name}`}
          aria-expanded={source ? open : undefined} aria-controls={open ? detailId : undefined}
          title={`${row.name} · ${row.skillIds?.join(', ') ?? row.key} · ${source ? 'Expandir ou recolher habilidades' : 'Clique para detalhar'}`}
          onClick={() => source ? toggleSource(row.key) : setSelection({ scope, key: row.key })}>
          {!source && <MeterSkillIcon name={row.name} iconFile={row.iconFile} />}
          <span className="meter-skill-name">{row.name}</span><span className="meter-row-chevron" aria-hidden="true">{source ? open ? '▾' : '▸' : '›'}</span></button></td>
        <td>{number(row.damage)}</td><td>{percentage(row.damage, data.total)}</td>
        <td>{number(metricRate(row.damage, state.session.elapsedSec))}</td><td>{number(row.hits)}</td><td>{number(hitAverage(row))}</td>
      </tr>{open && <tr className="meter-source-detail" id={detailId}><td colSpan={6}>
        <SourceSkills row={row} state={state} target={page === 'damageTargets'} />
      </td></tr>}</React.Fragment>})}</tbody>
    </table>
    {!rows.length && <div className="meter-empty" role="status">{data.rows.length ? 'Nenhum resultado. Tente outro nome ou ID.' : emptyMessage}</div>}
    </div>
  </>
}
