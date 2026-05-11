import { useState, useMemo } from 'react'
import type { Skill, SkillEnhancement, WeaponMastery, SkillVariantFlag } from '../types'
import { ALL_WEAPONS } from '../types'

interface Props {
  skills: Skill[]
  enhancements: SkillEnhancement[]
  masteries: WeaponMastery[]
}

const FLAG_LABEL: Record<SkillVariantFlag, string> = {
  charge:         'Charge',
  canmove:        'Move',
  hero:           'Hero',
  specialization: 'Spec',
  trait:          'Trait',
  move:           'Move',
  boss:           'Boss',
  notarget:       'NoTarget',
  onetarget:      '1Target',
  state:          'Estado',
}

const FLAG_COLOR: Record<SkillVariantFlag, string> = {
  charge:         '#f59e0b',
  canmove:        '#22c55e',
  hero:           '#d4af37',
  specialization: '#a78bfa',
  trait:          '#60a5fa',
  move:           '#22c55e',
  boss:           '#ef4444',
  notarget:       '#6b7280',
  onetarget:      '#6b7280',
  state:          '#6b7280',
}

function FlagBadge({ flag }: { flag: SkillVariantFlag }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 5px', borderRadius: 3,
      fontSize: 9, fontWeight: 700, letterSpacing: .4,
      background: FLAG_COLOR[flag] + '28', color: FLAG_COLOR[flag],
      border: `1px solid ${FLAG_COLOR[flag]}44`,
    }}>
      {FLAG_LABEL[flag]}
    </span>
  )
}

export default function HierarchyTab({ skills, enhancements, masteries }: Props) {
  const [selectedWeapon, setSelectedWeapon] = useState<string>(ALL_WEAPONS[0])
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())
  const [showMasteries, setShowMasteries]   = useState(true)
  const [showVariants, setShowVariants]     = useState(true)
  const [filterType, setFilterType]         = useState<string>('all')

  const skillById = useMemo(() => {
    const m: Record<string, Skill> = {}
    skills.forEach(s => { m[s.id] = s })
    return m
  }, [skills])

  const enhById = useMemo(() => {
    const m: Record<string, SkillEnhancement> = {}
    enhancements.forEach(e => { m[e.id] = e })
    return m
  }, [enhancements])

  // Apenas skills raiz da arma selecionada (SkillSet_ ou órfãs sem variantOf)
  const rootSkills = useMemo(() =>
    skills
      .filter(s => s.weapon === selectedWeapon && !s.variantOf)
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.en.localeCompare(b.name.en)),
  [skills, selectedWeapon])

  const filteredRoots = useMemo(() =>
    filterType === 'all' ? rootSkills : rootSkills.filter(s => s.type === filterType),
  [rootSkills, filterType])

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
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const types = useMemo(() => ['all', ...Array.from(new Set(rootSkills.map(s => s.type))).sort()], [rootSkills])

  const byType = useMemo(() => {
    const groups: Record<string, Skill[]> = {}
    filteredRoots.forEach(s => {
      if (!groups[s.type]) groups[s.type] = []
      groups[s.type].push(s)
    })
    return groups
  }, [filteredRoots])

  function expandAll() { setExpandedSkills(new Set(filteredRoots.map(s => s.id))) }
  function collapseAll() { setExpandedSkills(new Set()) }

  return (
    <div className="workspace" style={{ flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="toolbar" style={{ gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>ARMA</span>
        {ALL_WEAPONS.filter(w => w !== 'Shared').map(w => (
          <button key={w} className={`tab ${selectedWeapon === w ? 'active' : ''}`}
            onClick={() => { setSelectedWeapon(w); setExpandedSkills(new Set()) }}>
            {w}
          </button>
        ))}
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px', alignSelf: 'stretch' }} />
        {types.map(t => (
          <button key={t} className={`tab ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn ${showVariants ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setShowVariants(v => !v)}>
            Variantes
          </button>
          <button className={`btn ${showMasteries ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setShowMasteries(v => !v)}>
            Maestrias
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={expandAll}>⊕ Tudo</button>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={collapseAll}>⊖ Tudo</button>
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
                const traits    = skill.enhancementIds.map(id => enhById[id]).filter(Boolean)
                const variants  = (skill.variantIds ?? []).map(id => skillById[id]).filter(Boolean)
                const expanded  = expandedSkills.has(skill.id)
                const hasContent = traits.length > 0 || variants.length > 0

                return (
                  <div key={skill.id} className="hier-skill">
                    {/* Header da skill raiz */}
                    <div className="hier-skill-header" onClick={() => hasContent && toggleSkill(skill.id)}>
                      <span style={{ color: 'var(--muted)', fontSize: 10, width: 10 }}>
                        {hasContent ? (expanded ? '▼' : '▶') : ' '}
                      </span>
                      <span className="name">{skill.name.en}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{skill.name.pt}</span>
                      {skill.cooldownSec != null &&
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{skill.cooldownSec}s</span>}
                      <span className={`badge badge-grade-${skill.grade}`}>{skill.grade}</span>
                      {traits.length > 0 &&
                        <span className="badge badge-grade-Rare">{traits.length} traits</span>}
                      {variants.length > 0 &&
                        <span className="badge" style={{ background: '#a78bfa28', color: '#a78bfa', border: '1px solid #a78bfa44' }}>
                          {variants.length} variantes
                        </span>}
                    </div>

                    {expanded && (
                      <div className="hier-skill-traits">
                        {/* ── Traits / Enhancements ── */}
                        {traits.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, padding: '4px 0 2px' }}>
                              Traits ({traits.length})
                            </div>
                            {traits.map(t => (
                              <div key={t.id} className="trait-row">
                                <strong style={{ minWidth: 180 }}>{t.name.en}</strong>
                                <span style={{ flex: 1 }}>{t.effect.en}</span>
                                <span className={`badge badge-grade-${t.grade}`}>{t.grade}</span>
                                {t.requiredPoints != null &&
                                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t.requiredPoints}pts</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Variantes ── */}
                        {showVariants && variants.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, padding: '4px 0 2px' }}>
                              Variantes ({variants.length})
                            </div>
                            {variants.map(v => (
                              <div key={v.id} className="trait-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 3 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                                  <strong style={{ flex: 1 }}>
                                    {v.name.en !== skill.name.en
                                      ? <><span style={{ color: 'var(--accent2)' }}>{v.name.en}</span><span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>↳ forma transformada</span></>
                                      : v.name.en}
                                  </strong>
                                  <div style={{ display: 'flex', gap: 3 }}>
                                    {(v.variantType ?? []).map(f => <FlagBadge key={f} flag={f} />)}
                                  </div>
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--muted)' }}>{v.id}</div>
                                {v.description.en !== skill.description.en && (
                                  <div style={{ fontSize: 10, color: 'var(--muted)', paddingLeft: 8 }}>
                                    {v.description.en.slice(0, 120)}{v.description.en.length > 120 ? '…' : ''}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Links quebrados */}
                        {skill.enhancementIds.filter(id => !enhById[id]).map(id => (
                          <div key={id} className="trait-row">
                            <strong style={{ color: 'var(--accent2)' }}>Link quebrado</strong>
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
            <div className="hier-weapon-header">
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
                        <strong style={{ minWidth: 180 }}>{m.name.en}</strong>
                        <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>
                          {m.description.en.slice(0, 120)}{m.description.en.length > 120 ? '…' : ''}
                        </span>
                        <span className={`badge badge-grade-${m.grade}`}>{m.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {weaponMasteries.length === 0 && (
                <div className="no-results">Nenhuma maestria para {selectedWeapon}.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
