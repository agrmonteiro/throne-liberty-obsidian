import { useState, useMemo } from 'react'
import type { Skill, SkillEnhancement } from '../types'
import { ALL_GRADES } from '../types'
import { api } from '../api'

interface Props {
  skills: Skill[]
  enhancements: SkillEnhancement[]
  onUpdate: (e: SkillEnhancement) => void
  markDirty: () => void
}

type SortKey = 'name' | 'baseSkill' | 'grade' | 'effect'

export default function EnhancementsTab({ skills, enhancements, onUpdate, markDirty }: Props) {
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('baseSkill')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing] = useState<SkillEnhancement | null>(null)
  const [weaponFilter, setWeaponFilter] = useState('')

  const skillById = useMemo(() => {
    const m: Record<string, Skill> = {}
    skills.forEach(s => { m[s.id] = s })
    return m
  }, [skills])

  // Para cada enhancement, qual skill o referencia
  const parentSkill = useMemo(() => {
    const m: Record<string, Skill | undefined> = {}
    skills.forEach(s => s.enhancementIds.forEach(eid => { m[eid] = s }))
    return m
  }, [skills])

  const weapons = useMemo(() => {
    const set = new Set<string>()
    enhancements.forEach(e => {
      const parent = parentSkill[e.id]
      if (parent?.weapon) set.add(parent.weapon)
    })
    return ['', ...Array.from(set).sort()]
  }, [enhancements, parentSkill])

  const orphans = useMemo(() =>
    enhancements.filter(e => !parentSkill[e.id]).length,
  [enhancements, parentSkill])

  const visible = useMemo(() => {
    let list = enhancements
    if (weaponFilter) {
      list = list.filter(e => parentSkill[e.id]?.weapon === weaponFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.name.en.toLowerCase().includes(q) ||
        e.baseSkillName.en.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name')      { av = a.name.en;          bv = b.name.en }
      if (sortKey === 'baseSkill') { av = a.baseSkillName.en; bv = b.baseSkillName.en }
      if (sortKey === 'grade')     { av = a.grade;            bv = b.grade }
      if (sortKey === 'effect')    { av = a.effect.en;        bv = b.effect.en }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [enhancements, weaponFilter, search, sortKey, sortDir, parentSkill])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const arrow = (k: SortKey) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="workspace">
      <div className="main">
        <div className="toolbar">
          <input className="search" placeholder="Buscar por nome, base skill ou ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <select
            value={weaponFilter}
            onChange={e => setWeaponFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12 }}
          >
            <option value="">Todas as armas</option>
            {weapons.filter(Boolean).map(w => <option key={w}>{w}</option>)}
          </select>
          <span className="count-badge">{visible.length} traits</span>
          {orphans > 0 && <span className="badge badge-empty">{orphans} órfãos</span>}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}      className={sortKey === 'name'      ? 'sorted' : ''}>Nome Trait{arrow('name')}</th>
                <th onClick={() => toggleSort('baseSkill')} className={sortKey === 'baseSkill' ? 'sorted' : ''}>Skill Base{arrow('baseSkill')}</th>
                <th>Arma (pai)</th>
                <th onClick={() => toggleSort('grade')}     className={sortKey === 'grade'     ? 'sorted' : ''}>Grade{arrow('grade')}</th>
                <th onClick={() => toggleSort('effect')}    className={sortKey === 'effect'    ? 'sorted' : ''}>Efeito{arrow('effect')}</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(e => {
                const parent = parentSkill[e.id]
                return (
                  <tr key={e.id} onClick={() => setEditing(e)}>
                    <td>
                      <div className="cell-name">{e.name.en}<small>{e.name.pt}</small></div>
                      <div className="cell-id">{e.id}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{e.baseSkillName.en}</td>
                    <td>
                      {parent
                        ? <span className="badge badge-weapon">{parent.weapon}</span>
                        : <span className="badge badge-empty">órfão</span>}
                    </td>
                    <td><span className={`badge badge-grade-${e.grade}`}>{e.grade}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.effect.en}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 11 }}>{e.requiredPoints ?? '—'}</td>
                  </tr>
                )
              })}
              {visible.length === 0 && <tr><td colSpan={6} className="no-results">Nenhum trait encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EnhancementModal
          enhancement={editing}
          skills={skills}
          parentSkill={parentSkill[editing.id]}
          onClose={() => setEditing(null)}
          onSave={async patch => {
            const updated = await api.updateEnhancement(editing.id, patch)
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
  enhancement: SkillEnhancement
  skills: Skill[]
  parentSkill: Skill | undefined
  onClose: () => void
  onSave: (patch: Partial<SkillEnhancement>) => Promise<void>
}

function EnhancementModal({ enhancement: e, skills, parentSkill, onClose, onSave }: ModalProps) {
  const [nameEn, setNameEn]       = useState(e.name.en)
  const [namePt, setNamePt]       = useState(e.name.pt)
  const [baseEn, setBaseEn]       = useState(e.baseSkillName.en)
  const [basePt, setBasePt]       = useState(e.baseSkillName.pt)
  const [grade, setGrade]         = useState(e.grade)
  const [effectEn, setEffectEn]   = useState(e.effect.en)
  const [effectPt, setEffectPt]   = useState(e.effect.pt)
  const [level, setLevel]         = useState(String(e.unlockLevel ?? ''))
  const [pts, setPts]             = useState(String(e.requiredPoints ?? ''))
  const [saving, setSaving]       = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({
      name:          { en: nameEn, pt: namePt },
      baseSkillName: { en: baseEn, pt: basePt },
      grade,
      effect:        { en: effectEn, pt: effectPt },
      unlockLevel:   level ? Number(level) : undefined,
      requiredPoints: pts ? Number(pts) : undefined,
    })
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="modal">
        <h2>Editar Trait / Enhancement</h2>
        <div className="modal-id">{e.id}</div>

        {parentSkill
          ? <div style={{ fontSize: 11, color: 'var(--muted)' }}>Vinculado a: <strong style={{ color: 'var(--accent)' }}>{parentSkill.name.en}</strong> ({parentSkill.weapon})</div>
          : <div className="badge badge-empty" style={{ display: 'inline-block', marginBottom: 4 }}>Trait órfão — não vinculado a nenhuma skill</div>}

        <div className="field-row">
          <div className="field"><label>Nome (EN)</label><input value={nameEn} onChange={ev => setNameEn(ev.target.value)} /></div>
          <div className="field"><label>Nome (PT)</label><input value={namePt} onChange={ev => setNamePt(ev.target.value)} /></div>
        </div>

        <div className="field-row">
          <div className="field"><label>Skill Base (EN)</label><input value={baseEn} onChange={ev => setBaseEn(ev.target.value)} /></div>
          <div className="field"><label>Skill Base (PT)</label><input value={basePt} onChange={ev => setBasePt(ev.target.value)} /></div>
        </div>

        <div className="field-row3">
          <div className="field">
            <label>Grade</label>
            <select value={grade} onChange={ev => setGrade(ev.target.value)}>
              {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label>Nível desbloqueio</label><input type="number" value={level} onChange={ev => setLevel(ev.target.value)} /></div>
          <div className="field"><label>Pontos req.</label><input type="number" value={pts} onChange={ev => setPts(ev.target.value)} /></div>
        </div>

        <div className="field"><label>Efeito (EN)</label><input value={effectEn} onChange={ev => setEffectEn(ev.target.value)} /></div>
        <div className="field"><label>Efeito (PT)</label><input value={effectPt} onChange={ev => setEffectPt(ev.target.value)} /></div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}
