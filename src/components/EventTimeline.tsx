import React from 'react'

export interface TimelineEvent { id: string; time: number; label: string; detail?: string; tone?: 'damage' | 'healing' | 'buff' | 'state' }
export function TimelineToggle({ active, onClick }: { active: boolean; onClick: () => void }): React.ReactElement {
  return <button aria-pressed={active} title="Alternar lista e linha do tempo" onClick={onClick}>{active ? 'Lista' : 'Linha do tempo'}</button>
}
function timelineTime(value: number): string {
  return value >= 946684800 ? new Date(value * 1000).toLocaleTimeString('pt-BR') : `${value.toFixed(3)} s`
}
/** Linha temporal proporcional, exclusiva para dados com instante observado. */
export function EventTimeline({ events, ariaLabel = 'Linha do tempo dos eventos' }: { events: TimelineEvent[]; ariaLabel?: string }): React.ReactElement {
  if (!events.length) return <p className="overlay-note">Nenhum evento neste filtro.</p>
  const ordered = [...events].sort((a,b) => a.time - b.time), start = ordered[0].time, end = ordered.at(-1)!.time, duration = Math.max(.001, end - start)
  return <div className="event-timeline" role="list" aria-label={ariaLabel}><div className="event-timeline-axis"><time>{timelineTime(start)}</time><span /><time>{timelineTime(end)}</time></div><ol>
    {ordered.map(event => <li key={event.id} role="listitem" className={event.tone ? `is-${event.tone}` : ''} style={{ '--event-position': `${(event.time - start) / duration * 100}%` } as React.CSSProperties}>
      <i aria-hidden="true" /><div><time>{timelineTime(event.time)}</time><strong>{event.label}</strong>{event.detail && <small>{event.detail}</small>}</div>
    </li>)}
  </ol></div>
}
