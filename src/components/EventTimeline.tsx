import React from 'react'

export interface TimelineEvent { id: string; time: number; label: string; detail?: string; tone?: 'damage' | 'healing' | 'buff' | 'state' }
export function TimelineToggle({ active, onClick }: { active: boolean; onClick: () => void }): React.ReactElement {
  return <button aria-pressed={active} title="Alternar lista e linha do tempo" onClick={onClick}>{active ? 'Lista' : 'Linha do tempo'}</button>
}
/** Linha temporal proporcional, exclusiva para dados com instante observado. */
export function EventTimeline({ events, ariaLabel = 'Linha do tempo dos eventos' }: { events: TimelineEvent[]; ariaLabel?: string }): React.ReactElement {
  if (!events.length) return <p className="overlay-note">Nenhum evento neste filtro.</p>
  const ordered = [...events].sort((a,b) => a.time - b.time), start = ordered[0].time, end = ordered.at(-1)!.time, duration = Math.max(.001, end - start)
  return <div className="event-timeline" role="list" aria-label={ariaLabel}><div className="event-timeline-axis"><time>{start.toFixed(3)} s</time><span /><time>{end.toFixed(3)} s</time></div><ol>
    {ordered.map(event => <li key={event.id} role="listitem" className={event.tone ? `is-${event.tone}` : ''} style={{ '--event-position': `${(event.time - start) / duration * 100}%` } as React.CSSProperties}>
      <i aria-hidden="true" /><div><time>{event.time.toFixed(3)} s</time><strong>{event.label}</strong>{event.detail && <small>{event.detail}</small>}</div>
    </li>)}
  </ol></div>
}
