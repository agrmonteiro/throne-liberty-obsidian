import type { Skill, SkillEnhancement, WeaponMastery } from './types'

const base = '/api'

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(base + url, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  skills:       () => req<Skill[]>('/skills'),
  enhancements: () => req<SkillEnhancement[]>('/enhancements'),
  masteries:    () => req<WeaponMastery[]>('/masteries'),

  updateSkill: (id: string, patch: Partial<Skill>) =>
    req<Skill>(`/skill/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  updateEnhancement: (id: string, patch: Partial<SkillEnhancement>) =>
    req<SkillEnhancement>(`/enhancement/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  updateMastery: (id: string, patch: Partial<WeaponMastery>) =>
    req<WeaponMastery>(`/mastery/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  linkEnhancement: (skillId: string, enhId: string) =>
    req<Skill>(`/skill/${encodeURIComponent(skillId)}/link/${encodeURIComponent(enhId)}`, { method: 'POST' }),

  unlinkEnhancement: (skillId: string, enhId: string) =>
    req<Skill>(`/skill/${encodeURIComponent(skillId)}/link/${encodeURIComponent(enhId)}`, { method: 'DELETE' }),

  save: () => req<{ ok: boolean; saved: Record<string, number> }>('/save', { method: 'POST' }),
}
