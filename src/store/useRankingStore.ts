import { create } from 'zustand'

export interface RankingLog {
  name: string
  content: string
}

interface RankingStore {
  logs: RankingLog[]
  comments: Record<string, string>
  addLog: (log: RankingLog) => void
  removeLog: (name: string) => void
  setComments: (comments: Record<string, string>) => void
  updateComment: (key: string, value: string) => void
}

export const useRankingStore = create<RankingStore>((set) => ({
  logs: [],
  comments: {},
  addLog: (log) => set(state => ({
    logs: state.logs.some(l => l.name === log.name) ? state.logs : [...state.logs, log]
  })),
  removeLog: (name) => set(state => ({ logs: state.logs.filter(l => l.name !== name) })),
  setComments: (comments) => set({ comments }),
  updateComment: (key, value) => set(state => ({ comments: { ...state.comments, [key]: value } })),
}))
