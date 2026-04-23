import { create } from 'zustand'

export interface RankingLog {
  name: string
  content: string
}

export interface RankingFilters {
  target: string
  weapon: string
  duration: 'all' | 'short' | 'long'
  sortBy: 'damage' | 'dps'
}

interface RankingStore {
  logs: RankingLog[]
  comments: Record<string, string>
  filters: RankingFilters
  addLog: (log: RankingLog) => void
  removeLog: (name: string) => void
  setLogs: (logs: RankingLog[]) => void
  setComments: (comments: Record<string, string>) => void
  updateComment: (key: string, value: string) => void
  setFilter: <K extends keyof RankingFilters>(key: K, value: RankingFilters[K]) => void
  setFilters: (filters: RankingFilters) => void
}

const DEFAULT_FILTERS: RankingFilters = {
  target: 'all',
  weapon: 'all',
  duration: 'all',
  sortBy: 'damage',
}

export const useRankingStore = create<RankingStore>((set) => ({
  logs: [],
  comments: {},
  filters: { ...DEFAULT_FILTERS },
  addLog: (log) => set(state => ({
    logs: state.logs.some(l => l.name === log.name) ? state.logs : [...state.logs, log]
  })),
  removeLog: (name) => set(state => ({ logs: state.logs.filter(l => l.name !== name) })),
  setLogs: (logs) => set({ logs }),
  setComments: (comments) => set({ comments }),
  updateComment: (key, value) => set(state => ({ comments: { ...state.comments, [key]: value } })),
  setFilter: (key, value) => set(state => ({ filters: { ...state.filters, [key]: value } })),
  setFilters: (filters) => set({ filters }),
}))
