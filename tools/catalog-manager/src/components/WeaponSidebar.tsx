import { ALL_WEAPONS } from '../types'

interface Props {
  selected: string | null
  counts: Record<string, number>
  total: number
  onSelect: (w: string | null) => void
}

export default function WeaponSidebar({ selected, counts, total, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <h3>Arma</h3>
      <button
        className={`weapon-btn all-btn ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        Todas <span className="count">{total}</span>
      </button>
      {ALL_WEAPONS.map(w => (
        <button
          key={w}
          className={`weapon-btn ${selected === w ? 'active' : ''}`}
          onClick={() => onSelect(w)}
        >
          {w} <span className="count">{counts[w] ?? 0}</span>
        </button>
      ))}
    </aside>
  )
}
