import { useState, useMemo } from 'react'
import type { Skill, SkillEnhancement, WeaponMastery } from '../types'
import { ALL_WEAPONS } from '../types'

interface Props {
  skills: Skill[]
  enhancements: SkillEnhancement[]
  masteries: WeaponMastery[]
}

export default function HierarchyTab({ skills, enhancements, masteries }: Props) {
  const [selectedWeapon, setSelectedWeapon] = useState<string>(ALL_WEAPONS[0])
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [showMasteries, setShowMasteries]   = useState(true)

  const enhById = useMemo(() => {
    const m: Record<string, SkillEnhancement> = {}
    enhancements.forEach(e => { m[e.id] = e })
    return m
  }, [enhancements])

  const weaponSkills = useMemo(() =>
    skills.filter(s => s.weapon === selectedWeapon)
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.en.localeCompare(b.name.en)),
  [skills, selectedWeapon])

  const weaponMasteries = useMemo(() =>
    masteries.filter(m => m.weapon === selectedWeapon),
  [masteries, selectedWeapon])

  const masteryByCategory = useMemo(() => {
    const groups: Record<string, WeaponMastery[]> = {}
    weaponMasteries.forEach(m => {
      const cat = m.category.en || 'Sem categoria'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(m)
    })
    return groups
  }, [weaponMasteries])

  function toggleSkill(id: string) {
    setExpandedSkills(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpandedSkills(new Set(weaponSkills.map(s => s.id)))
  }
  function collapseAll() {
    setExpandedSkills(new Set())
  }

  const byType = useMemo(() => {
    const groups: Record<string, Skill[]> = {}
    weaponSkills.forEach(s => {
      if (!groups[s.type]) groups[s.type] = []
      groups[s.type].push(s)
    })
    return groups
  }, [weaponSkills])

  return (
    <div className="workspace" style={{ flexDirection: 'column', overflow: 'hidden' }}>
      {/* toolbar */}
      <div className="toolbar" style={{ gap: 12, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>ARMA</span>
        {ALL_WEAPONS.filter(w => w !== 'Shared').map(w => (
          <button
            key={w}
            className={`tab ${selectedWeapon === w ? 'active' : ''}`}
            onClick={() => { setSelectedWeapon(w); setExpandedSkills(new Set()) }}
          >
            {w}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={expandAll}>Expandir tudo</button>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={collapseAll}>Recolher tudo</button>
          <button className={`btn ${showMasteries ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setShowMasteries(v => !v)}>
            Maestrias
          </button>
        </span>
      </div>

      <div className="hierarchy">
        {/* ── Skills por tipo ── */}
        {Object.entries(byType).map(([type, typeSkills]) => (
          <div key={type} className="hier-weapon">
            <div className="hier-weapon-header">
              <h3>
                <span className={`badge badge-${type}`} style={{ marginRight: 8 }}>{type}</span>
                {typeSkills.length} skills
              </h3>
            </div>
            <div className="hier-weapon-body">
              {typeSkills.map(skill => {
                const traits = skill.enhancementIds.map(id => enhById[id]).filter(Boolean)
                const expanded = expandedSkills.has(skill.id)
                return (
                  <div key={skill.id} className="hier-skill">
                    <div className="hier-skill-header" onClick={() => toggleSkill(skill.id)}>
                      <span style={{ color: 'var(--muted)', fontSize: 10 }}>{expanded ? '▼' : '▶'}</span>
                      <span className="name">{skill.name.en}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{skill.name.pt}</span>
                      {skill.cooldownSec && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{skill.cooldownSec}s</span>}
                      <span className={`badge badge-grade-${skill.grade}`}>{skill.grade}</span>
                      {traits.length > 0
                        ? <span className="badge badge-grade-Rare">{traits.length} traits</span>
                        : <span className="badge badge-grade-Common">0 traits</span>}
                    </div>
                    {expanded && (
                      <div className="hier-skill-traits">
                        {traits.length === 0 && (
                          <span style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 0' }}>Nenhum trait vinculado.</span>
                        )}
                        {traits.map(t => (
                          <div key={t.id} className="trait-row">
                            <strong>{t.name.en}</strong>
                            <span>{t.effect.en}</span>
                            <span className={`badge badge-grade-${t.grade}`}>{t.grade}</span>
                            {t.requiredPoints && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t.requiredPoints}pts</span>}
                          </div>
                        ))}
                        {skill.enhancementIds.filter(id => !enhById[id]).map(id => (
                          <div key={id} className="trait-row">
                            <strong style={{ color: 'var(--accent2)' }}>ID não encontrado</strong>
                            <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ── Maestrias por categoria ── */}
        {showMasteries && (
          <div className="hier-weapon">
            <div className="hier-weapon-header" onClick={() => setShowMasteries(v => !v)}>
              <h3>
                <span className="badge badge-weapon" style={{ marginRight: 8 }}>Maestrias</span>
                {weaponMasteries.length} entradas
              </h3>
            </div>
            <div className="hier-weapon-body">
              {Object.entries(masteryByCategory).map(([cat, items]) => (
                <div key={cat} className="hier-skill">
                  <div className="hier-skill-header" style={{ cursor: 'default' }}>
                    <span className="name">{cat}</span>
                    <span className="badge badge-grade-Rare">{items.length}</span>
                  </div>
                  <div className="hier-skill-traits">
                    {items.map(m => (
                      <div key={m.id} className="trait-row">
                        <strong>{m.name.en}</strong>
                        <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>{m.description.en.slice(0, 100)}{m.description.en.length > 100 ? '…' : ''}</span>
                        <span className={`badge badge-grade-${m.grade}`}>{m.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {weaponMasteries.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Nenhuma maestria para esta arma.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
