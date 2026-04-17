import { create } from 'zustand'

const FILE = 'log-timeline.json'

export interface LogTimelineCast {
  castAtSec: number   // relativo ao início do pull, arredondado a 0.5s
  skillName: string
}

export interface LogTimelineData {
  savedAt:         string   // ISO
  source:          string   // nome do personagem
  pullDurationSec: number
  skills:          string[] // lista única de skills (ordem de exibição)
  casts:           LogTimelineCast[]
}

interface LogTimelineState {
  data:    LogTimelineData | null
  loading: boolean
  load:    () => Promise<void>
  save:    (data: LogTimelineData) => Promise<void>
  clear:   () => void
}

export const useLogTimeline = create<LogTimelineState>((set) => ({
  data:    null,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const raw = await window.dataAPI.read(FILE)
      set({ data: raw as LogTimelineData | null, loading: false })
    } catch {
      set({ data: null, loading: false })
    }
  },

  save: async (data) => {
    set({ data })
    await window.dataAPI.write(FILE, data)
  },

  clear: () => set({ data: null }),
}))
