import React, { useRef, useState } from 'react'

interface Props {
  /** Explicação principal — o que é o campo */
  help: string
  /** Onde achar o valor no jogo (opcional) */
  where?: string
}

const TIP_W = 280

/**
 * Ícone "?" com tooltip explicativo. Usa posição `fixed` calculada a partir do
 * bounding rect do ícone, então nunca é cortado por containers com overflow.
 */
export function HelpTip({ help, where }: Props): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  function show() {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left, window.innerWidth - TIP_W - 8))
    setPos({ x: left, y: r.bottom + 6 })
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        aria-label={help}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
          border: '1px solid var(--border)', color: 'var(--text-muted)',
          fontSize: 9, fontWeight: 700, cursor: 'help', userSelect: 'none', lineHeight: 1,
        }}
      >?</span>
      {pos && (
        <div
          role="tooltip"
          style={{
            position: 'fixed', left: pos.x, top: pos.y,
            maxWidth: TIP_W, zIndex: 10000, pointerEvents: 'none',
            background: 'var(--bg-panel, #14161f)', color: 'var(--text)',
            border: '1px solid var(--gold, #d4af37)', borderRadius: 6,
            padding: '0.5rem 0.65rem', fontSize: '0.72rem', lineHeight: 1.45,
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)', whiteSpace: 'normal',
          }}
        >
          <div>{help}</div>
          {where && (
            <div style={{ marginTop: 5, color: 'var(--gold-l, #f0cc55)' }}>
              <strong>📍 Onde achar:</strong> {where}
            </div>
          )}
        </div>
      )}
    </>
  )
}
