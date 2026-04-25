import React, { useState, useMemo } from 'react'
import { useSkillsDB } from '../store/useSkillsDB'
import type { SkillDBEntry, SkillCategory } from '../store/useSkillsDB'
import { WEAPON_TYPES } from '../engine/constants'
import { NumericInput } from '../components/NumericInput'
import { useT } from '../i18n/useT'

// ─── Design tokens ─────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid rgba(124,92,252,0.18)',
  borderRadius: 8,
  padding: '0.75rem',
}

const baseInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(124,92,252,0.2)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '3px 6px',
  fontSize: '0.8rem',
}

const optionStyle: React.CSSProperties = {
  background: '#1a1b2e',
  color: '#e2e4ec',
}

const th: React.CSSProperties = {
  fontSize: '0.62rem',
  color: '#7a8099',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  padding: '5px 6px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(0,0,0,0.15)',
}

const td: React.CSSProperties = {
  padding: '2px 4px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIES: SkillCategory[] = ['active', 'passive', 'proc', 'item', 'mastery']

const GRADE_COLOR: Record<string, string> = {
  Common:   '#9ca3af',
  Uncommon: '#4ade80',
  Rare:     '#60a5fa',
  Epic:     '#c084fc',
}

const CATEGORY_COLOR: Record<SkillCategory, string> = {
  active:  '#a78bfa',
  passive: '#4ade80',
  proc:    '#f97316',
  item:    '#22d3ee',
  mastery: '#f0cc55',
}

function numIn(
  val: number,
  onChange: (v: number) => void,
  width = 68,
  step = 1,
): React.ReactElement {
  return (
    <NumericInput
      value={val}
      onChange={onChange}
      style={{ ...baseInput, width }}
    />
  )
}

// ─── Linha editável ────────────────────────────────────────────────────────────

interface RowProps {
  entry:    SkillDBEntry
  onUpdate: (patch: Partial<SkillDBEntry>) => void
  onDelete: () => void
}

function EntryRow({ entry, onUpdate, onDelete }: RowProps): React.ReactElement {
  const t = useT()
  const gradeColor = GRADE_COLOR[entry.grade] ?? '#7a8099'
  const descSnippet = (entry.description || '').split('\n')[0].slice(0, 60)
  return (
    <tr>
      <td style={td}>
        <input
          value={entry.name}
          onChange={e => onUpdate({ name: e.target.value })}
          style={{ ...baseInput, width: 190 }}
        />
      </td>
      <td style={{ ...td, fontSize: '0.72rem', color: '#b0b8d0' }} title={entry.nameEn}>
        {entry.nameEn || '—'}
      </td>
      <td style={td}>
        <select
          value={entry.weaponType}
          onChange={e => onUpdate({ weaponType: e.target.value })}
          style={{ ...baseInput, width: 120 }}
        >
          {WEAPON_TYPES.map(w => <option key={w} value={w} style={optionStyle}>{w}</option>)}
        </select>
      </td>
      <td style={td}>
        <select
          value={entry.category}
          onChange={e => onUpdate({ category: e.target.value as SkillCategory })}
          style={{ ...baseInput, width: 82, color: CATEGORY_COLOR[entry.category] }}
        >
          {CATEGORIES.map(c => <option key={c} value={c} style={optionStyle}>{c}</option>)}
        </select>
      </td>
      <td style={{ ...td, textAlign: 'center' }}>
        <span style={{
          fontSize: '0.68rem', fontWeight: 600, color: gradeColor,
          background: `${gradeColor}15`, padding: '1px 6px', borderRadius: 3,
          border: `1px solid ${gradeColor}30`,
        }}>
          {entry.grade || '—'}
        </span>
      </td>
      <td style={td}>{numIn(entry.castTime,     v => onUpdate({ castTime:     v }), 52, 0.1)}</td>
      <td style={td}>{numIn(entry.cooldown,      v => onUpdate({ cooldown:      v }), 52, 0.5)}</td>
      <td style={td}>{numIn(entry.manaCost,      v => onUpdate({ manaCost:      v }), 58)}</td>
      <td style={td}>{numIn(entry.skillDmgPct,  v => onUpdate({ skillDmgPct:  v }), 62)}</td>
      <td style={td}>{numIn(entry.bonusBaseDmg, v => onUpdate({ bonusBaseDmg: v }), 62)}</td>
      <td style={td}>{numIn(entry.hits,          v => onUpdate({ hits:          v }), 46)}</td>
      <td style={td}>{numIn(entry.monsterBonus,  v => onUpdate({ monsterBonus:  v }), 52)}</td>
      <td style={td}>{numIn(entry.dmgBonus,      v => onUpdate({ dmgBonus:      v }), 52)}</td>
      <td style={{ ...td, fontSize: '0.68rem', color: '#8a90a8', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: entry.description ? 'help' : 'default' }} title={entry.description || undefined}>
        {descSnippet || '—'}
      </td>
      <td style={{ ...td, width: 28 }}>
        <button
          onClick={onDelete}
          title={t('skillsdb.table.removeTooltip')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a8099', fontSize: '1rem', lineHeight: 1, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7a8099')}
        >
          ×
        </button>
      </td>
    </tr>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export function SkillsDB(): React.ReactElement {
  const t = useT()
  const { entries, loading, loadFromDisk, addEntry, updateEntry, removeEntry, resetToDefault } = useSkillsDB()

  const [search,       setSearch]       = useState('')
  const [filterWeapon, setFilterWeapon] = useState('Todos')
  const [filterCat,    setFilterCat]    = useState<'Todos' | SkillCategory>('Todos')
  const [confirmReset, setConfirmReset] = useState(false)

  // Carrega uma vez
  React.useEffect(() => { if (entries.length === 0 && !loading) loadFromDisk() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter(e => {
      if (filterWeapon !== 'Todos' && e.weaponType !== filterWeapon) return false
      if (filterCat    !== 'Todos' && e.category    !== filterCat)    return false
      if (q && !e.name.toLowerCase().includes(q))                     return false
      return true
    })
  }, [entries, search, filterWeapon, filterCat])

  function handleAdd(): void {
    addEntry({
      name: '', nameEn: '', weaponType: 'Staff', category: 'active',
      castTime: 1, cooldown: 0, manaCost: 0, grade: '', description: '',
      skillDmgPct: 0, bonusBaseDmg: 0, hits: 1, monsterBonus: 0, dmgBonus: 0,
    })
  }

  function handleReset(): void {
    if (!confirmReset) { setConfirmReset(true); return }
    resetToDefault()
    setConfirmReset(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1rem', paddingTop: '2.5rem', gap: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: '#7c5cfc', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 2 }}>
            {t('skillsdb.header.title')}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0cc55' }}>
            {entries.length} {t('skillsdb.header.count')}
          </div>
        </div>

        {/* Filtros */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('skillsdb.search.placeholder')}
          style={{ ...baseInput, width: 200 }}
        />
        <select
          value={filterWeapon}
          onChange={e => setFilterWeapon(e.target.value)}
          style={{ ...baseInput, width: 130 }}
        >
          <option value="Todos" style={optionStyle}>{t('skillsdb.filter.allWeapons')}</option>
          {WEAPON_TYPES.map(w => <option key={w} value={w} style={optionStyle}>{w}</option>)}
        </select>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value as typeof filterCat)}
          style={{ ...baseInput, width: 110 }}
        >
          <option value="Todos" style={optionStyle}>{t('skillsdb.filter.allCategories')}</option>
          {CATEGORIES.map(c => <option key={c} value={c} style={optionStyle}>{c}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={handleAdd}
            style={{
              fontSize: '0.75rem', padding: '4px 14px',
              background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 5, color: '#f0cc55', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {t('skillsdb.button.addSkill')}
          </button>
          <button
            onClick={handleReset}
            onBlur={() => setConfirmReset(false)}
            style={{
              fontSize: '0.75rem', padding: '4px 14px',
              background: confirmReset ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${confirmReset ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 5, color: '#f87171', cursor: 'pointer',
            }}
          >
            {confirmReset ? t('skillsdb.button.confirmReset') : t('skillsdb.button.resetDefault')}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ ...panel, flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ color: '#474f6b', fontSize: '0.85rem', padding: '1.5rem', textAlign: 'center' }}>
            {t('skillsdb.table.loading')}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ ...th, minWidth: 190 }}>Nome</th>
                <th style={{ ...th, minWidth: 120 }}>{t('skillsdb.table.nameEn')}</th>
                <th style={{ ...th, minWidth: 120 }}>{t('skillsdb.table.weapon')}</th>
                <th style={{ ...th, minWidth: 82  }}>{t('skillsdb.table.category')}</th>
                <th style={{ ...th, minWidth: 62  }}>{t('skillsdb.table.grade')}</th>
                <th style={{ ...th, minWidth: 52  }} title={t('skillsdb.table.castTooltip')}>Cast</th>
                <th style={{ ...th, minWidth: 52  }} title={t('skillsdb.table.cooldownTooltip')}>CD</th>
                <th style={{ ...th, minWidth: 58  }} title={t('skillsdb.table.manaTooltip')}>Mana</th>
                <th style={{ ...th, minWidth: 62  }} title={t('skillsdb.table.dmgPercentTooltip')}>Dmg %</th>
                <th style={{ ...th, minWidth: 62  }} title={t('skillsdb.table.bonusBaseDmgTooltip')}>+ Base</th>
                <th style={{ ...th, minWidth: 46  }} title={t('skillsdb.table.hitsTooltip')}>Hits</th>
                <th style={{ ...th, minWidth: 52  }} title={t('skillsdb.table.mobPercentTooltip')}>Mob %</th>
                <th style={{ ...th, minWidth: 52  }} title={t('skillsdb.table.dmgBonusTooltip')}>+Dano %</th>
                <th style={{ ...th, minWidth: 100 }}>{t('skillsdb.table.description')}</th>
                <th style={{ ...th, width: 28     }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={15} style={{ ...td, color: '#474f6b', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                    {entries.length === 0 ? t('skillsdb.table.emptyState') : t('skillsdb.table.noResults')}
                  </td>
                </tr>
              )}
              {filtered.map(entry => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onUpdate={patch => updateEntry(entry.id, patch)}
                  onDelete={() => removeEntry(entry.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: '0.65rem', color: '#474f6b' }}>
        {t('skillsdb.footer.damageFieldsNote')}
      </div>
    </div>
  )
}
