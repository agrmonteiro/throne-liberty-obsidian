import React from 'react'

export function OverlayDragLabel({ label, locked = false }: { label: string; locked?: boolean }): React.ReactElement {
  return <span className="overlay-drag-label" title={locked ? 'Painel travado · Ctrl+Shift+F9 para mover' : 'Arraste esta barra para mover a janela'}>
    <svg className="overlay-drag-grip" viewBox="0 0 12 16" aria-hidden="true">
      {locked ? <><rect x="2" y="7" width="8" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4 7V4a2 2 0 0 1 4 0v3" fill="none" stroke="currentColor" strokeWidth="1.4" /></>
        : [4, 8, 12].flatMap(y => [3, 9].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" />))}
    </svg>
    <strong>{label}</strong>
  </span>
}
