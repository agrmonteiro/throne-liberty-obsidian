import { create } from 'zustand'
import type {
  Rotation,
  RotationMap,
  RotationCharacter,
  RotationSkill,
  RotationDot,
  RotationBuff,
  RotationRule,
  CastEvent,
  Build,
} from '../engine/types'
import { DEFAULT_ROTATION_CHARACTER } from '../engine/types'

const FILE = 'rotations.json'

interface RotationState {
  rotations:        RotationMap
  activeRotationId: string | null
  loading:          boolean

  loadFromDisk:      ()                                          => Promise<void>
  saveRotation:      (rotation: Rotation)                        => Promise<void>
  deleteRotation:    (id: string)                                => Promise<void>
  duplicateRotation: (id: string)                                => Promise<void>
  setActive:         (id: string | null)                         => void
  createEmpty:       (name: string)                              => Rotation
  importFromBuild:   (build: Build)                              => Rotation
  updateCharacter:   (id: string, char: Partial<RotationCharacter>) => void
  addSkill:          (id: string, skill: RotationSkill)          => void
  updateSkill:       (id: string, skillId: string, patch: Partial<RotationSkill>) => void
  removeSkill:       (id: string, skillId: string)               => void
  moveSkill:         (id: string, from: number, to: number)      => void
  addDot:            (id: string, dot: RotationDot)              => void
  updateDot:         (id: string, dotId: string, patch: Partial<RotationDot>) => void
  removeDot:         (id: string, dotId: string)                 => void
  addBuff:           (id: string, buff: RotationBuff)            => void
  updateBuff:        (id: string, buffId: string, patch: Partial<RotationBuff>) => void
  removeBuff:        (id: string, buffId: string)                => void
  addRule:           (id: string, rule: RotationRule)            => void
  removeRule:        (id: string, ruleId: string)                => void
  toggleCastEvent:      (id: string, event: CastEvent)            => void
  clearItemTimeline:    (id: string, itemId: string)              => void
  clearAllTimeline:     (id: string)                              => void
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

async function readRotations(): Promise<RotationMap> {
  try {
    const data = await window.dataAPI.read(FILE)
    return (data as RotationMap) ?? {}
  } catch {
    return {}
  }
}

async function writeRotations(rotations: RotationMap): Promise<void> {
  await window.dataAPI.write(FILE, rotations)
}

export const useRotation = create<RotationState>((set, get) => ({
  rotations:        {},
  activeRotationId: null,
  loading:          false,

  loadFromDisk: async () => {
    set({ loading: true })
    const rotations = await readRotations()
    const ids = Object.keys(rotations)
    set({ rotations, loading: false, activeRotationId: ids[0] ?? null })
  },

  saveRotation: async (rotation) => {
    const updated = { ...rotation, editedAt: new Date().toISOString() }
    const rotations = { ...get().rotations, [updated.id]: updated }
    set({ rotations })
    await writeRotations(rotations)
  },

  deleteRotation: async (id) => {
    const rotations = { ...get().rotations }
    delete rotations[id]
    const ids = Object.keys(rotations)
    set({ rotations, activeRotationId: ids[0] ?? null })
    await writeRotations(rotations)
  },

  duplicateRotation: async (id) => {
    const src = get().rotations[id]
    if (!src) return
    const copy: Rotation = {
      ...src,
      id:        newId('rot'),
      name:      `${src.name} (cópia)`,
      createdAt: new Date().toISOString(),
      editedAt:  undefined,
    }
    const rotations = { ...get().rotations, [copy.id]: copy }
    set({ rotations, activeRotationId: copy.id })
    await writeRotations(rotations)
  },

  setActive: (id) => set({ activeRotationId: id }),

  createEmpty: (name) => {
    const rotation: Rotation = {
      id:        newId('rot'),
      name,
      character: { ...DEFAULT_ROTATION_CHARACTER },
      skills:    [],
      dots:      [],
      buffs:     [],
      rules:     [],
      timeline:  [],
      createdAt: new Date().toISOString(),
    }
    const rotations = { ...get().rotations, [rotation.id]: rotation }
    set({ rotations, activeRotationId: rotation.id })
    writeRotations(rotations)
    return rotation
  },

  importFromBuild: (build) => {
    const s = build.stats
    const character: RotationCharacter = {
      ...DEFAULT_ROTATION_CHARACTER,
      weaponMainDmgMin:  s.minWeaponDmg,
      weaponMainDmgMax:  s.maxWeaponDmg,
      critChanceBase:    s.critHitChance,
      heavyChanceBase:   s.heavyAttackChance,
      critDmgPct:        s.critDmgPct,
      heavyDmgPct:       100 + (s.heavyAttackDmgComp ?? 0),
      skillDmgBoost:     s.skillDmgBoost,
      speciesDmgBoost:   s.speciesDmgBoost,
      bonusDamage:       s.bonusDmg,
      targetDefense:     s.targetDefense,
      targetEndurance:   s.targetEndurance,
    }
    const rotation: Rotation = {
      id:                   newId('rot'),
      name:                 `Rotação — ${build.name}`,
      character,
      skills:               [],
      dots:                 [],
      buffs:                [],
      rules:                [],
      timeline:             [],
      createdAt:            new Date().toISOString(),
      importedFromBuildId:  build.id,
    }
    const rotations = { ...get().rotations, [rotation.id]: rotation }
    set({ rotations, activeRotationId: rotation.id })
    writeRotations(rotations)
    return rotation
  },

  updateCharacter: (id, patch) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, character: { ...rot.character, ...patch } }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  addSkill: (id, skill) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, skills: [...rot.skills, skill] }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  updateSkill: (id, skillId, patch) => {
    const rot = get().rotations[id]
    if (!rot) return
    const skills = rot.skills.map(s => s.id === skillId ? { ...s, ...patch } : s)
    const updated = { ...rot, skills }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  removeSkill: (id, skillId) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, skills: rot.skills.filter(s => s.id !== skillId) }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  moveSkill: (id, from, to) => {
    const rot = get().rotations[id]
    if (!rot) return
    const skills = [...rot.skills]
    const [item] = skills.splice(from, 1)
    skills.splice(to, 0, item)
    const updated = { ...rot, skills }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  addDot: (id, dot) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, dots: [...rot.dots, dot] }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  updateDot: (id, dotId, patch) => {
    const rot = get().rotations[id]
    if (!rot) return
    const dots = rot.dots.map(d => d.id === dotId ? { ...d, ...patch } : d)
    const updated = { ...rot, dots }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  removeDot: (id, dotId) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, dots: rot.dots.filter(d => d.id !== dotId) }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  addBuff: (id, buff) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, buffs: [...(rot.buffs ?? []), buff] }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  updateBuff: (id, buffId, patch) => {
    const rot = get().rotations[id]
    if (!rot) return
    const buffs = (rot.buffs ?? []).map(b => b.id === buffId ? { ...b, ...patch } : b)
    const updated = { ...rot, buffs }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  removeBuff: (id, buffId) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, buffs: (rot.buffs ?? []).filter(b => b.id !== buffId) }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  addRule: (id, rule) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, rules: [...(rot.rules ?? []), rule] }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  removeRule: (id, ruleId) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, rules: (rot.rules ?? []).filter(r => r.id !== ruleId) }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  toggleCastEvent: (id, event) => {
    const rot = get().rotations[id]
    if (!rot) return
    const timeline = rot.timeline ?? []
    const rules    = rot.rules    ?? []
    const exists   = timeline.find(e => e.itemId === event.itemId && e.castAt === event.castAt)

    let newTimeline: typeof timeline

    if (exists) {
      // Remover evento principal
      newTimeline = timeline.filter(e => !(e.itemId === event.itemId && e.castAt === event.castAt))
      // Remover efeitos encadeados pelas regras
      for (const rule of rules) {
        if (rule.triggerId === event.itemId) {
          newTimeline = newTimeline.filter(
            e => !(e.itemId === rule.effectId && e.castAt === event.castAt),
          )
        }
      }
    } else {
      // Adicionar evento principal
      newTimeline = [...timeline, event]
      // Adicionar efeitos encadeados pelas regras
      for (const rule of rules) {
        if (rule.triggerId === event.itemId) {
          const alreadyExists = newTimeline.some(
            e => e.itemId === rule.effectId && e.castAt === event.castAt,
          )
          if (!alreadyExists) {
            const effectType = resolveItemType(rule.effectId, rot)
            if (effectType !== null) {
              newTimeline = [
                ...newTimeline,
                {
                  id:       `cast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  itemId:   rule.effectId,
                  itemType: effectType,
                  castAt:   event.castAt,
                },
              ]
            }
          }
        }
      }
    }

    const updated = { ...rot, timeline: newTimeline }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  clearItemTimeline: (id, itemId) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, timeline: (rot.timeline ?? []).filter(e => e.itemId !== itemId) }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },

  clearAllTimeline: (id) => {
    const rot = get().rotations[id]
    if (!rot) return
    const updated = { ...rot, timeline: [] }
    const rotations = { ...get().rotations, [id]: updated }
    set({ rotations })
    writeRotations(rotations)
  },
}))

function resolveItemType(effectId: string, rotation: Rotation): 'skill' | 'dot' | 'buff' | null {
  if (rotation.skills.some(s => s.id === effectId)) return 'skill'
  if ((rotation.dots  ?? []).some(d => d.id === effectId)) return 'dot'
  if ((rotation.buffs ?? []).some(b => b.id === effectId)) return 'buff'
  return null
}
