import { useState, useMemo } from 'react'
import type { Skill, SkillEnhancement, SkillVariantFlag } from '../types'
import { ALL_WEAPONS, ALL_GRADES, ALL_TYPES } from '../types'
import WeaponSidebar from '../components/WeaponSidebar'
import { api } from '../api'

interface Props {
  skills: Skill[]
  enhancements: SkillEnhancement[]
  onUpdate: (s: Skill) => void
  markDirty: () => void
}

type SortKey = 'name' | 'weapon' | 'grade' | 'type' | 'traits' | 'variants'

const FLAG_COLOR: Record<SkillVariantFlag, string> = {
  charge: '#f59e0b', canmove: '#22c55e', hero: '#d4af37',
  specialization: '#a78bfa', trait: '#60a5fa', move: '#22c55e',
  boss: '#ef4444', notarget: '#6b7280', onetarget: '#6b7280', state: '#6b7280',
}

function FlagPill({ flag }: { flag: SkillVariantFlag }) {
  const c = FLAG_COLOR[flag]
  return (
    <span style={{
      padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
      background: c + '28', color: c, border: `1px solid ${c}44`,
    }}>{flag}</span>
  )
}

export default function SkillsTab({ skills, enhancements, onUpdate, markDirty }: Props) {
  const [weapon, setWeapon]         = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [sortKey, setSortKey]       = useState<SortKey>('name')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing]       = useState<Skill | null>(null)
  const [showVariants, setShowVariants] = useState(false)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())

  const skillById = useMemo(() => {
    const m: Record<string, Skill> = {}
    skills.forEach(s => { m[s.id] = s })
    return m
  }, [skills])

  // Sidebar conta apenas raízes por arma
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    skills.filter(s => !s.variantOf).forEach(s => { c[s.weapon] = (c[s.weapon] || 0) + 1 })
    return c
  }, [skills])

  const roots = useMemo(() => skills.filter(s => !s.variantOf), [skills])

  const visible = useMemo(() => {
    let list = weapon ? roots.filter(s => s.weapon === weapon) : roots
    if (search) {
      const q = search.toLowerCase()
      // busca em raízes e também em variantes (para encontrar "Focused Fire Bombs")
      const variantRootIds = new Set(
        skills.filter(s => s.variantOf && (
          s.name.en.toLowerCase().includes(q) ||
          s.name.pt.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        )).map(s => s.variantOf!)
      )
      list = list.filter(s =>
        s.name.en.toLowerCase().includes(q) ||
        s.name.pt.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        variantRootIds.has(s.id)
      )
    }
    return [...list].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name')     { av = a.name.en; bv = b.name.en }
      if (sortKey === 'weapon')   { av = a.weapon;  bv = b.weapon }
      if (sortKey === 'grade')    { av = a.grade;   bv = b.grade }
      if (sortKey === 'type')     { av = a.type;    bv = b.type }
      if (sortKey === 'traits')   { av = String(a.enhancementIds.length); bv = String(b.enhancementIds.length) }
      if (sortKey === 'variants') { av = String(a.variantIds?.length ?? 0); bv = String(b.variantIds?.length ?? 0) }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [roots, skills, weapon, search, sortKey, sortDir])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const arrow = (k: SortKey) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className="workspace">
      <WeaponSidebar selected={weapon} counts={counts} total={roots.length} onSelect={setWeapon} />
      <div className="main">
        <div className="toolbar">
          <input className="search" placeholder="Buscar por nome, variante ou ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className="count-badge">{visible.length} skills raiz</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showVariants} onChange={e => setShowVariants(e.target.checked)} />
            Variantes inline
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 24 }} />
                <th onClick={() => toggleSort('name')}     className={sortKey === 'name'     ? 'sorted' : ''}>Nome{arrow('name')}</th>
                <th onClick={() => toggleSort('weapon')}   className={sortKey === 'weapon'   ? 'sorted' : ''}>Arma{arrow('weapon')}</th>
                <th onClick={() => toggleSort('grade')}    className={sortKey === 'grade'    ? 'sorted' : ''}>Grade{arrow('grade')}</th>
                <th onClick={() => toggleSort('type')}     className={sortKey === 'type'     ? 'sorted' : ''}>Tipo{arrow('type')}</th>
                <th>CD</th>
                <th onClick={() => toggleSort('traits')}   className={sortKey === 'traits'   ? 'sorted' : ''}>Traits{arrow('traits')}</th>
                <th onClick={() => toggleSort('variants')} className={sortKey === 'variants' ? 'sorted' : ''}>Var.{arrow('variants')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => {
                const variantSkills = (s.variantIds ?? []).map(id => skillById[id]).filter(Boolean)
                const isExpanded = expanded.has(s.id)
                const hasVariants = variantSkills.length > 0

                return [
                  // ── Linha raiz ──
                  <tr key={s.id} onClick={() => setEditing(s)}
                    style={{ background: hasVariants ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : undefined }}>
                    <td style={{ textAlign: 'center', padding: '0 4px' }}>
                      {hasVariants && (
                        <button
                          onClick={e => { e.stopPropagation(); toggleExpand(s.id) }}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 10, padding: 2 }}>
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="cell-name">{s.name.en}<small>{s.name.pt}</small></div>
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
                    <td>
                      {hasVariants
                        ? <span className="badge" style={{ background: '#a78bfa28', color: '#a78bfa', border: '1px solid #a78bfa44' }}>{variantSkills.length}</span>
                        : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
                    </td>
                  </tr>,

                  // ── Variantes expandidas ──
                  ...(isExpanded || showVariants ? variantSkills.map(v => (
                    <tr key={v.id} onClick={() => setEditing(v)}
                      style={{ background: 'color-mix(in srgb, var(--accent) 2%, transparent)' }}>
                      <td />
                      <td style={{ paddingLeft: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 10 }}>↳</span>
                          <div className="cell-name" style={{ margin: 0 }}>
                            {v.name.en !== s.name.en
                              ? <span style={{ color: 'var(--accent2)' }}>{v.name.en}</span>
                              : <span style={{ color: 'var(--muted)' }}>{v.name.en}</span>}
                            <small>{v.name.pt}</small>
                          </div>
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {(v.variantType ?? []).map(f => <FlagPill key={f} flag={f} />)}
                          </div>
                        </div>
                        <div className="cell-id" style={{ paddingLeft: 14 }}>{v.id}</div>
                      </td>
                      <td colSpan={6} style={{ color: 'var(--muted)', fontSize: 11 }}>
                        {v.description.en !== s.description.en
                          ? v.description.en.slice(0, 80) + (v.description.en.length > 80 ? '…' : '')
                          : <span style={{ fontStyle: 'italic' }}>mesma descrição</span>}
                      </td>
                    </tr>
                  )) : []),
                ]
              })}
              {visible.length === 0 && <tr><td colSpan={8} className="no-results">Nenhuma skill encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <SkillModal
          skill={editing}
          skills={skills}
          enhancements={enhancements}
          onClose={() => setEditing(null)}
          onSave={async patch => {
            const updated = await api.updateSkill(editing.id, patch)
            onUpdate(updated); setEditing(updated); markDirty()
          }}
          onLink={async enhId => {
            const updated = await api.linkEnhancement(editing.id, enhId)
            onUpdate(updated); setEditing(updated); markDirty()
          }}
          onUnlink={async enhId => {
            const updated = await api.unlinkEnhancement(editing.id, enhId)
            onUpdate(updated); setEditing(updated); markDirty()
          }}
        />
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  skill: Skill
  skills: Skill[]
  enhancements: SkillEnhancement[]
  onClose: () => void
  onSave: (patch: Partial<Skill>) => Promise<void>
  onLink: (enhId: string) => Promise<void>
  onUnlink: (enhId: string) => Promise<void>
}

