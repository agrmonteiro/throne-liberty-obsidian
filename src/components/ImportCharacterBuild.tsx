import React, { useEffect, useRef, useState } from 'react'
import { useBuilds } from '../store/useBuilds'
import { characterStatRows, importCharacterSnapshot, type CharacterStatsResult } from '../engine/characterStats'
import type { Build } from '../engine/types'

export function ImportCharacterBuild({ onImported, readRequest = 0 }: { onImported: (build: Build) => void; readRequest?: number }): React.ReactElement {
  const { builds,createEmpty,saveBuild,setActive } = useBuilds()
  const [data,setData] = useState<CharacterStatsResult | null>(null), [error,setError] = useState(''), [busy,setBusy] = useState(false)
  const [selected,setSelected] = useState(''), [target,setTarget] = useState(''), [attack,setAttack] = useState<''|'melee'|'ranged'|'magic'>('')
  const sectionRef = useRef<HTMLElement>(null)
  const snapshots = data ? [data.live,...data.saved.filter(row=>row.id!==data.live?.id)].filter((row): row is NonNullable<typeof row> => Boolean(row)) : []
  const snapshot = snapshots.find(row=>row.id===selected) ?? snapshots[0]
  const rows = snapshot ? characterStatRows(snapshot) : []
  async function read(): Promise<void> {
    setBusy(true);setError('')
    try {
      const result = await window.overlayAPI.characterStats()
      setData(result)
      setSelected(result.live?.id ?? result.saved[0]?.id ?? '')
      if (result.error) setError(result.error)
      else if (!result.live && !result.saved.length) setError('Nenhuma ficha recebida. Inicie a leitura nos overlays e entre no personagem. Uma troca de equipamento também pode fornecer parte dos atributos.')
    } catch { setError('Não foi possível consultar a ficha. Abra pelo aplicativo desktop atualizado.') }
    finally { setBusy(false) }
  }
  useEffect(() => {
    if (!readRequest) return
    sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    void read()
  }, [readRequest])
  async function save(): Promise<void> {
    if (!snapshot) return
    setBusy(true);setError('')
    try {
      const base = target ? builds[target] : createEmpty(`${snapshot.playerName} · ficha ${new Date(snapshot.observedAt*1000).toLocaleDateString('pt-BR')}`)
      if (!base) throw Error('Build de destino não encontrada.')
      const build = importCharacterSnapshot(base,snapshot,attack)
      await saveBuild(build);setActive(build.id);onImported(build)
    } catch(error) { setError(String(error)) }
    finally { setBusy(false) }
  }
  return <section ref={sectionRef} className="tl-panel" style={{marginBottom:'1.25rem'}} aria-label="Importar atributos do jogo">
    <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}><div style={{flex:1,minWidth:230}}>
      <div className="tl-eyebrow">Importar do jogo · experimental</div><p style={{fontSize:12,color:'var(--text-muted)'}}>Lê os atributos recebidos nos pacotes do personagem. Valores podem incluir buffs.</p>
    </div><button className="tl-btn" disabled={busy} onClick={()=>void read()}>{busy ? 'Lendo…' : 'Ler ficha do jogo'}</button></div>
    {error && <p role="alert" style={{fontSize:12}}>{error}</p>}
    {data && !data.live && Boolean(data.pending?.length) && <p role="status" style={{fontSize:12,color:'var(--text-muted)'}}>
      A coleta recebeu atributos nesta sessão: {data.pending!.map(row=>`${row.fields} status em ${row.connectionId} (${new Date(row.observedAt*1000).toLocaleTimeString('pt-BR')})`).join('; ')}.
      {' '}Falta vincular esses dados ao perfil nominal do personagem para importar com segurança.</p>}
    {data && !data.live && snapshot && <p role="status" style={{fontSize:12,color:'var(--text-muted)'}}>A ficha atual ainda não foi identificada. A leitura selecionada é uma captura salva de {new Date(snapshot.observedAt*1000).toLocaleString('pt-BR')}.</p>}
    {snapshot && <div style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><label style={{flex:1,minWidth:220}}>Leitura<select className="tl-input" aria-label="Leitura da ficha" value={snapshot.id} onChange={event=>setSelected(event.target.value)}>
        {snapshots.map(row=><option key={row.id} value={row.id}>{row.id===data?.live?.id ? 'Atual' : 'Captura salva'} · {row.playerName} · {new Date(row.observedAt*1000).toLocaleString('pt-BR')}</option>)}</select></label>
        <label>Destino<select className="tl-input" aria-label="Destino da ficha" value={target} onChange={event=>setTarget(event.target.value)}><option value="">Criar nova build</option>{Object.values(builds).map(build=><option key={build.id} value={build.id}>{build.name}</option>)}</select></label>
        <label>Tipo de dano para a calculadora<select className="tl-input" aria-label="Tipo de dano da ficha" value={attack} onChange={event=>setAttack(event.target.value as typeof attack)}><option value="">Preservar crítico/pesado atuais</option><option value="melee">Corpo a corpo</option><option value="ranged">À distância</option><option value="magic">Mágico</option></select></label></div>
      <p style={{fontSize:12,color:'var(--text-muted)'}}>{rows.length} status observados · {rows.filter(row=>row.mapped).length} com rótulos do catálogo. Campos ausentes não serão preenchidos. Nomes/escalas são experimentais; a leitura não garante toda a ficha.</p>
      <details><summary>Conferir valores recebidos</summary><div style={{maxHeight:280,overflow:'auto'}}><table style={{width:'100%',fontSize:12}}><thead><tr><th style={{textAlign:'left'}}>Status</th><th>Valor</th><th>ID</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.name}</td><td style={{textAlign:'center'}}>{row.display}</td><td style={{textAlign:'center'}}>{row.id}</td></tr>)}</tbody></table></div></details>
      <button className="tl-btn" disabled={busy} onClick={()=>void save()} style={{marginTop:12}}>{target ? 'Complementar build com a ficha' : 'Criar build com a ficha'}</button>
    </div>}
  </section>
}
