import React, { useEffect, useState } from 'react'
import { RazerMacroPanel } from '../components/RazerMacroPanel'
import { useRotation } from '../store/useRotation'
import { useT } from '../i18n/useT'

export function Macro(): React.ReactElement {
  const t = useT()
  const { rotations, activeRotationId, loading, loadFromDisk, createEmpty, setActive, saveRotation } = useRotation()
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const state = useRotation.getState()
    if (!state.loading && Object.keys(state.rotations).length === 0) void loadFromDisk()
  }, [loadFromDisk])

  const selectedId = activeRotationId && rotations[activeRotationId]
    ? activeRotationId
    : Object.keys(rotations)[0] ?? ''
  const rotation = rotations[selectedId]

  function handleCreate(): void {
    createEmpty(newName.trim() || t('rotation.sidebar.newRotation'))
    setNewName('')
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '2.5rem 1.25rem 1.25rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--gold-l)', fontSize: '1.35rem' }}>Macro Razer</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Importe, ajuste e exporte os pressionamentos da macro da rotação selecionada.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-soft)', fontSize: '0.75rem' }}>
            Rotação
            <select aria-label="Rotação da macro" value={selectedId} disabled={!rotation}
              onChange={event => setActive(event.target.value)}
              style={{ minWidth: 220, padding: '7px 9px', borderRadius: 4, color: 'var(--text)', background: 'var(--bg-panel)', border: '1px solid rgba(124,92,252,0.3)' }}>
              {!rotation && <option value="">Nenhuma rotação</option>}
              {Object.values(rotations).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-soft)', fontSize: '0.75rem' }}>
            Nova rotação
            <input aria-label="Nome da nova rotação" value={newName} disabled={loading} onChange={event => setNewName(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') handleCreate() }}
              placeholder={t('rotation.sidebar.rotationName')}
              style={{ minWidth: 210, padding: '7px 9px', borderRadius: 4, color: 'var(--text)', background: 'var(--bg-panel)', border: '1px solid rgba(124,92,252,0.3)' }} />
          </label>
          <button onClick={handleCreate} disabled={loading} style={{ padding: '7px 11px', borderRadius: 4, cursor: 'pointer', color: 'var(--gold-l)', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
            + {t('rotation.sidebar.newRotation')}
          </button>
        </div>

        {rotation ? (
          <RazerMacroPanel key={rotation.id} rotation={rotation} onChange={razerMacro => {
            const current = useRotation.getState().rotations[rotation.id]
            if (current) void saveRotation({ ...current, razerMacro })
          }} />
        ) : (
          <div style={{ padding: '2rem', border: '1px solid rgba(124,92,252,0.18)', borderRadius: 8, color: 'var(--text-muted)' }}>
            {loading ? 'Carregando rotações…' : 'Crie uma rotação para começar a editar a macro.'}
          </div>
        )}
      </div>
    </div>
  )
}
