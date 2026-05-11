import { useState, useMemo } from 'react'
import type { Skill, SkillEnhancement } from '../types'
import { ALL_WEAPONS, ALL_GRADES, ALL_TYPES } from '../types'
import WeaponSidebar from '../components/WeaponSidebar'
import { api } from '../api'

interface Props {
  skills: Skill[]
  enhancements: SkillEnhancement[]
  onUpdate: (s: Skill) => void
  markDirty: () => void
}

type SortKey = 'name' | 'weapon' | 'grade' | 'type' | 'traits'
type SortDir = 'asc' | 'desc'

export default function SkillsTab({ skills, enhancements, onUpdate, markDirty }: Props) {
  const [weapon, setWeapon]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editing, setEditing] = useState<Skill | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    skills.forEach(s => { c[s.weapon] = (c[s.weapon] || 0) + 1 })
    return c
  }, [skills])

  const visible = useMemo(() => {
    let list = weapon ? skills.filter(s => s.weapon === weapon) : skills
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.en.toLowerCase().includes(q) ||
        s.name.pt.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name')   { av = a.name.en; bv = b.name.en }
      if (sortKey === 'weapon') { av = a.weapon;  bv = b.weapon }
      if (sortKey === 'grade')  { av = a.grade;   bv = b.grade }
      if (sortKey === 'type')   { av = a.type;    bv = b.type }
      if (sortKey === 'traits') { av = String(a.enhancementIds.length); bv = String(b.enhancementIds.length) }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [skills, weapon, search, sortKey, sortDir])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const arrow = (k: SortKey) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="workspace">
      <WeaponSidebar selected={weapon} counts={counts} total={skills.length} onSelect={setWeapon} />
      <div className="main">
        <div className="toolbar">
          <input className="search" placeholder="Buscar por nome ou ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="count-badge">{visible.length} skills</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}   className={sortKey === 'name'   ? 'sorted' : ''}>Nome{arrow('name')}</th>
                <th onClick={() => toggleSort('weapon')} className={sortKey === 'weapon' ? 'sorted' : ''}>Arma{arrow('weapon')}</th>
                <th onClick={() => toggleSort('grade')}  className={sortKey === 'grade'  ? 'sorted' : ''}>Grade{arrow('grade')}</th>
                <th onClick={() => toggleSort('type')}   className={sortKey === 'type'   ? 'sorted' : ''}>Tipo{arrow('type')}</th>
                <th>CD</th>
                <th onClick={() => toggleSort('traits')} className={sortKey === 'traits' ? 'sorted' : ''}>Traits{arrow('traits')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id} onClick={() => setEditing(s)}>
                  <td>
                    <div className="cell-name">
                      {s.name.en}
                      <small>{s.name.pt}</small>
                    </div>
                    <div className="cell-id">{s.id}</div>
                  </td>
                  <td><span className={`badge ${s.weapon ? 'badge-weapon' : 'badge-empty'}`}>{s.weapon || '—'}</span></td>
                  <td><span className={`badge badge-grade-${s.grade}`}>{s.grade}</span></td>
                  <td><span className={`badge badge-${s.type}`}>{s.type}</span></td>
                  <td style={{ color: 'var(--muted)' }}>{s.cooldownSec ? `${s.cooldownSec}s` : '—'}</td>
                  <td>
                    <span className={`badge ${s.enhancementIds.length > 0 ? 'badge-grade-Rare' : 'badge-grade-Common'}`}>
                      {s.enhancementIds.length}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={6} className="no-results">Nenhuma skill encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <SkillModal
          skill={editing}
          enhancements={enhancements}
          onClose={() => setEditing(null)}
          onSave={async patch => {
            const updated = await api.updateSkill(editing.id, patch)
            onUpdate(updated)
            setEditing(updated)
            markDirty()
          }}
          onLink={async enhId => {
            const updated = await api.linkEnhancement(editing.id, enhId)
            onUpdate(updated)
            setEditing(updated)
            markDirty()
          }}
          onUnlink={async enhId => {
            const updated = await api.unlinkEnhancement(editing.id, enhId)
            onUpdate(updated)
            setEditing(updated)
            markDirty()
          }}
        />
      )}
    </div>
  )
}

// ── Modal de edição de skill ───────────────────────────────────────────────────
interface ModalProps {
  skill: Skill
  enhancements: SkillEnhancement[]
  onClose: () => void
  onSave: (patch: Partial<Skill>) => Promise<void>
  onLink: (enhId: string) => Promise<void>
  onUnlink: (enhId: string) => Promise<void>
}

function SkillModal({ skill, enhancements, onClose, onSave, onLink, onUnlink }: ModalProps) {
  const [nameEn, setNameEn]   = useState(skill.name.en)
  const [namePt, setNamePt]   = useState(skill.name.pt)
  const [weapon, setWeapon]   = useState(skill.weapon)
  const [grade, setGrade]     = useState(skill.grade)
  const [type, setType]       = useState(skill.type)
  const [cd, setCd]           = useState(String(skill.cooldownSec ?? ''))
  const [mana, setMana]       = useState(String(skill.manaCost ?? ''))
  const [saving, setSaving]   = useState(false)
  const [linkId, setLinkId]   = useState('')

  const linkedEnhs = enhancements.filter(e => skill.enhancementIds.includes(e.id))
  const unlinkable = enhancements.filter(e => !skill.enhancementIds.includes(e.id))

  async function handleSave() {
    setSaving(true)
    await onSave({
      name: { en: nameEn, pt: namePt },
      weapon,
      grade,
      type,
      cooldownSec: cd ? Number(cd) : undefined,
      manaCost:    mana ? Number(mana) : undefined,
    })
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Editar Skill</h2>
        <div className="modal-id">{skill.id}</div>

        <div className="field-row">
          <div className="field">
            <label>Nome (EN)</label>
            <input value={nameEn} onChange={e => setNameEn(e.target.value)} />
          </div>
          <div className="field">
            <label>Nome (PT)</label>
            <input value={namePt} onChange={e => setNamePt(e.target.value)} />
          </div>
        </div>

        <div className="field-row3">
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
          <div className="field">
            <label>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Cooldown (s)</label>
            <input type="number" value={cd} onChange={e => setCd(e.target.value)} />
          </div>
          <div className="field">
            <label>Mana Cost</label>
            <input type="number" value={mana} onChange={e => setMana(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Traits vinculados ({linkedEnhs.length})</label>
          <div className="enh-list">
            {linkedEnhs.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 11 }}>Nenhum trait vinculado.</span>}
            {linkedEnhs.map(e => (
              <div key={e.id} className="enh-item">
                <span>{e.name.en}</span>
                <small>{e.effect.en}</small>
                <button className="btn btn-danger btn-xs" onClick={() => onUnlink(e.id)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Vincular trait</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12 }}
              value={linkId} onChange={e => setLinkId(e.target.value)}>
              <option value="">Selecionar enhancement…</option>
              {unlinkable.map(e => <option key={e.id} value={e.id}>{e.name.en} — {e.baseSkillName.en}</option>)}
            </select>
            <button className="btn btn-primary" disabled={!linkId} onClick={() => { if (linkId) { onLink(linkId); setLinkId('') } }}>
              + Vincular
            </button>
          </div>
        </div>

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
