import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UiScalePref } from '../hooks/useAutoScale'

// Todos os 10 temas do design system Obsidian Command
export type Theme =
  | 'dark'           // Obsidian (dark padrão)
  | 'light'          // Ivory Scroll
  | 'blood-dragon'   // Crimson guild
  | 'arcane'         // Deep violet
  | 'emerald'        // Forest ranger
  | 'abyssal'        // Deep sea
  | 'ember'          // Fire warrior
  | 'frost'          // Ice mage
  | 'shadow'         // Assassin
  | 'royal'          // Paladin commander

// Mapa tema → classe CSS do body
export const THEME_CLASS: Record<Theme, string> = {
  'dark':         '',
  'light':        'theme-light',
  'blood-dragon': 'theme-blood-dragon',
  'arcane':       'theme-arcane',
  'emerald':      'theme-emerald',
  'abyssal':      'theme-abyssal',
  'ember':        'theme-ember',
  'frost':        'theme-frost',
  'shadow':       'theme-shadow',
  'royal':        'theme-royal',
}

interface SettingsState {
  theme:       Theme
  fontSize:    number
  uiScale:     UiScalePref
  setTheme:    (theme: Theme) => void
  setFontSize: (size: number) => void
  setUiScale:  (scale: UiScalePref) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme:       'dark',
      fontSize:    14,
      uiScale:     'auto',
      setTheme:    (theme)     => set({ theme }),
      setFontSize: (fontSize)  => set({ fontSize }),
      setUiScale:  (uiScale)   => set({ uiScale }),
    }),
    { name: 'tl-settings-storage' }
  )
)
