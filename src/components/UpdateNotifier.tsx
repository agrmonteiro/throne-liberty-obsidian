import React, { useEffect, useState } from 'react'

type State =
  | { phase: 'idle' }
  | { phase: 'available';   version: string }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready';       version: string }

export function UpdateNotifier(): React.ReactElement | null {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!window.updateAPI) return

    window.updateAPI.onAvailable(({ version }) => {
      setState({ phase: 'available', version })
      setDismissed(false)
    })

    window.updateAPI.onProgress(({ percent }) => {
      setState(prev => ({
        phase: 'downloading',
        version: 'version' in prev ? prev.version : '',
        percent,
      }))
    })

    window.updateAPI.onDownloaded(({ version }) => {
      setState({ phase: 'ready', version })
    })
  }, [])

  if (dismissed || state.phase === 'idle') return null

  // ── estilos compartilhados ────────────────────────────────────────────────
  const banner: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.6rem 1.25rem',
    background: 'rgba(72, 187, 120, 0.1)',
    borderBottom: '1px solid rgba(72, 187, 120, 0.3)',
    flexShrink: 0,
  }
  const text: React.CSSProperties = { fontSize: '0.82rem', color: '#68d391' }
  const btn: React.CSSProperties = {
    padding: '0.3rem 0.9rem', borderRadius: 5,
    border: '1px solid #48bb78',
    background: 'rgba(72, 187, 120, 0.15)', color: '#68d391',
    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
  }
  const closeBtn: React.CSSProperties = {
    marginLeft: 'auto', background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
  }

  // ── available ─────────────────────────────────────────────────────────────
  if (state.phase === 'available') {
    return (
      <div style={banner}>
        <span style={text}>
          ⬆ Nova versão disponível: <strong>v{state.version}</strong> — baixando em segundo plano…
        </span>
        <button style={closeBtn} onClick={() => setDismissed(true)}>×</button>
      </div>
    )
  }

  // ── downloading ───────────────────────────────────────────────────────────
  if (state.phase === 'downloading') {
    return (
      <div style={banner}>
        <span style={text}>
          ⬇ Baixando v{state.version}… {state.percent}%
        </span>
        <div style={{
          flexGrow: 1, maxWidth: 180, height: 4, borderRadius: 2,
          background: 'rgba(72,187,120,0.2)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2, background: '#48bb78',
            width: `${state.percent}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    )
  }

  // ── ready to install ──────────────────────────────────────────────────────
  if (state.phase === 'ready') {
    return (
      <div style={banner}>
        <span style={text}>
          ✅ v{state.version} pronta para instalar!
        </span>
        <button style={btn} onClick={() => window.updateAPI?.install()}>
          Reiniciar e instalar →
        </button>
        <button style={closeBtn} onClick={() => setDismissed(true)}>×</button>
      </div>
    )
  }

  return null
}
