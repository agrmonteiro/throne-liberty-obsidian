import type { DamageKind } from '../engine/overlayMeter'

export const number = (value: number): string => Math.round(value).toLocaleString('pt-BR')
export function duration(seconds: number): string {
  const value = Math.floor(seconds)
  return `${Math.floor(value / 3600) ? `${Math.floor(value / 3600)}:` : ''}${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export const percentage = (value: number, total: number): string => `${total ? (100 * value / total).toFixed(1).replace('.', ',') : '0'}%`
export const damageKinds: Array<{ key: DamageKind; label: string; color: string }> = [
  { key: 'normal', label: 'Normal', color: 'var(--meter-normal, #8c9cac)' },
  { key: 'critical', label: 'Crítico', color: 'var(--meter-critical, #e2bd65)' },
  { key: 'heavy', label: 'Pesado', color: 'var(--meter-heavy, #67bdc3)' },
  { key: 'criticalHeavy', label: 'Crítico pesado', color: 'var(--meter-criticalHeavy, #c38bd8)' },
]
