import reference from '../data/overlayHealingSkillClasses.json'

interface SkillClass { categories: string[]; description: string; conditional: boolean; review?: boolean }
const skills: Record<string, SkillClass> = reference.skills
const labels: Record<string, string> = reference.labels

/** Texto de referência; não decide se um pacote entra nos totais do medidor. */
export function healingDescriptionTitle(ids: number[] = []): string {
  const descriptions = ids.map(id => skills[String(id)]).filter(row => row && !row.review && row.categories.length)
    .map(row => `Classificação sugerida pela descrição base: ${row.categories.map(key => labels[key] ?? key).join(' · ')}.${row.conditional ? '\nPossui condições no texto.' : ''}\n${row.description.slice(0, 600)}`)
  return [...new Set(descriptions)].slice(0, 3).join('\n\n')
}
