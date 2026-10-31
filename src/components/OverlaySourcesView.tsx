import React, { useState } from 'react'
import { number } from './MeterPanels'
import type { OverlayState } from '../engine/overlayMeter'

export function OverlaySourcesView({ state, compact = false }: { state: OverlayState; compact?: boolean }): React.ReactElement {
  const [search, setSearch] = useState('')
  const sources = state.sources.filter(row => row.damage > 0).sort((a, b) => b.damage - a.damage)
  const total = sources.reduce((sum, row) => sum + row.damage, 0)
  const maximum = sources[0]?.damage ?? 0
  const visible = sources.filter(row => `${row.id} ${row.name ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return <section id={compact ? undefined : 'overlay-sources'} className={`overlay-sources ${compact ? 'meter-panel compact' : ''}`} aria-label="Dano por origem">
    <header><strong>Dano por origem</strong><span>{state.mode === 'replay' ? 'REPRODUÇÃO' : 'LEITURA ATUAL'}</span></header>
    <div className="overlay-sources-intro"><p>{sources.length} origens · {number(total)} de dano observado na captura</p>
      <input aria-label="Buscar origem por nome ou ID" placeholder="Buscar nome ou ID" value={search} onChange={event => setSearch(event.target.value)} /></div>
    <div className="overlay-sources-scroll"><table>
      <thead><tr><th>Origem</th><th>Dano</th><th>%</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.id} style={{ backgroundSize: `${maximum ? row.damage / maximum * 100 : 0}% 100%` }}>
        <td>{row.name ?? `Origem ${row.id}`}{row.name && <small>ID {row.id}</small>}{row.id === state.config.sourceId && <small>Selecionada no medidor</small>}</td>
        <td>{number(row.damage)}</td><td>{total ? (row.damage / total * 100).toFixed(1).replace('.', ',') : '0'}%</td>
      </tr>)}</tbody>
    </table>
      {!visible.length && <p className="meter-empty">{sources.length ? 'Nenhuma origem com esse nome ou ID.' : 'Aguardando eventos de dano…'}</p>}
    </div>
    <footer>Nomes vêm dos perfis de jogador e dos templates de NPC recebidos nesta conexão. Fontes sem esses dados continuam identificadas pelo ID.
      {!compact && ' Acumulado desde o início da leitura; consultar ou buscar não altera a origem selecionada nem o seu medidor.'}</footer>
  </section>
}
