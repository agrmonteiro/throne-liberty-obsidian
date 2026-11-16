/**
 * Registro efêmero de entidades observadas em uma conexão de combate.
 * IDs de entidade não sobrevivem a uma troca de conexão e por isso não são
 * persistidos nem compartilhados entre sessões.
 */
export interface OverlayEntityLabel { name?: string; npcId?: number }

const nameKey = (value: string): string => value.normalize('NFKC').trim().toLocaleLowerCase('pt-BR')

export class OverlaySourceRegistry {
  private profiles = new Map<string, Map<number, string>>()
  private profileConflicts = new Map<string, Set<number>>()
  private observedLabels = new Map<string, Map<number, string>>()
  private npcTemplates = new Map<string, Map<number, number | null>>()

  clear(): void {
    this.profiles.clear(); this.profileConflicts.clear(); this.observedLabels.clear(); this.npcTemplates.clear()
  }
  close(connectionId: string): void {
    this.profiles.delete(connectionId); this.profileConflicts.delete(connectionId)
    this.observedLabels.delete(connectionId); this.npcTemplates.delete(connectionId)
  }
  rememberProfile(connectionId: string, sourceId: number, name: string): boolean {
    const conflicts = this.conflictsFor(connectionId, true)!
    if (conflicts.has(sourceId)) return false
    const profiles = this.profilesFor(connectionId, true)!
    const previous = profiles.get(sourceId)
    if (previous && nameKey(previous) !== nameKey(name)) {
      profiles.delete(sourceId); conflicts.add(sourceId)
      return false
    }
    profiles.set(sourceId, name)
    return true
  }
  rememberObservedLabel(connectionId: string, sourceId: number, name?: string): void {
    if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || typeof name !== 'string' || !name.trim()
      || name.length > 96 || name.trim() !== name || /[\p{C}]/u.test(name)) return
    const labels = this.observedFor(connectionId, true)!
    const previous = labels.get(sourceId)
    if (previous && nameKey(previous) !== nameKey(name)) { labels.delete(sourceId); return }
    labels.set(sourceId, name)
  }
  rememberNpc(connectionId: string, sourceId: number, npcId: number): boolean {
    let templates = this.npcTemplates.get(connectionId)
    if (!templates) {
      if (this.npcTemplates.size >= 16) return false
      templates = new Map(); this.npcTemplates.set(connectionId, templates)
    }
    if (templates.size >= 50_000 && !templates.has(sourceId)) return false
    const previous = templates.get(sourceId)
    templates.set(sourceId, previous === undefined || previous === npcId ? npcId : null)
    return true
  }
  templateId(connectionId: string, sourceId: number): number | undefined {
    const value = this.npcTemplates.get(connectionId)?.get(sourceId)
    return Number.isSafeInteger(value) && value > 0 ? value : undefined
  }
  entity(connectionId: string | null | undefined, sourceId: number, npcNames: Record<string, string>): OverlayEntityLabel {
    if (!connectionId) return {}
    const profile = this.profilesFor(connectionId)?.get(sourceId)
    if (profile) return { name: profile }
    const npcId = this.templateId(connectionId, sourceId)
    if (npcId) return { name: npcNames[String(npcId)], npcId }
    const label = this.observedFor(connectionId)?.get(sourceId)
    return label ? { name: label } : {}
  }
  private profilesFor(connectionId: string, create = false): Map<number, string> | undefined {
    let values = this.profiles.get(connectionId)
    if (!values && create) { values = new Map(); this.profiles.set(connectionId, values) }
    return values
  }
  private conflictsFor(connectionId: string, create = false): Set<number> | undefined {
    let values = this.profileConflicts.get(connectionId)
    if (!values && create) { values = new Set(); this.profileConflicts.set(connectionId, values) }
    return values
  }
  private observedFor(connectionId: string, create = false): Map<number, string> | undefined {
    let values = this.observedLabels.get(connectionId)
    if (!values && create) { values = new Map(); this.observedLabels.set(connectionId, values) }
    return values
  }
}
