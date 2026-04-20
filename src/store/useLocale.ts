import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../i18n/translations'
import { TRANSLATIONS } from '../i18n/translations'

interface LocaleState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (path: string) => string
}

function getByPath(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj as unknown) as string ?? path
}

export const useLocale = create<LocaleState>()(
  persist(
    (set, get) => ({
      lang: 'pt-BR' as Lang,
      setLang: (lang: Lang) => set({ lang }),
      t: (path: string) => {
        const translations = TRANSLATIONS[get().lang] as unknown as Record<string, unknown>
        return getByPath(translations, path) || path
      },
    }),
    { name: 'tier2-locale' }
  )
)
