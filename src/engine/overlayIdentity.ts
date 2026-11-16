export interface OverlayPlayerIdentity {
  sourceId: number; connectionId: string; observedAt: number; method: 'local-state' | 'profile-name' | 'status-profile' | 'solo-damage'
}

/** Identidade local usa perfil/estado quando disponíveis. O fallback solo só é
 * aplicado depois de uma curta janela sem outro atacante e pode ser corrigido
 * por um perfil nominal posterior na mesma conexão. */
export class OverlayIdentity {
  private player: OverlayPlayerIdentity | null = null
  private retiredConnections = new Set<string>()
  clear(): void { this.player = null; this.retiredConnections.clear() }
  snapshot(): OverlayPlayerIdentity | null { return this.player ? { ...this.player } : null }
  identify(sourceId: number, connectionId: string, at: number, method: OverlayPlayerIdentity['method'] = 'local-state'): 'changed' | 'same' | 'ignored' {
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || typeof connectionId !== 'string'
      || !connectionId.length || connectionId.length > 128 || !Number.isFinite(at)
      || this.retiredConnections.has(connectionId)) return 'ignored'
    const previous = this.player
    if (previous && at < previous.observedAt) return 'ignored'
    if (previous && previous.connectionId !== connectionId) this.retiredConnections.add(previous.connectionId)
    const changed = !previous || previous.sourceId !== sourceId || previous.connectionId !== connectionId
    this.player = { sourceId, connectionId, observedAt: at, method }
    return changed ? 'changed' : 'same'
  }
  accepts(connectionId: string): boolean { return this.player?.connectionId === connectionId }
  isRetired(connectionId: string): boolean { return this.retiredConnections.has(connectionId) }
  retire(connectionId: string): boolean {
    if (typeof connectionId !== 'string' || !connectionId.length) return false
    this.retiredConnections.add(connectionId)
    if (!this.accepts(connectionId)) return false
    this.player = null
    return true
  }
}

export interface StatusProfileMatch {
  connectionId: string; sourceId: number; name: string; observedAt: number
}

/**
 * Correlaciona a ficha (bloco de atributos do próprio cliente) com o perfil
 * nominal único recebido no mesmo burst. Ambiguidade não seleciona personagem.
 */
export class StatusProfileRecognition {
  private profiles = new Map<string, Array<{ sourceId: number; name: string; seenAt: number }>>()
  private windows = new Map<string, { lastSeenAt: number; candidates: Map<number, string> }>()
  clear(): void { this.profiles.clear(); this.windows.clear() }
  observeProfile(connectionId: string, sourceId: number, name: string, seenAt: number): void {
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || !Number.isFinite(seenAt) || !connectionId) return
    const profiles = (this.profiles.get(connectionId) ?? []).filter(row => seenAt - row.seenAt <= 2_000)
    profiles.push({ sourceId, name, seenAt }); this.profiles.set(connectionId, profiles)
    const window = this.windows.get(connectionId)
    if (window && seenAt - window.lastSeenAt <= 2_000) {
      window.candidates.set(sourceId, name); window.lastSeenAt = seenAt
    }
  }
  observeStats(connectionId: string, seenAt: number): void {
    if (!Number.isFinite(seenAt) || !connectionId) return
    const window = this.windows.get(connectionId)
    const current = window && seenAt - window.lastSeenAt <= 2_000
      ? window : { lastSeenAt: seenAt, candidates: new Map<number, string>() }
    current.lastSeenAt = seenAt
    for (const profile of this.profiles.get(connectionId) ?? []) {
      if (seenAt - profile.seenAt <= 900) current.candidates.set(profile.sourceId, profile.name)
    }
    this.windows.set(connectionId, current)
  }
  settle(now: number): StatusProfileMatch[] {
    const matches: StatusProfileMatch[] = []
    for (const [connectionId, window] of this.windows) {
      if (now - window.lastSeenAt < 650) continue
      this.windows.delete(connectionId)
      if (window.candidates.size !== 1) continue
      const [sourceId, name] = [...window.candidates][0]
      matches.push({ connectionId, sourceId, name, observedAt: window.lastSeenAt })
    }
    for (const [connectionId, profiles] of this.profiles) {
      const fresh = profiles.filter(profile => now - profile.seenAt <= 2_000)
      if (fresh.length) this.profiles.set(connectionId, fresh); else this.profiles.delete(connectionId)
    }
    return matches
  }
}
