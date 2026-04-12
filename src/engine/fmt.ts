/**
 * Utilitários de formatação numérica — padrão pt-BR
 *   "." = separador de milhar
 *   "," = separador de decimal
 */

/** Inteiro com separadores de milhar: 1234567 → "1.234.567" */
export const fmt = (n: number): string =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })

/** Percentual com N casas decimais: 42.5 → "42,50%" (padrão 2 casas) */
export const fmtPct = (n: number, decimals = 2): string =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`

/** Percentual com 1 casa decimal: 42.5 → "42,5%" */
export const fmtP = (n: number): string => fmtPct(n, 1)

/** Número decimal com N casas (sem símbolo %): 0.333 → "0,33" */
export const fmtDec = (n: number, decimals = 2): string =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
