/** Marcadores manuais de fase associados a timestamps de segmentos de combate. */
export const MAX_PHASE_MARKER_TEXT_LENGTH = 80

export interface OverlayPhaseMarker {
  readonly segmentId: string | number
  readonly timestamp: number
  readonly text: string
}

function validSegmentId(value: unknown): value is string | number {
  return (typeof value === 'string' && value.trim().length > 0)
    || (typeof value === 'number' && Number.isSafeInteger(value))
}

function validText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
    && value.trim().length <= MAX_PHASE_MARKER_TEXT_LENGTH
}

function snapshot(marker: OverlayPhaseMarker): OverlayPhaseMarker {
  return Object.freeze({ ...marker })
}

/** Armazena exclusivamente anotações explícitas do usuário; não classifica fases. */
export class OverlayPhaseMarkers {
  private readonly bySegment = new Map<string | number, Map<number, OverlayPhaseMarker>>()

  /** Cria ou substitui o marcador localizado pelo par (segmentId, timestamp). */
  setMarker(segmentId: string | number, timestamp: number, text: string): OverlayPhaseMarker | null {
    if (!validSegmentId(segmentId) || !Number.isFinite(timestamp) || timestamp < 0 || !validText(text)) return null
    let segment = this.bySegment.get(segmentId)
    if (!segment) { segment = new Map(); this.bySegment.set(segmentId, segment) }
    const marker = snapshot({ segmentId, timestamp, text: text.trim() })
    segment.set(timestamp, marker)
    return snapshot(marker)
  }

  /** Edita apenas um marcador existente no timestamp informado. */
  editMarker(segmentId: string | number, timestamp: number, text: string): OverlayPhaseMarker | null {
    if (!this.bySegment.get(segmentId)?.has(timestamp)) return null
    return this.setMarker(segmentId, timestamp, text)
  }

  /** Remove um marcador específico, sem afetar outros segmentos ou timestamps. */
  removeMarker(segmentId: string | number, timestamp: number): boolean {
    const segment = this.bySegment.get(segmentId)
    if (!segment?.delete(timestamp)) return false
    if (segment.size === 0) this.bySegment.delete(segmentId)
    return true
  }

  getMarkers(segmentId: string | number): readonly OverlayPhaseMarker[] {
    const markers = [...(this.bySegment.get(segmentId)?.values() ?? [])]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(snapshot)
    return Object.freeze(markers)
  }

  snapshot(): readonly OverlayPhaseMarker[] {
    const markers: OverlayPhaseMarker[] = []
    for (const segmentId of this.bySegment.keys()) markers.push(...this.getMarkers(segmentId))
    markers.sort((a, b) => a.timestamp - b.timestamp || String(a.segmentId).localeCompare(String(b.segmentId)))
    return Object.freeze(markers.map(snapshot))
  }
}
