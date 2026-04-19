/**
 * Utilitários de formatação numérica — padrão pt-BR
 *   "." = separador de milhar
 *   "," = separador de decimal
 */

/** Número com 2 casas decimais e separadores de milhar: 1234567 → "1.234.567,00" */
export const fmt = (n: number): string =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Percentual com N casas decimais: 42.5 → "42,50%" (padrão 2 casas) */
export const fmtPct = (n: number, decimals = 2): string =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`

/** Percentual com 2 casas decimais: 42.5 → "42,50%" */
export const fmtP = (n: number): string => fmtPct(n, 2)

/** Número decimal com N casas (sem símbolo %): 0.333 → "0,33" */
export const fmtDec = (n: number, decimals = 2): string =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
