import React, { useState } from 'react'
import type { Rotation, RazerMacro, RazerMacroEvent } from '../engine/types'
import { MACRO_KEYS, parseRazerMacro, scheduleRazerMacro, serializeRazerMacro } from '../engine/razerMacro'

interface Props {
  rotation: Rotation
  onChange: (macro: RazerMacro) => void
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,92,252,0.25)',
  borderRadius: 4, color: 'var(--text)', padding: '4px 6px', fontSize: '0.75rem',
}
const buttonStyle: React.CSSProperties = {
  background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.3)',
  borderRadius: 4, color: 'var(--violet-l)', padding: '5px 9px', cursor: 'pointer', fontSize: '0.73rem',
}

const defaults: Record<string, string> = {
  '1': 'Quebra de Limite', '2': 'Marca Mortal', '3': 'Puxão do Zéfiro',
  '4': 'Bênção da Natureza', '5': 'Vórtice de Flechas', '6': 'Olho de Ventius',
  '7': 'Toque de Cura', '8': 'Flecha Brutal', '9': 'Ataque Rasante',
  '0': 'Eclipse de Sangue', '-': 'Flecha Aprisionadora', '=': 'Luar Brilhante',
  E: 'Ataque básico',
}

export function RazerMacroPanel({ rotation, onChange }: Props): React.ReactElement {
  const macro = rotation.razerMacro
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  function update(patch: Partial<RazerMacro>): void {
    if (!macro) return
    onChange({ ...macro, ...patch })
    setStatus('')
  }

  async function importXml(): Promise<void> {
    setBusy(true)
    try {
      const picked = await window.dataAPI.importRazerMacro()
      if (!picked) return
      const parsed = parseRazerMacro(picked.xml)
      const labels = parsed.name === 'TL_MV_V1' ? { ...defaults, ...macro?.keyLabels } : macro?.keyLabels ?? {}
      onChange({ ...parsed, keyLabels: { ...labels } })
      setStatus(`${parsed.events.length} toques importados de ${picked.name}.`)
    } catch (error) {
      setStatus(`Falha na importação: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function exportXml(): Promise<void> {
    if (!macro) return
    setBusy(true)
    try {
      const xml = serializeRazerMacro(macro)
      const saved = await window.dataAPI.exportRazerMacro(xml, macro.name)
      if (saved.ok) setStatus(`XML salvo em ${saved.path}.`)
      else if (saved.error) setStatus(`Falha na exportação: ${saved.error}`)
    } catch (error) {
      setStatus(`Falha na exportação: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  function updateEvent(index: number, patch: Partial<RazerMacroEvent>): void {
    if (!macro) return
    update({ events: macro.events.map((event, i) => i === index ? { ...event, ...patch } : event) })
  }

  let preview: ReturnType<typeof scheduleRazerMacro> | null = null
  let previewError = ''
  if (macro) {
    try { preview = scheduleRazerMacro(macro) }
    catch (error) { previewError = error instanceof Error ? error.message : String(error) }
  }
  const effectiveAt: Record<number, number> = {}
  preview?.sourceIndices.forEach((sourceIndex, index) => { effectiveAt[sourceIndex] = preview!.events[index].atMs })

  return (
    <section style={{ background: 'var(--bg-panel)', border: '1px solid rgba(124,92,252,0.18)', borderRadius: 8, padding: '0.75rem' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ color: 'var(--gold)', fontSize: '0.78rem', marginRight: 'auto' }}>Macro Razer · {macro ? `${macro.events.length} toques` : 'sem arquivo'}</strong>
        <button style={buttonStyle} disabled={busy} onClick={importXml}>Importar XML</button>
        {!macro && <button style={buttonStyle} onClick={() => onChange({ name: 'TL_R1', durationMs: 1000, events: [{ atMs: 0, key: 'E', holdMs: 30 }], keyLabels: { ...defaults } })}>Criar vazia</button>}
        <button style={buttonStyle} disabled={busy || !macro} onClick={exportXml}>Exportar XML</button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', margin: '6px 0 8px' }}>
        A macro fica salva nesta rotação. Os toques são tentativas; a estimativa de DPS da Timeline não os considera acertos confirmados.
      </p>
      {status && <div role="status" style={{ color: status.includes('Falha') || status.includes('Associe') ? 'var(--red)' : 'var(--green)', fontSize: '0.72rem', marginBottom: 8 }}>{status}</div>}
      {previewError && <div role="alert" style={{ color: 'var(--red)', fontSize: '0.72rem', marginBottom: 8 }}>{previewError}</div>}
      {macro && <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 9, fontSize: '0.72rem' }}>
          <label>Nome <input aria-label="Nome da macro" value={macro.name} maxLength={40} onChange={event => update({ name: event.target.value })} style={{ ...inputStyle, width: 130, marginLeft: 4 }} /></label>
          <label>Ciclo (ms) <input aria-label="Duração do ciclo em milissegundos" type="number" min={1} max={3600000} value={macro.durationMs} onChange={event => update({ durationMs: Number(event.target.value) })} style={{ ...inputStyle, width: 95, marginLeft: 4 }} /></label>
          <label>Intervalo geral (ms) <input aria-label="Intervalo mínimo geral em milissegundos" type="number" min={0} max={60000} value={macro.globalGapMs ?? 0} onChange={event => update({ globalGapMs: Number(event.target.value) })} style={{ ...inputStyle, width: 80, marginLeft: 4 }} /></label>
          <span style={{ color: 'var(--gold-l)' }}>Ciclo exportado: {preview ? (preview.durationMs / 1000).toFixed(2) : '—'} s</span>
          <span style={{ color: 'var(--text-muted)' }}>Repetição contínua configurada no Synapse.</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', margin: '0 0 8px' }}>
          O intervalo geral é o mínimo entre soltar uma tecla e pressionar a próxima. O extra de cada linha aumenta a pausa antes daquele toque e desloca os seguintes.
        </p>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', marginBottom: 5 }}>Teclas e habilidades desta rotação</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
          {MACRO_KEYS.map(key => <label key={key} style={{ fontSize: '0.68rem', color: 'var(--text-soft)' }}>
            {key} <input aria-label={`Habilidade na tecla ${key}`} list="macro-skill-names" value={macro.keyLabels[key] ?? ''}
              onChange={event => update({ keyLabels: { ...macro.keyLabels, [key]: event.target.value } })}
              placeholder="Habilidade" style={{ ...inputStyle, width: 135 }} />
          </label>)}
          <datalist id="macro-skill-names">
            {[...rotation.skills.map(skill => skill.skillName), ...(rotation.buffs ?? []).map(buff => buff.buffName), ...(rotation.dots ?? []).map(dot => dot.dotName)]
              .filter(Boolean).map((name, index) => <option key={`${name}-${index}`} value={name} />)}
          </datalist>
        </div>
        <div style={{ maxHeight: 225, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.71rem' }}>
            <thead><tr style={{ color: 'var(--text-soft)', textAlign: 'left' }}><th>Base (ms)</th><th>Tecla</th><th>Toque (ms)</th><th>Extra (ms)</th><th>Saída (ms)</th><th>Habilidade</th><th /></tr></thead>
            <tbody>{macro.events.map((event, index) => <tr key={index} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <td><input aria-label={`Início do toque ${index + 1}`} type="number" min={0} value={event.atMs} onChange={e => updateEvent(index, { atMs: Number(e.target.value) })} style={{ ...inputStyle, width: 85 }} /></td>
              <td><select aria-label={`Tecla do toque ${index + 1}`} value={event.key} onChange={e => updateEvent(index, { key: e.target.value })} style={inputStyle}>{MACRO_KEYS.map(key => <option key={key} value={key}>{key}</option>)}</select></td>
              <td><input aria-label={`Duração do toque ${index + 1}`} type="number" min={1} value={event.holdMs} onChange={e => updateEvent(index, { holdMs: Number(e.target.value) })} style={{ ...inputStyle, width: 75 }} /></td>
              <td><input aria-label={`Intervalo extra antes do toque ${index + 1}`} type="number" min={0} max={60000} value={event.extraGapMs ?? 0} onChange={e => updateEvent(index, { extraGapMs: Number(e.target.value) })} style={{ ...inputStyle, width: 75 }} /></td>
              <td style={{ color: 'var(--gold-l)' }}>{effectiveAt[index] ?? '—'}</td>
              <td style={{ color: 'var(--text-muted)' }}>{macro.keyLabels[event.key] || '—'}</td>
              <td><button aria-label={`Remover toque ${index + 1}`} onClick={() => update({ events: macro.events.filter((_, i) => i !== index) })} style={{ ...buttonStyle, color: 'var(--red)', padding: '2px 7px' }}>×</button></td>
            </tr>)}</tbody>
          </table>
        </div>
        <button style={{ ...buttonStyle, marginTop: 7 }} onClick={() => update({ events: [...macro.events, { atMs: Math.max(0, Math.min(macro.durationMs - 30, (macro.events[macro.events.length - 1]?.atMs ?? 0) + 100)), key: 'E', holdMs: 30 }] })}>+ Toque</button>
      </>}
    </section>
  )
}
