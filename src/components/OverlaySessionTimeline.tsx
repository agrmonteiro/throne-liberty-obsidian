import React from 'react'
import type { OverlayCombatSegment } from '../engine/overlayMeter'
import { EventTimeline } from './EventTimeline'
import { duration } from './meterFormatting'

function segmentTarget(segment: OverlayCombatSegment): string {
  const target = segment.dominantTarget
  if (!target) return 'Combate sem alvo classificado'
  const rank = target.rank === 'boss' ? 'Chefe' : target.rank === 'champion' ? 'Champion'
    : target.rank === 'elite' ? 'Elite' : target.rank === 'normal' ? 'Normal' : 'Único'
  return `${target.name ?? `Alvo ${target.templateId}`} · ${rank}`
}

/**
 * A linha do tempo mostra segmentos confirmados pelo coletor: ela não deduz
 * fases a partir do DPS, portanto continua válida em leituras parciais.
 */
export function OverlaySessionTimeline({ segments, className = '' }: {
  segments?: OverlayCombatSegment[]; className?: string
}): React.ReactElement {
  const rows = [...(segments ?? [])].sort((a, b) => a.startedAt - b.startedAt)
  if (!rows.length) return <p className="overlay-note">Ainda não há fases de combate registradas nesta leitura.</p>
  const start = rows[0].startedAt
  return <section className={`overlay-session-timeline ${className}`.trim()} aria-label="Linha do tempo do combate">
    <header><strong>Linha do tempo</strong><span>{rows.length} {rows.length === 1 ? 'fase observada' : 'fases observadas'}</span></header>
    <EventTimeline ariaLabel="Fases observadas do combate" events={rows.map(segment => {
      const end = segment.endedAt ?? segment.lastActivityAt
      const elapsed = Math.max(0, (end - segment.startedAt) / 1000)
      return {
        id: String(segment.id), time: Math.max(0, (segment.startedAt - start) / 1000), tone: 'state' as const,
        label: segmentTarget(segment),
        detail: `${duration(elapsed)} · ${segment.events} eventos${segment.endReason === 'combat-exit' ? ' · saída de combate' : segment.endReason === 'inactivity' ? ' · inatividade' : ' · em andamento'}`,
      }
    })} />
  </section>
}
