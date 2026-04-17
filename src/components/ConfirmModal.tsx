import React, { useEffect, useRef } from 'react'

interface Props {
  open:          boolean
  title:         string
  message?:      string
  confirmLabel?: string
  cancelLabel?:  string
  danger?:       boolean
  onConfirm:     () => void
  onCancel:      () => void
}

export function ConfirmModal({
  open, title, message,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  danger = false, onConfirm, onCancel,
}: Props): React.ReactElement | null {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Auto-focus confirm button when opened
  useEffect(() => {
    if (open) setTimeout(() => confirmRef.current?.focus(), 50)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const dangerColor  = '#f25f5c'
  const dangerBg     = 'rgba(242,95,92,0.12)'
  const dangerBorder = 'rgba(242,95,92,0.4)'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'tl-modal-fade 0.15s ease',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${danger ? dangerBorder : 'var(--border-gold)'}`,
          borderRadius: 12,
          padding: '2rem 2.25rem',
          minWidth: 320,
          maxWidth: 460,
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${danger ? 'rgba(242,95,92,0.08)' : 'rgba(212,175,55,0.08)'}`,
          animation: 'tl-modal-slide 0.18s ease',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '0.9rem', lineHeight: 1 }}>
          {danger ? '⚠️' : '❓'}
        </div>

        {/* Title */}
        <div
          id="confirm-modal-title"
          style={{
            fontFamily: 'Noto Serif, serif',
            color: danger ? dangerColor : 'var(--gold-l)',
            fontSize: '1.05rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: message ? '0.6rem' : '1.5rem',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            color: 'var(--text-soft)',
            fontSize: '0.82rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            lineHeight: 1.55,
          }}>
            {message}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
          <button
            className="tl-btn-ghost"
            onClick={onCancel}
            style={{ minWidth: 90, padding: '0.5rem 1.1rem' }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: danger ? dangerBg : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-l) 100%)',
              border: `1px solid ${danger ? dangerBorder : 'var(--gold)'}`,
              borderRadius: 6,
              color: danger ? dangerColor : '#0b0c0e',
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.5rem 1.1rem',
              cursor: 'pointer',
              minWidth: 90,
              boxShadow: danger ? '0 0 14px rgba(242,95,92,0.25)' : '0 0 14px rgba(212,175,55,0.22)',
              transition: 'filter 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter    = 'brightness(1.12)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter    = ''
              e.currentTarget.style.transform = ''
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tl-modal-fade  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tl-modal-slide { from { opacity: 0; transform: translateY(14px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}
