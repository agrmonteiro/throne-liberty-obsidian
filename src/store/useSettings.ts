import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

interface SettingsState {
  theme: Theme
  fontSize: number
  setTheme: (theme: Theme) => void
  setFontSize: (size: number) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 14,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'tl-settings-storage',
    }
  )
)
