import React, { useState } from 'react'
import icons from '../data/overlaySkillIcons.json'

const assets = import.meta.glob<string>('../assets/skills/*.{webp,png}', { eager: true, query: '?url', import: 'default' })
const normalize = (name: string): string => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
const byName = new Map(Object.entries(icons).map(([name, file]) => [normalize(name), file]))

export function MeterSkillIcon({ name, iconFile }: { name: string; iconFile?: string }): React.ReactElement {
  const file = iconFile ?? byName.get(normalize(name))
  const src = file ? assets[`../assets/skills/${file}`] : undefined
  const [failed, setFailed] = useState<string | null>(null)
  const available = Boolean(src && failed !== src)
  return <span className={`meter-skill-icon${available ? '' : ' is-placeholder'}`} aria-hidden="true"
    title={available ? undefined : 'Ícone ainda não mapeado'}>
    {available ? <img src={src} alt="" draggable={false} loading="lazy" decoding="async" onError={() => setFailed(src!)} />
      : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="10" cy="10" r="6.5" /><path d="M8.3 7.3a1.9 1.9 0 0 1 3.6.8c0 1.5-1.9 1.6-1.9 3.2M10 13.5v.5" />
      </svg>}
  </span>
}