function SkillModal({ skill, skills, enhancements, onClose, onSave, onLink, onUnlink }: ModalProps) {
  const [nameEn, setNameEn] = useState(skill.name.en)
  const [namePt, setNamePt] = useState(skill.name.pt)
  const [weapon, setWeapon] = useState(skill.weapon)
  const [grade, setGrade]   = useState(skill.grade)
  const [type, setType]     = useState(skill.type)
  const [cd, setCd]         = useState(String(skill.cooldownSec ?? ''))
  const [mana, setMana]     = useState(String(skill.manaCost ?? ''))
  const [saving, setSaving] = useState(false)
  const [linkId, setLinkId] = useState('')

  const skillById   = useMemo(() => { const m: Record<string,Skill> = {}; skills.forEach(s => { m[s.id]=s }); return m }, [skills])
  const linkedEnhs  = enhancements.filter(e => skill.enhancementIds.includes(e.id))
  const unlinkable  = enhancements.filter(e => !skill.enhancementIds.includes(e.id))
  const variantList = (skill.variantIds ?? []).map(id => skillById[id]).filter(Boolean)
  const rootSkill   = skill.variantOf ? skillById[skill.variantOf] : null

  async function handleSave() {
    setSaving(true)
    await onSave({ name: { en: nameEn, pt: namePt }, weapon, grade, type,
      cooldownSec: cd ? Number(cd) : undefined, manaCost: mana ? Number(mana) : undefined })
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{skill.variantOf ? 'Variante de Skill' : 'Skill Raiz'}</h2>
        <div className="modal-id">{skill.id}</div>

        {/* Contexto hierárquico */}
        {rootSkill && (
          <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11 }}>
            <span style={{ color: 'var(--muted)' }}>Variante de: </span>
            <strong style={{ color: 'var(--accent)' }}>{rootSkill.name.en}</strong>
            <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{rootSkill.id}</span>
            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
              {(skill.variantType ?? []).map(f => <FlagPill key={f} flag={f} />)}
            </div>
          </div>
        )}

        <div className="field-row">
          <div className="field"><label>Nome (EN)</label><input value={nameEn} onChange={e => setNameEn(e.target.value)} /></div>
          <div className="field"><label>Nome (PT)</label><input value={namePt} onChange={e => setNamePt(e.target.value)} /></div>
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
          <div className="field"><label>Cooldown (s)</label><input type="number" value={cd} onChange={e => setCd(e.target.value)} /></div>
          <div className="field"><label>Mana Cost</label><input type="number" value={mana} onChange={e => setMana(e.target.value)} /></div>
        </div>

        {/* Variantes (só em raízes) */}
        {variantList.length > 0 && (
          <div className="field">
            <label>Variantes ({variantList.length})</label>
            <div className="enh-list">
              {variantList.map(v => (
                <div key={v.id} className="enh-item">
                  <div style={{ flex: 1 }}>
                    <span style={{ color: v.name.en !== skill.name.en ? 'var(--accent2)' : 'var(--text)' }}>{v.name.en}</span>
                    <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                      {(v.variantType ?? []).map(f => <FlagPill key={f} flag={f} />)}
                    </div>
                  </div>
                  <small style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--muted)' }}>{v.id.split('_').slice(-2).join('_')}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traits */}
        {!skill.variantOf && (
          <>
            <div className="field">
              <label>Traits ({linkedEnhs.length})</label>
              <div className="enh-list">
                {linkedEnhs.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 11 }}>Nenhum trait vinculado.</span>}
                {linkedEnhs.map(e => (
                  <div key={e.id} className="enh-item">
                    <span style={{ flex: 1 }}>{e.name.en}</span>
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
                <button className="btn btn-primary" disabled={!linkId}
                  onClick={() => { if (linkId) { onLink(linkId); setLinkId('') } }}>
                  + Vincular
                </button>
              </div>
            </div>
          </>
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
