import { useLocale } from '../store/useLocale'

/** Hook que retorna a função de tradução `t` para o idioma atual */
export function useT() {
  return useLocale((s) => s.t)
}
