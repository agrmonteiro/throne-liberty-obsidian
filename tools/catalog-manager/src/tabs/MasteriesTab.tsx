import { useState, useMemo } from 'react'
import type { WeaponMastery } from '../types'
import { ALL_WEAPONS, ALL_GRADES } from '../types'
import WeaponSidebar from '../components/WeaponSidebar'
import { api } from '../api'

interface Props {
  masteries: WeaponMastery[]
  onUpdate: (m: WeaponMastery) => void
  markDirty: () => void
}

type SortKey = 'name' | 'weapon' | 'grade' | 'category'

export default function MasteriesTab({ masteries, onUpdate, markDirty }: Props) {
  const [weapon, setWeapon]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing] = useState<WeaponMastery | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    masteries.forEach(m => { c[m.weapon] = (c[m.weapon] || 0) + 1 })
    return c
  }, [masteries])

  const visible = useMemo(() => {
    let list = weapon ? masteries.filter(m => m.weapon === weapon) : masteries
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        m.name.en.toLowerCase().includes(q) ||
        m.name.pt.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name')     { av = a.name.en;       bv = b.name.en }
      if (sortKey === 'weapon')   { av = a.weapon;         bv = b.weapon }
      if (sortKey === 'grade')    { av = a.grade;          bv = b.grade }
      if (sortKey === 'category') { av = a.category.en;   bv = b.category.en }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [masteries, weapon, search, sortKey, sortDir])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const arrow = (k: SortKey) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="workspace">
      <WeaponSidebar selected={weapon} counts={counts} total={masteries.length} onSelect={setWeapon} />
      <div className="main">
        <div className="toolbar">
          <input className="search" placeholder="Buscar por nome ou ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="count-badge">{visible.length} maestrias</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}     className={sortKey === 'name'     ? 'sorted' : ''}>Nome{arrow('name')}</th>
                <th onClick={() => toggleSort('weapon')}   className={sortKey === 'weapon'   ? 'sorted' : ''}>Arma{arrow('weapon')}</th>
                <th onClick={() => toggleSort('category')} className={sortKey === 'category' ? 'sorted' : ''}>Categoria{arrow('category')}</th>
                <th onClick={() => toggleSort('grade')}    className={sortKey === 'grade'    ? 'sorted' : ''}>Grade{arrow('grade')}</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(m => (
                <tr key={m.id} onClick={() => setEditing(m)}>
                  <td>
                    <div className="cell-name">
                      {m.name.en}
                      <small>{m.name.pt}</small>
                    </div>
                    <div className="cell-id">{m.id}</div>
                  </td>
                  <td><span className={`badge ${m.weapon === 'Shared' ? 'badge-shared' : m.weapon ? 'badge-weapon' : 'badge-empty'}`}>{m.weapon || '—'}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 11 }}>{m.category.en || '—'}</td>
                  <td><span className={`badge badge-grade-${m.grade}`}>{m.grade}</span></td>
                  <td><span className={`badge badge-grade-${m.stats.length > 0 ? 'Rare' : 'Common'}`}>{m.stats.length}</span></td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={5} className="no-results">Nenhuma maestria encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <MasteryModal
          mastery={editing}
          onClose={() => setEditing(null)}
          onSave={async patch => {
            const updated = await api.updateMastery(editing.id, patch)
            onUpdate(updated)
            setEditing(updated)
            markDirty()
          }}
        />
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  mastery: WeaponMastery
  onClose: () => void
  onSave: (patch: Partial<WeaponMastery>) => Promise<void>
}

function MasteryModal({ mastery, onClose, onSave }: ModalProps) {
  const [nameEn, setNameEn]     = useState(mastery.name.en)
  const [namePt, setNamePt]     = useState(mastery.name.pt)
  const [weapon, setWeapon]     = useState(mastery.weapon)
  const [grade, setGrade]       = useState(mastery.grade)
  const [catEn, setCatEn]       = useState(mastery.category.en)
  const [catPt, setCatPt]       = useState(mastery.category.pt)
  const [descEn, setDescEn]     = useState(mastery.description.en)
  const [descPt, setDescPt]     = useState(mastery.description.pt)
  const [saving, setSaving]     = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({
      name:        { en: nameEn, pt: namePt },
      weapon,
      grade,
      category:    { en: catEn, pt: catPt },
      description: { en: descEn, pt: descPt },
    })
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Editar Maestria</h2>
        <div className="modal-id">{mastery.id}</div>

        <div className="field-row">
          <div className="field"><label>Nome (EN)</label><input value={nameEn} onChange={e => setNameEn(e.target.value)} /></div>
          <div className="field"><label>Nome (PT)</label><input value={namePt} onChange={e => setNamePt(e.target.value)} /></div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Arma</label>
            <select value={weapon} onChange={e => setWeapon(e.target.value)}>
              <option value="">—</option>
              {ALL_WEAPONS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Grade</label>
            <select value={grade} onChange={e => setGrade(e.target.value)}>
              {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field"><label>Categoria (EN)</label><input value={catEn} onChange={e => setCatEn(e.target.value)} /></div>
          <div className="field"><label>Categoria (PT)</label><input value={catPt} onChange={e => setCatPt(e.target.value)} /></div>
        </div>

        <div className="field"><label>Descrição (EN)</label><textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={4} /></div>
        <div className="field"><label>Descrição (PT)</label><textarea value={descPt} onChange={e => setDescPt(e.target.value)} rows={4} /></div>

        {mastery.stats.length > 0 && (
          <div className="field">
            <label>Stats ({mastery.stats.length})</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {mastery.stats.map((s, i) => (
                <div key={i} className="enh-item">
                  <span>{s.label.en}</span>
                  <small>{s.value}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
