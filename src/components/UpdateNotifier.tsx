import React, { useEffect, useState } from 'react'
import { useT } from '../i18n/useT'

type State =
  | { phase: 'idle' }
  | { phase: 'available';   version: string }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready';       version: string }
  | { phase: 'error';       version: string }
  | { phase: 'stalled';     version: string }

export function UpdateNotifier(): React.ReactElement | null {
  const t = useT()
  const [state, setState] = useState<State>({ phase: 'idle' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!window.updateAPI) return

    const api = window.updateAPI

    api.onAvailable(({ version }) => {
      setState({ phase: 'available', version })
      setDismissed(false)
    })

    api.onProgress(({ percent }) => {
      setDismissed(false)
      setState(prev => ({
        phase: 'downloading',
        version: 'version' in prev ? prev.version : '',
        percent,
      }))
    })

    api.onDownloaded(({ version }) => {
      setState({ phase: 'ready', version })
      setDismissed(false)
    })

    api.onError(() => {
      setState(prev =>
        prev.phase === 'idle'
          ? prev  // erro no check silencioso (sidebar já trata)
          : { phase: 'error', version: 'version' in prev ? prev.version : '' }
      )
    })

    api.onStalled(() => {
      setState(prev => ({
        phase: 'stalled',
        version: 'version' in prev ? prev.version : '',
      }))
    })

    // sem cleanup de listeners: a preload já garante remoção ao re-registrar
  }, [])

  if (dismissed || state.phase === 'idle') return null

  // ── estilos compartilhados ────────────────────────────────────────────────
  const bannerGreen: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.6rem 1.25rem',
    background: 'rgba(72, 187, 120, 0.1)',
    borderBottom: '1px solid rgba(72, 187, 120, 0.3)',
    flexShrink: 0,
  }
  const bannerWarn: React.CSSProperties = {
    ...bannerGreen,
    background: 'rgba(245, 158, 11, 0.1)',
    borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
  }
  const textGreen: React.CSSProperties = { fontSize: '0.82rem', color: '#68d391' }
  const textWarn:  React.CSSProperties = { fontSize: '0.82rem', color: '#fbbf24' }
  const btn: React.CSSProperties = {
    padding: '0.3rem 0.9rem', borderRadius: 5,
    border: '1px solid #48bb78',
    background: 'rgba(72, 187, 120, 0.15)', color: '#68d391',
    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
  }
  const btnWarn: React.CSSProperties = {
    ...btn,
    border: '1px solid #f59e0b',
    background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24',
  }
  const closeBtn: React.CSSProperties = {
    marginLeft: 'auto', background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
  }

  // ── available ─────────────────────────────────────────────────────────────
  if (state.phase === 'available') {
    return (
      <div style={bannerGreen}>
        <span style={textGreen}>
          {t('update.available').replace('{version}', state.version)}
        </span>
        <button style={closeBtn} onClick={() => setDismissed(true)}>×</button>
      </div>
    )
  }

  // ── downloading ───────────────────────────────────────────────────────────
  if (state.phase === 'downloading') {
    return (
      <div style={bannerGreen}>
        <span style={textGreen}>{t('update.downloading').replace('{version}', state.version)}</span>
        <div style={{
          flexGrow: 1, maxWidth: 200, height: 6, borderRadius: 3,
          background: 'rgba(72,187,120,0.2)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3, background: '#48bb78',
            width: `${state.percent}%`, transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ ...textGreen, fontWeight: 700, minWidth: 38 }}>{state.percent}%</span>
      </div>
    )
  }

  // ── ready to install ──────────────────────────────────────────────────────
  if (state.phase === 'ready') {
    return (
      <div style={bannerGreen}>
        <span style={textGreen}>
          {t('update.ready').replace('{version}', state.version)}
        </span>
        <button style={btn} onClick={() => window.updateAPI?.install()}>
          {t('update.restart')}
        </button>
        <button style={closeBtn} onClick={() => setDismissed(true)}>×</button>
      </div>
    )
  }

  // ── stalled ───────────────────────────────────────────────────────────────
  if (state.phase === 'stalled') {
    return (
      <div style={bannerWarn}>
        <span style={textWarn}>{t('update.stalled')}</span>
        <button style={btnWarn} onClick={() => {
          setState({ phase: 'idle' })
          window.updateAPI?.checkNow()
        }}>
          {t('update.retry')}
        </button>
        <button style={closeBtn} onClick={() => setDismissed(true)}>×</button>
      </div>
    )
  }

  // ── error (durante download) ──────────────────────────────────────────────
  if (state.phase === 'error') {
    return (
      <div style={bannerWarn}>
        <span style={textWarn}>{t('update.error')}</span>
        <button style={btnWarn} onClick={() => {
          setState({ phase: 'idle' })
          window.updateAPI?.checkNow()
        }}>
          {t('update.retry')}
        </button>
        <button style={closeBtn} onClick={() => setDismissed(true)}>×</button>
      </div>
    )
  }

  return null
}
