import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRotation } from '../store/useRotation'
import { useBuilds }   from '../store/useBuilds'
import { useLogTimeline } from '../store/useLogTimeline'
import type { LogTimelineData } from '../store/useLogTimeline'
import { calcRotationResult, effectiveCDRPct, calcSkillAvgDamage, calcDotResult, calcTimelineDps } from '../engine/rotationEngine'
import { NumericInput } from '../components/NumericInput'
import { useT } from '../i18n/useT'
import { useSkillsDB, filterSkillsByWeapons } from '../store/useSkillsDB'
import type { SkillDBEntry } from '../store/useSkillsDB'
import { WEAPON_TYPES } from '../engine/constants'
import type {
  RotationCharacter,
  RotationSkill,
  RotationDot,
  RotationBuff,
  RotationRule,
  CastEvent,
  BuffType,
  Rotation,
  Stellarite,
  SkillWeapon,
} from '../engine/types'

// ─── Design tokens ────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid rgba(124,92,252,0.18)',
  borderRadius: 8,
  padding: '0.75rem',
}

const sectionDivider: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
  paddingTop: '0.4rem',
  marginTop: '0.15rem',
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.6rem',
  color: '#7c5cfc',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 700,
  marginBottom: '0.25rem',
}

const fieldLabel: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#7a8099',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 2,
}

const baseInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(124,92,252,0.2)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '3px 6px',
  fontSize: '0.82rem',
}

const WEAPON_COLOR: Record<string, string> = {
  'Staff':          '#a78bfa',
  'Wand & Tome':    '#60a5fa',
  'Longbow':        '#4ade80',
  'Crossbow':       '#86efac',
  'Dagger':         '#f97316',
  'Greatsword':     '#ef4444',
  'Sword & Shield': '#f59e0b',
  'Spear':          '#ec4899',
  'Orb':            '#22d3ee',
  'Item/Proc':      '#94a3b8',
}

const th: React.CSSProperties = {
  fontSize: '0.63rem',
  color: '#7a8099',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  padding: '5px 7px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(0,0,0,0.15)',
}

const td: React.CSSProperties = {
  padding: '3px 6px',
  fontSize: '0.8rem',
  color: 'var(--text)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function numInput(
  val: number,
  onChange: (v: number) => void,
  opts: { width?: number; step?: number; error?: boolean } = {},
): React.ReactElement {
  return (
    <NumericInput
      value={val}
      onChange={onChange}
      style={{
        ...baseInput,
        width: opts.width ?? 94,
        border: opts.error
          ? '1px solid rgba(239,68,68,0.55)'
          : '1px solid rgba(124,92,252,0.2)',
      }}
    />
  )
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: decimals })
}

/** CDR com diminishing returns — cap 120%. Inline do engine para uso na Timeline. */
function localApplyCD(baseCD: number, cdrPct: number): number {
  return baseCD / (1 + Math.min(cdrPct, 120) / 100)
}

function newSkillId(): string {
  return `sk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
}

function newDotId(): string {
  return `dot_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
}

// Hook para indicador de auto-save
function useAutoSave(dep: unknown): string {
  const t = useT()
  const [status, setStatus] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    setStatus(t('rotation.autoSave.saving'))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(t('rotation.autoSave.saved')), 600)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [dep, t])

  return status
}

// ─── Card DPS (destaque) ─────────────────────────────────────────────────────

interface DpsCardProps {
  totalDps:    number
  timelineDps: number | null
  skillCount:  number
  dotCount:    number
  buffCount:   number
}

function DpsCard({ totalDps, timelineDps, skillCount, dotCount, buffCount }: DpsCardProps): React.ReactElement {
  const t = useT()
  const displayDps    = timelineDps ?? totalDps
  const fromTimeline  = timelineDps !== null

  return (
    <div style={{
      background: 'rgba(212,175,55,0.07)',
      border: '1px solid rgba(212,175,55,0.25)',
      borderRadius: 10,
      padding: '0.75rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: '0.6rem', color: '#7a8099', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          {t('rotation.card.dpsTotal')}{fromTimeline ? t('rotation.timeline.planned') : t('rotation.card.seconds')}
        </div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f0cc55', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {fmt(displayDps)}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#474f6b' }}>
        <div>{skillCount} skill{skillCount !== 1 ? 's' : ''} ativas</div>
        <div>{dotCount} DoT{dotCount !== 1 ? 's' : ''}</div>
        <div style={{ color: '#22d3ee' }}>{buffCount} buff{buffCount !== 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

// ─── Painel do Personagem ─────────────────────────────────────────────────────

interface CharPanelProps {
  char:          RotationCharacter
  onChange:      (patch: Partial<RotationCharacter>) => void
  onImportBuild: () => void
  saveStatus:    string
}

function CharacterPanel({ char, onChange, onImportBuild, saveStatus }: CharPanelProps): React.ReactElement {
  const t = useT()
  const critTotal  = char.critChanceBase + char.critChanceBoss
  const heavyTotal = char.heavyChanceBase + char.heavyChanceBoss
  const eff       = Math.max(0, critTotal - char.targetEndurance)
  const critPct   = eff       > 0 ? (eff       / (eff       + 1000)) * 100 : 0
  const heavyPct  = heavyTotal > 0 ? (heavyTotal / (heavyTotal + 1000)) * 100 : 0
  const cdrEff    = effectiveCDRPct(char.cdrPct)
  const asEff     = Math.min(char.attackSpeedPct, 150)
  const advEff    = Math.min(char.advDurPct, 150)

  const cdrOver = char.cdrPct > 120
  const asOver  = char.attackSpeedPct > 150
  const advOver = char.advDurPct > 150

  return (
    <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {t('rotation.character.title')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveStatus && (
            <span style={{ fontSize: '0.65rem', color: saveStatus.includes('✓') ? '#4ade80' : '#7a8099' }}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={onImportBuild}
            title={t('rotation.character.importTooltip')}
            style={{
              fontSize: '0.72rem', padding: '3px 10px',
              background: 'rgba(124,92,252,0.12)',
              border: '1px solid rgba(124,92,252,0.28)',
              borderRadius: 4, color: '#a78bfa', cursor: 'pointer',
            }}
          >
            {t('rotation.character.importButton')}
          </button>
        </div>
      </div>

      {/* ── ARMAS ─────────────────────────────────────── */}
      <div style={sectionDivider}>
        <div style={sectionLabel}>{t('rotation.character.weapons')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          <div>
            <div style={fieldLabel}>{t('rotation.character.weaponMain')} <span style={{ color: '#f0cc55' }}>({t('rotation.character.autoAttack')})</span></div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={char.weaponMainType} onChange={e => onChange({ weaponMainType: e.target.value })}
                style={{ ...baseInput, width: 122 }}>
                {WEAPON_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <span style={{ fontSize: '0.72rem', color: '#474f6b' }}>{t('rotation.character.min')}</span>
              {numInput(char.weaponMainDmgMin, v => onChange({ weaponMainDmgMin: v }), { width: 78 })}
              <span style={{ fontSize: '0.72rem', color: '#474f6b' }}>{t('rotation.character.max')}</span>
              {numInput(char.weaponMainDmgMax, v => onChange({ weaponMainDmgMax: v }), { width: 78 })}
              <span style={{ fontSize: '0.72rem', color: '#474f6b' }} title={t('rotation.character.weaponSpeedTooltip')}>{t('rotation.character.weaponSpeed')}</span>
              {numInput(char.weaponMainAttackSpeedBase, v => onChange({ weaponMainAttackSpeedBase: v }), { width: 65, step: 0.01 })}
            </div>
          </div>
          <div>
            <div style={fieldLabel}>{t('rotation.character.weaponSecondary')} <span style={{ color: '#474f6b' }}>({t('rotation.character.skillsOnly')})</span></div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={char.weaponOffType} onChange={e => onChange({ weaponOffType: e.target.value })}
                style={{ ...baseInput, width: 122 }}>
                {WEAPON_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <span style={{ fontSize: '0.72rem', color: '#474f6b' }}>{t('rotation.character.min')}</span>
              {numInput(char.weaponOffDmgMin, v => onChange({ weaponOffDmgMin: v }), { width: 78 })}
              <span style={{ fontSize: '0.72rem', color: '#474f6b' }}>{t('rotation.character.max')}</span>
              {numInput(char.weaponOffDmgMax, v => onChange({ weaponOffDmgMax: v }), { width: 78 })}
            </div>
          </div>
        </div>

        {/* Stellarite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem' }}>
          <span style={fieldLabel}>{t('rotation.character.stellarite')}</span>
          {(['none', 'common', 'rare'] as Stellarite[]).map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.78rem', color: char.stellarite === opt ? '#f0cc55' : '#7a8099' }}>
              <input type="radio" name="stellarite" checked={char.stellarite === opt} onChange={() => onChange({ stellarite: opt })} />
              {opt === 'none' ? t('rotation.character.stellariteNone') : opt === 'common' ? t('rotation.character.stellariteCommon') : t('rotation.character.stellariteRare')}
            </label>
          ))}
        </div>
      </div>

      {/* ── STATS DE COMBATE ──────────────────────────── */}
      <div style={sectionDivider}>
        <div style={sectionLabel}>{t('rotation.character.combatStats')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.3rem' }}>
          {/* CDR */}
          <div>
            <div style={fieldLabel}>{t('rotation.character.cooldownReduction')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {numInput(char.cdrPct, v => onChange({ cdrPct: v }), { step: 0.1, error: cdrOver })}
              <span style={{ fontSize: '0.7rem', color: cdrOver ? '#f87171' : '#7a8099', whiteSpace: 'nowrap' }}>
                → {cdrEff.toFixed(2)}%{cdrOver ? ` ${t('rotation.character.cooldownCap')}` : ''}
              </span>
            </div>
          </div>
          {/* Attack Speed */}
          <div>
            <div style={fieldLabel}>{t('rotation.character.attackSpeed')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {numInput(char.attackSpeedPct, v => onChange({ attackSpeedPct: v }), { step: 0.1, error: asOver })}
              <span style={{ fontSize: '0.7rem', color: asOver ? '#f87171' : '#7a8099', whiteSpace: 'nowrap' }}>
                → {asEff.toFixed(2)}%{asOver ? ` ${t('rotation.character.attackSpeedCap')}` : ''}
              </span>
            </div>
          </div>
          {/* Adv Duration */}
          <div>
            <div style={fieldLabel}>{t('rotation.character.advantageDuration')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {numInput(char.advDurPct, v => onChange({ advDurPct: v }), { step: 0.1, error: advOver })}
              <span style={{ fontSize: '0.7rem', color: advOver ? '#f87171' : '#7a8099', whiteSpace: 'nowrap' }}>
                → {advEff.toFixed(2)}%{advOver ? ` ${t('rotation.character.attackSpeedCap')}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Crit e Heavy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
          <div>
            <div style={fieldLabel}>{t('rotation.character.critChance')} &nbsp;<span style={{ color: '#474f6b' }}>+ boss</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {numInput(char.critChanceBase, v => onChange({ critChanceBase: v }), { width: 88 })}
              <span style={{ color: '#474f6b', fontSize: '0.8rem' }}>+</span>
              {numInput(char.critChanceBoss, v => onChange({ critChanceBoss: v }), { width: 88 })}
              <span style={{ fontSize: '0.72rem', color: '#a78bfa', whiteSpace: 'nowrap', marginLeft: 2 }}>= {critPct.toFixed(2)}%</span>
            </div>
          </div>
          <div>
            <div style={fieldLabel}>{t('rotation.character.critDamage')}</div>
            {numInput(char.critDmgPct, v => onChange({ critDmgPct: v }), { width: 104 })}
          </div>

          <div>
            <div style={fieldLabel}>{t('rotation.character.heavyChance')} &nbsp;<span style={{ color: '#474f6b' }}>+ boss</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {numInput(char.heavyChanceBase, v => onChange({ heavyChanceBase: v }), { width: 88 })}
              <span style={{ color: '#474f6b', fontSize: '0.8rem' }}>+</span>
              {numInput(char.heavyChanceBoss, v => onChange({ heavyChanceBoss: v }), { width: 88 })}
              <span style={{ fontSize: '0.72rem', color: '#a78bfa', whiteSpace: 'nowrap', marginLeft: 2 }}>= {heavyPct.toFixed(2)}%</span>
            </div>
          </div>
          <div>
            <div style={fieldLabel}>{t('rotation.character.heavyDamage')}</div>
            {numInput(char.heavyDmgPct, v => onChange({ heavyDmgPct: v }), { width: 104 })}
          </div>
        </div>
      </div>

      {/* ── MODIFICADORES ─────────────────────────────── */}
      <div style={sectionDivider}>
        <div style={sectionLabel}>{t('rotation.character.modifiers')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
          <div>
            <div style={fieldLabel} title={t('rotation.character.skillDmgBoostTooltip')}>{t('rotation.character.skillDmgBoost')}</div>
            {numInput(char.skillDmgBoost, v => onChange({ skillDmgBoost: v }))}
          </div>
          <div>
            <div style={fieldLabel} title={t('rotation.character.speciesBoostTooltip')}>{t('rotation.character.speciesBoost')}</div>
            {numInput(char.speciesDmgBoost, v => onChange({ speciesDmgBoost: v }))}
          </div>
          <div>
            <div style={fieldLabel} title={t('rotation.character.bonusDamageTooltip')}>{t('rotation.character.bonusDamage')}</div>
            {numInput(char.bonusDamage, v => onChange({ bonusDamage: v }))}
          </div>
          <div>
            <div style={fieldLabel} title={t('rotation.character.itemBoostTooltip')}>{t('rotation.character.itemBoost')}</div>
            {numInput(char.dmgBoost * 100, v => onChange({ dmgBoost: v / 100 }), { step: 0.1 })}
          </div>
        </div>
      </div>

      {/* ── ALVO ──────────────────────────────────────── */}
      <div style={sectionDivider}>
        <div style={sectionLabel}>{t('rotation.character.target')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0.35rem', alignItems: 'end' }}>
          <div>
            <div style={fieldLabel}>{t('rotation.character.targetDefense')}</div>
            {numInput(char.targetDefense, v => onChange({ targetDefense: v }))}
          </div>
          <div>
            <div style={fieldLabel}>{t('rotation.character.targetEndurance')}</div>
            {numInput(char.targetEndurance, v => onChange({ targetEndurance: v }))}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#474f6b', paddingBottom: 4 }}>
            {t('rotation.character.enduranceNote')}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SkillPicker ─────────────────────────────────────────────────────────────

interface SkillPickerProps {
  currentName:  string
  skillDbId:    string | undefined
  weaponTypes:  string[]
  onNameChange: (name: string) => void
  onSelect:     (entry: SkillDBEntry) => void
  onClear:      () => void
  placeholder?: string
}

function SkillPicker({
  currentName, skillDbId, weaponTypes,
  onNameChange, onSelect, onClear, placeholder = 'Nome',
}: SkillPickerProps): React.ReactElement {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef<HTMLDivElement>(null)
  const { entries } = useSkillsDB()

  const filtered = useMemo(() => {
    const base = filterSkillsByWeapons(entries, weaponTypes)
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(e =>
      e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q)
    )
  }, [entries, weaponTypes, search])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle(): void {
    setOpen(o => !o)
    setSearch('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <input
        value={currentName}
        onChange={e => onNameChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...baseInput, width: skillDbId ? 148 : 156 }}
      />
      <button
        onClick={toggle}
        title={skillDbId ? 'Substituir skill vinculada' : 'Vincular ao Banco de Skills'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.82rem', padding: '2px 2px', lineHeight: 1,
          color: skillDbId ? '#7c5cfc' : '#474f6b',
        }}
      >
        {skillDbId ? '🔗' : '🔍'}
      </button>
      {skillDbId && (
        <button
          onClick={onClear}
          title="Desvincular (voltar para edição manual)"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', padding: '2px 1px', lineHeight: 1, color: '#7a8099' }}
        >
          ✕
        </button>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 200,
          background: 'var(--bg-panel)',
          border: '1px solid rgba(124,92,252,0.35)',
          borderRadius: 6, width: 300, maxHeight: 260,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          marginTop: 2,
        }}>
          <div style={{ padding: '5px 7px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar skill..."
              style={{ ...baseInput, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '0.6rem', color: '#474f6b', fontSize: '0.75rem', textAlign: 'center', fontStyle: 'italic' }}>
                {entries.length === 0
                  ? 'Banco vazio — adicione skills na aba Banco de Skills'
                  : 'Nenhuma skill encontrada'}
              </div>
            )}
            {filtered.map(entry => (
              <button
                key={entry.id}
                onClick={() => { onSelect(entry); setOpen(false); setSearch('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  width: '100%', padding: '4px 8px',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,92,252,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: WEAPON_COLOR[entry.weaponType] ?? '#94a3b8',
                }} />
                <span style={{ flex: 1, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}
                </span>
                <span style={{ fontSize: '0.62rem', color: '#474f6b', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {entry.castTime > 0 ? `${entry.castTime}s` : ''}
                  {entry.cooldown > 0 ? ` cd${entry.cooldown}s` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tabela de Skills ─────────────────────────────────────────────────────────

interface SkillTableProps {
  skills: RotationSkill[]
  char:   RotationCharacter
  rotId:  string
}

const SKILL_HEADERS: Array<{ label: string; title?: string }> = [
  { label: '#' },
  { label: 'Nome' },
  { label: 'Arma' },
  { label: 'Cast', title: 'Tempo de cast em segundos' },
  { label: 'CD', title: 'Cooldown base em segundos' },
  { label: 'Dmg %', title: 'Percentual de dano da skill (ex: 510 = 510%)' },
  { label: '+ Base', title: 'Bônus de dano base fixo (adicionado antes da multiplicação do Dmg %)' },
  { label: 'Hits', title: 'Número de hits por cast' },
  { label: 'Mob %', title: 'Bônus inerente da skill vs monstros (ex: 120 = +120%)' },
  { label: '+ Dano %', title: 'Bônus condicional (ex: 40 = +40% quando condição ativa)' },
  { label: 'Dano Simples', title: 'Dano médio por cast — 4 cenários crit/heavy independentes (fórmula Maxroll)' },
  { label: '' },
]

function SkillTable({ skills, char, rotId }: SkillTableProps): React.ReactElement {
  const t = useT()
  const { addSkill, updateSkill, removeSkill, moveSkill } = useRotation()

  function handleSkillSelect(skillId: string, entry: SkillDBEntry): void {
    const weaponAssignment: SkillWeapon =
      entry.weaponType === char.weaponMainType ? 'main' : 'off'
    updateSkill(rotId, skillId, {
      skillName:    entry.name,
      skillDbId:    entry.id,
      weapon:       weaponAssignment,
      castTime:     entry.castTime,
      cooldown:     entry.cooldown,
      skillDmgPct:  entry.skillDmgPct,
      bonusBaseDmg: entry.bonusBaseDmg,
      hits:         entry.hits,
      monsterBonus: entry.monsterBonus,
      dmgBonus:     entry.dmgBonus,
    })
  }

  function addRow(): void {
    addSkill(rotId, {
      id: newSkillId(), skillName: '', weapon: 'main',
      castTime: 1, cooldown: 6, skillDmgPct: 100,
      bonusBaseDmg: 0, hits: 1, monsterBonus: 0, dmgBonus: 0, enabled: true,
    })
  }

  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('rotation.skills.title')}
        </span>
        <button onClick={addRow} style={{
          fontSize: '0.72rem', padding: '3px 10px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 4, color: '#f0cc55', cursor: 'pointer',
        }}>
          {t('rotation.skills.addButton')}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {SKILL_HEADERS.map(h => (
                <th key={h.label} style={th} title={h.title}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skills.length === 0 && (
              <tr>
                <td colSpan={12} style={{ ...td, color: '#474f6b', textAlign: 'center', padding: '1.25rem', fontStyle: 'italic' }}>
                  {t('rotation.skills.emptyState')}
                </td>
              </tr>
            )}
            {skills.map((sk, idx) => {
              const avgDmg = calcSkillAvgDamage(sk, char)
              return (
                <tr key={sk.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: sk.id, itemType: 'skill' }))
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  style={{ opacity: sk.enabled ? 1 : 0.4, cursor: 'grab' }}>
                  <td style={{ ...td, width: 28 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <button onClick={() => idx > 0 && moveSkill(rotId, idx, idx - 1)}
                        style={{ background: 'none', border: 'none', color: '#474f6b', cursor: idx > 0 ? 'pointer' : 'default', fontSize: '0.6rem', padding: 0, lineHeight: 1 }}>▲</button>
                      <span style={{ fontSize: '0.7rem', color: '#474f6b' }}>{idx + 1}</span>
                      <button onClick={() => idx < skills.length - 1 && moveSkill(rotId, idx, idx + 1)}
                        style={{ background: 'none', border: 'none', color: '#474f6b', cursor: idx < skills.length - 1 ? 'pointer' : 'default', fontSize: '0.6rem', padding: 0, lineHeight: 1 }}>▼</button>
                    </div>
                  </td>
                  <td style={td}>
                    <SkillPicker
                      currentName={sk.skillName}
                      skillDbId={sk.skillDbId}
                      weaponTypes={[char.weaponMainType, char.weaponOffType]}
                      onNameChange={name => updateSkill(rotId, sk.id, { skillName: name })}
                      onSelect={entry => handleSkillSelect(sk.id, entry)}
                      onClear={() => updateSkill(rotId, sk.id, { skillDbId: undefined })}
                      placeholder={t('rotation.skills.skillName')}
                    />
                  </td>
                  <td style={td}>
                    <select value={sk.weapon} onChange={e => updateSkill(rotId, sk.id, { weapon: e.target.value as SkillWeapon })}
                      style={{ ...baseInput, width: 83 }}>
                      <option value="main">Main</option>
                      <option value="off">Off</option>
                    </select>
                  </td>
                  <td style={td}>{numInput(sk.castTime,     v => updateSkill(rotId, sk.id, { castTime:     v }), { width: 68, step: 0.01 })}</td>
                  <td style={td}>{numInput(sk.cooldown,     v => updateSkill(rotId, sk.id, { cooldown:     v }), { width: 68, step: 0.1  })}</td>
                  <td style={td}>{numInput(sk.skillDmgPct,  v => updateSkill(rotId, sk.id, { skillDmgPct:  v }), { width: 75, step: 1    })}</td>
                  <td style={td}>{numInput(sk.bonusBaseDmg, v => updateSkill(rotId, sk.id, { bonusBaseDmg: v }), { width: 75             })}</td>
                  <td style={td}>{numInput(sk.hits,         v => updateSkill(rotId, sk.id, { hits:         v }), { width: 55             })}</td>
                  <td style={td}>{numInput(sk.monsterBonus * 100, v => updateSkill(rotId, sk.id, { monsterBonus: v / 100 }), { width: 68, step: 1 })}</td>
                  <td style={td}>{numInput(sk.dmgBonus * 100,     v => updateSkill(rotId, sk.id, { dmgBonus:     v / 100 }), { width: 68, step: 1 })}</td>
                  <td style={{ ...td, color: avgDmg > 0 ? '#f0cc55' : '#474f6b', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 60 }}>
                    {avgDmg > 0 ? fmt(avgDmg) : '—'}
                  </td>
                  <td style={{ ...td, width: 52 }}>
                    <button onClick={() => updateSkill(rotId, sk.id, { enabled: !sk.enabled })}
                      title={sk.enabled ? t('rotation.skills.toggleTooltip') : t('rotation.skills.toggleTooltipInactive')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: sk.enabled ? '#4ade80' : '#474f6b', marginRight: 2 }}>
                      {sk.enabled ? '●' : '○'}
                    </button>
                    <button onClick={() => removeSkill(rotId, sk.id)} title={t('rotation.skills.removeTooltip')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#7a8099' }}>
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Bloco de DoTs ────────────────────────────────────────────────────────────

interface DotBlockProps {
  dots:  RotationDot[]
  char:  RotationCharacter
  rotId: string
}

const DOT_HEADERS: Array<{ label: string; title?: string }> = [
  { label: '#' },
  { label: 'Nome' },
  { label: 'Arma' },
  { label: 'Cast', title: 'Tempo de cast em segundos' },
  { label: 'CD', title: 'Cooldown base em segundos (define quantas vezes é reaplicado em 60s)' },
  { label: 'Dmg %', title: 'Percentual de dano por tick' },
  { label: '+ Base', title: 'Bônus de dano base fixo por tick' },
  { label: 'Ticks', title: 'Número total de ticks por aplicação do DoT' },
  { label: 'Mob %', title: 'Bônus vs monstros' },
  { label: '+ Dano %', title: 'Bônus condicional' },
  { label: 'DPS', title: 'Dano por segundo considerando reaplicações no cooldown' },
  { label: '' },
]

function DotBlock({ dots, char, rotId }: DotBlockProps): React.ReactElement {
  const t = useT()
  const { addDot, updateDot, removeDot } = useRotation()

  function handleDotSelect(dotId: string, entry: SkillDBEntry): void {
    const weaponAssignment: SkillWeapon =
      entry.weaponType === char.weaponMainType ? 'main' : 'off'
    updateDot(rotId, dotId, {
      dotName:      entry.name,
      skillDbId:    entry.id,
      weapon:       weaponAssignment,
      castTime:     entry.castTime,
      cooldown:     entry.cooldown,
      skillDmgPct:  entry.skillDmgPct,
      bonusBaseDmg: entry.bonusBaseDmg,
      ticks:        entry.hits,
      monsterBonus: entry.monsterBonus,
      dmgBonus:     entry.dmgBonus,
    })
  }

  function addRow(): void {
    addDot(rotId, {
      id: newDotId(), dotName: '', weapon: 'main',
      castTime: 1, cooldown: 15,
      skillDmgPct: 10, bonusBaseDmg: 0, ticks: 1,
      monsterBonus: 0, dmgBonus: 0, enabled: true,
    })
  }

  return (
    <div style={{ ...panel, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('rotation.dots.title')}
        </span>
        <button onClick={addRow} style={{
          fontSize: '0.72rem', padding: '3px 10px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 4, color: '#f0cc55', cursor: 'pointer',
        }}>
          {t('rotation.dots.addButton')}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {DOT_HEADERS.map(h => (
                <th key={h.label} style={th} title={h.title}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dots.length === 0 && (
              <tr>
                <td colSpan={12} style={{ ...td, color: '#474f6b', textAlign: 'center', padding: '1.25rem', fontStyle: 'italic' }}>
                  {t('rotation.dots.emptyState')}
                </td>
              </tr>
            )}
            {dots.map((dot, idx) => {
              const { dps } = calcDotResult(dot, char, 60)
              return (
                <tr key={dot.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: dot.id, itemType: 'dot' }))
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  style={{ opacity: dot.enabled ? 1 : 0.4, cursor: 'grab' }}>
                  <td style={{ ...td, width: 28, color: '#474f6b', textAlign: 'center', fontSize: '0.7rem' }}>{idx + 1}</td>
                  <td style={td}>
                    <SkillPicker
                      currentName={dot.dotName}
                      skillDbId={dot.skillDbId}
                      weaponTypes={[char.weaponMainType, char.weaponOffType]}
                      onNameChange={name => updateDot(rotId, dot.id, { dotName: name })}
                      onSelect={entry => handleDotSelect(dot.id, entry)}
                      onClear={() => updateDot(rotId, dot.id, { skillDbId: undefined })}
                      placeholder={t('rotation.dots.dotName')}
                    />
                  </td>
                  <td style={td}>
                    <select value={dot.weapon} onChange={e => updateDot(rotId, dot.id, { weapon: e.target.value as SkillWeapon })}
                      style={{ ...baseInput, width: 83 }}>
                      <option value="main">Main</option>
                      <option value="off">Off</option>
                    </select>
                  </td>
                  <td style={td}>{numInput(dot.castTime ?? 1,   v => updateDot(rotId, dot.id, { castTime: v }), { width: 68, step: 0.01 })}</td>
                  <td style={td}>{numInput(dot.cooldown ?? 0,   v => updateDot(rotId, dot.id, { cooldown: v }), { width: 68, step: 0.1  })}</td>
                  <td style={td}>{numInput(dot.skillDmgPct,     v => updateDot(rotId, dot.id, { skillDmgPct:  v }), { width: 75, step: 1 })}</td>
                  <td style={td}>{numInput(dot.bonusBaseDmg,    v => updateDot(rotId, dot.id, { bonusBaseDmg: v }), { width: 75         })}</td>
                  <td style={td}>{numInput(dot.ticks,           v => updateDot(rotId, dot.id, { ticks:        v }), { width: 55         })}</td>
                  <td style={td}>{numInput(dot.monsterBonus * 100, v => updateDot(rotId, dot.id, { monsterBonus: v / 100 }), { width: 68, step: 1 })}</td>
                  <td style={td}>{numInput(dot.dmgBonus * 100,     v => updateDot(rotId, dot.id, { dmgBonus:     v / 100 }), { width: 68, step: 1 })}</td>
                  <td style={{ ...td, color: dps > 0 ? '#a78bfa' : '#474f6b', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 60 }}>
                    {dps > 0 ? fmt(dps) : '—'}
                  </td>
                  <td style={{ ...td, width: 48 }}>
                    <button onClick={() => updateDot(rotId, dot.id, { enabled: !dot.enabled })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: dot.enabled ? '#4ade80' : '#474f6b', marginRight: 2 }}>
                      {dot.enabled ? '●' : '○'}
                    </button>
                    <button onClick={() => removeDot(rotId, dot.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#7a8099' }}>
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Bloco de Buffs ───────────────────────────────────────────────────────────

const BUFF_TYPE_LABEL: Record<BuffType, string> = {
  dmg: 'Dano', crit: 'Crítico', as: 'Vel.Atq', adv: 'Vantagem', utility: 'Utilidade',
}

const BUFF_TYPE_COLOR: Record<BuffType, string> = {
  dmg: '#f0cc55', crit: '#f97316', as: '#22d3ee', adv: '#a78bfa', utility: '#7a8099',
}

function newBuffId(): string {
  return `buf_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
}

function newCastId(): string {
  return `cast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
}

interface BuffBlockProps {
  buffs: RotationBuff[]
  rotId: string
}

const BUFF_HEADERS: Array<{ label: string; title?: string }> = [
  { label: 'Nome' },
  { label: 'Tipo' },
  { label: 'Valor', title: 'Valor discreto / flat (stat, dano fixo, etc.)' },
  { label: 'Valor %', title: 'Valor percentual (ex: 10 = +10%)' },
  { label: 'Duração (s)', title: 'Duração do buff em segundos' },
  { label: 'CD base (s)', title: 'Cooldown base em segundos' },
  { label: '' },
]

function BuffBlock({ buffs, rotId }: BuffBlockProps): React.ReactElement {
  const t = useT()
  const { addBuff, updateBuff, removeBuff } = useRotation()

  function addRow(): void {
    addBuff(rotId, {
      id: newBuffId(), buffName: '', buffType: 'dmg',
      value: 0, valuePct: 0, duration: 10, cooldown: 30, enabled: true,
    })
  }

  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('rotation.buffs.title')}
        </span>
        <button onClick={addRow} style={{
          fontSize: '0.72rem', padding: '3px 10px',
          background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 4, color: '#22d3ee', cursor: 'pointer',
        }}>
          {t('rotation.buffs.addButton')}
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {BUFF_HEADERS.map(h => (
                <th key={h.label} style={th} title={h.title}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buffs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, color: '#474f6b', textAlign: 'center', padding: '1.25rem', fontStyle: 'italic' }}>
                  {t('rotation.buffs.emptyState')}
                </td>
              </tr>
            )}
            {buffs.map(buff => (
              <tr key={buff.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: buff.id, itemType: 'buff' }))
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                style={{ opacity: buff.enabled ? 1 : 0.4, cursor: 'grab' }}>
                <td style={td}>
                  <input value={buff.buffName} onChange={e => updateBuff(rotId, buff.id, { buffName: e.target.value })}
                    placeholder={t('rotation.buffs.buffName')} style={{ ...baseInput, width: 160 }} />
                </td>
                <td style={td}>
                  <select value={buff.buffType} onChange={e => updateBuff(rotId, buff.id, { buffType: e.target.value as BuffType })}
                    style={{ ...baseInput, width: 100, color: BUFF_TYPE_COLOR[buff.buffType] }}>
                    {(Object.keys(BUFF_TYPE_LABEL) as BuffType[]).map(t => (
                      <option key={t} value={t}>{BUFF_TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                </td>
                <td style={td}>{numInput(buff.value    ?? 0, v => updateBuff(rotId, buff.id, { value:    v }), { width: 72, step: 1   })}</td>
                <td style={td}>{numInput(buff.valuePct ?? 0, v => updateBuff(rotId, buff.id, { valuePct: v }), { width: 72, step: 0.1 })}</td>
                <td style={td}>{numInput(buff.duration,      v => updateBuff(rotId, buff.id, { duration: v }), { width: 72, step: 0.5 })}</td>
                <td style={td}>{numInput(buff.cooldown,      v => updateBuff(rotId, buff.id, { cooldown: v }), { width: 72, step: 0.5 })}</td>
                <td style={{ ...td, width: 48 }}>
                  <button onClick={() => updateBuff(rotId, buff.id, { enabled: !buff.enabled })}
                    title={buff.enabled ? t('rotation.buffs.toggleTooltip') : t('rotation.buffs.toggleTooltipInactive')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: buff.enabled ? '#22d3ee' : '#474f6b', marginRight: 2 }}>
                    {buff.enabled ? '●' : '○'}
                  </button>
                  <button onClick={() => removeBuff(rotId, buff.id)} title={t('rotation.buffs.removeTooltip')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#7a8099' }}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Bloco de Regras de Encadeamento ─────────────────────────────────────────

interface RulesBlockProps {
  rotation: Rotation
}

function newRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
}

function RulesBlock({ rotation }: RulesBlockProps): React.ReactElement {
  const t = useT()
  const { addRule, removeRule } = useRotation()
  const rules = rotation.rules ?? []

  const allItems: Array<{ id: string; label: string }> = [
    ...rotation.skills.map(s => ({ id: s.id, label: `⚔ ${s.skillName || 'skill'}` })),
    ...(rotation.dots  ?? []).map(d => ({ id: d.id, label: `🔥 ${d.dotName || 'dot'}` })),
    ...(rotation.buffs ?? []).map(b => ({ id: b.id, label: `✨ ${b.buffName || 'buff'}` })),
  ]

  function handleAddRule(): void {
    if (allItems.length < 2) return
    addRule(rotation.id, {
      id:        newRuleId(),
      triggerId: allItems[0].id,
      effectId:  allItems[1].id,
    })
  }

  function handleChangeTrigger(rule: RotationRule, triggerId: string): void {
    removeRule(rotation.id, rule.id)
    addRule(rotation.id, { ...rule, triggerId })
  }

  function handleChangeEffect(rule: RotationRule, effectId: string): void {
    removeRule(rotation.id, rule.id)
    addRule(rotation.id, { ...rule, effectId })
  }

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid rgba(249,115,22,0.18)',
      borderRadius: 8,
      padding: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('rotation.rules.title')}
        </span>
        <button
          onClick={handleAddRule}
          disabled={allItems.length < 2}
          style={{
            fontSize: '0.72rem', padding: '3px 10px',
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.28)',
            borderRadius: 4, color: '#f97316', cursor: allItems.length < 2 ? 'default' : 'pointer',
            opacity: allItems.length < 2 ? 0.45 : 1,
          }}
        >
          {t('rotation.rules.addButton')}
        </button>
      </div>

      {rules.length === 0 && (
        <div style={{ color: '#474f6b', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
          {t('rotation.rules.emptyState')}
        </div>
      )}

      {rules.map(rule => (
        <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <select
            value={rule.triggerId}
            onChange={e => handleChangeTrigger(rule, e.target.value)}
            style={{ ...baseInput, width: 200 }}
          >
            {allItems.map(item => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>

          <span style={{ color: '#f97316', fontWeight: 700, fontSize: '1rem' }}>→</span>

          <select
            value={rule.effectId}
            onChange={e => handleChangeEffect(rule, e.target.value)}
            style={{ ...baseInput, width: 200 }}
          >
            {allItems.map(item => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>

          <button
            onClick={() => removeRule(rotation.id, rule.id)}
            title={t('rotation.rules.removeTooltip')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#7a8099', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Log Timeline Panel ───────────────────────────────────────────────────────

interface LogTimelinePanelProps {
  data: LogTimelineData
}

function LogTimelinePanel({ data }: LogTimelinePanelProps): React.ReactElement {
  const displaySkills = data.skills.slice(0, 15)
  const steps = Array.from(
    { length: Math.min(120, Math.ceil(data.pullDurationSec / 0.5) + 1) },
    (_, i) => parseFloat((i * 0.5).toFixed(1))
  )
  const eventMap = new Set(data.casts.map(c => `${c.skillName}|${c.castAtSec}`))

  return (
    <div style={panel}>
      <div style={{ fontSize: '0.65rem', color: '#474f6b', marginBottom: '0.4rem' }}>
        {data.source} · {data.pullDurationSec.toFixed(1)}s · {new Date(data.savedAt).toLocaleString('pt-BR')}
      </div>
      <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: 420 }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ ...th, background: 'rgba(0,0,0,0.75)', width: 48, minWidth: 48 }}>Tempo</th>
              {displaySkills.map(sk => (
                <th key={sk} title={sk}
                  style={{ ...th, background: 'rgba(0,0,0,0.75)', width: 42, minWidth: 42, color: '#a78bfa' }}>
                  {sk.length > 8 ? sk.slice(0, 8) : sk}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map(t => (
              <tr key={t}>
                <td style={{ ...td, fontSize: '0.65rem', color: '#474f6b', whiteSpace: 'nowrap', padding: '0 6px', background: 'rgba(0,0,0,0.08)' }}>
                  {t.toFixed(1)}s
                </td>
                {displaySkills.map(sk => {
                  const active = eventMap.has(`${sk}|${t}`)
                  return (
                    <td key={sk} style={{ padding: 1 }}>
                      <div style={{
                        width: 36, height: 18, borderRadius: 2,
                        background: active ? 'rgba(167,139,250,0.85)' : 'rgba(0,0,0,0.15)',
                        border: active ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.04)',
                      }} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Timeline vertical ────────────────────────────────────────────────────────

interface TimelineProps {
  rotation: Rotation
}

const TIME_STEPS = Array.from({ length: 60 }, (_, i) => parseFloat((i * 0.5).toFixed(1)))  // 0.0 a 29.5

function abbrev(name: string): string {
  return name.length > 8 ? name.slice(0, 8) : name || '—'
}

type CellState = 'empty' | 'cast' | 'active' | 'conflict'

function Timeline({ rotation }: TimelineProps): React.ReactElement {
  const t = useT()
  const { toggleCastEvent, clearItemTimeline, clearAllTimeline } = useRotation()
  const [hoverCell, setHoverCell] = useState<string | null>(null)

  const skills  = rotation.skills.filter(s => s.enabled)
  const dots    = (rotation.dots   ?? []).filter(d => d.enabled)
  const buffs   = (rotation.buffs  ?? []).filter(b => b.enabled)
  const timeline = rotation.timeline ?? []

  const colCount = skills.length + dots.length + buffs.length

  // ── Determinação do estado de cada célula ────────────────────────────────────
  function getCellState(
    itemId:   string,
    itemType: CastEvent['itemType'],
    castAt:   number,
  ): CellState {
    const events = timeline
      .filter(e => e.itemId === itemId)
      .sort((a, b) => a.castAt - b.castAt)

    const hasCast = events.some(e => Math.abs(e.castAt - castAt) < 0.001)

    let itemDuration  = 0
    let recastTime    = Infinity

    if (itemType === 'skill') {
      const sk = rotation.skills.find(s => s.id === itemId)
      if (sk) {
        itemDuration = sk.castTime
        recastTime   = sk.castTime + localApplyCD(sk.cooldown, rotation.character.cdrPct)
      }
    } else if (itemType === 'buff') {
      const buf = (rotation.buffs ?? []).find(b => b.id === itemId)
      if (buf) {
        itemDuration = buf.duration
        recastTime   = buf.cooldown
      }
    }
    // DoTs: sem duração de barra, sem recast mínimo

    if (hasCast) {
      const prevCasts = events.filter(e => e.castAt < castAt - 0.001)
      if (prevCasts.length > 0) {
        const lastCast = prevCasts[prevCasts.length - 1]
        if (castAt - lastCast.castAt < recastTime - 0.001) return 'conflict'
      }
      return 'cast'
    }

    // Dentro da duração ativa de um cast anterior?
    if (itemDuration > 0) {
      const inActive = events.some(e => e.castAt < castAt - 0.001 && e.castAt + itemDuration > castAt + 0.001)
      if (inActive) return 'active'
    }

    return 'empty'
  }

  // ── Células de sugestão: primeiro slot disponível após cada cast ─────────────
  const suggestionCells = useMemo<Set<string>>(() => {
    const s = new Set<string>()
    const cdrPct = rotation.character.cdrPct

    function addSuggestions(
      itemId: string,
      recastTime: number,
    ): void {
      if (!isFinite(recastTime) || recastTime <= 0) return
      const events = timeline
        .filter(e => e.itemId === itemId)
        .sort((a, b) => a.castAt - b.castAt)
      for (const ev of events) {
        const availableAt = ev.castAt + recastTime
        const nextStep = TIME_STEPS.find(t => t >= availableAt - 0.001)
        if (nextStep !== undefined) {
          s.add(`${itemId}-${nextStep}`)
        }
      }
    }

    for (const sk of skills) {
      addSuggestions(sk.id, sk.castTime + localApplyCD(sk.cooldown, cdrPct))
    }
    for (const buf of buffs) {
      addSuggestions(buf.id, buf.cooldown)
    }
    for (const d of dots) {
      if ((d.cooldown ?? 0) > 0) {
        addSuggestions(d.id, (d.castTime ?? 1) + localApplyCD(d.cooldown, cdrPct))
      }
    }

    return s
  }, [timeline, skills, dots, buffs, rotation.character.cdrPct])

  // ── Estilo visual da célula ──────────────────────────────────────────────────
  function cellStyle(state: CellState, itemType: CastEvent['itemType'], cellKey: string): React.CSSProperties {
    const base: React.CSSProperties = {
      width: 36, height: 18,
      cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.04)',
      transition: 'background 0.07s',
      borderRadius: 2,
    }
    if (state === 'conflict') {
      return { ...base, background: 'rgba(239,68,68,0.82)', border: '1px solid rgba(239,68,68,0.55)' }
    }
    if (state === 'cast') {
      const rgb = itemType === 'dot' ? '249,115,22' : itemType === 'buff' ? '34,211,238' : '124,92,252'
      return { ...base, background: `rgba(${rgb},0.92)`, border: `1px solid rgba(${rgb},0.65)` }
    }
    if (state === 'active') {
      const rgb = itemType === 'buff' ? '34,211,238' : '124,92,252'
      return { ...base, background: `rgba(${rgb},0.22)`, border: `1px solid rgba(${rgb},0.15)` }
    }
    // empty — sugestão de cooldown disponível ou hover
    if (state === 'empty' && suggestionCells.has(cellKey)) {
      return { ...base, background: 'rgba(0,0,0,0.15)', border: '1px dashed rgba(160,160,180,0.45)' }
    }
    return { ...base, background: hoverCell === cellKey ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)' }
  }

  // ── Interação ────────────────────────────────────────────────────────────────
  function handleToggle(itemId: string, itemType: CastEvent['itemType'], castAt: number): void {
    toggleCastEvent(rotation.id, { id: newCastId(), itemId, itemType, castAt })
  }

  function handleDrop(e: React.DragEvent, castAt: number): void {
    e.preventDefault()
    setHoverCell(null)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as {
        itemId: string; itemType: CastEvent['itemType']
      }
      handleToggle(data.itemId, data.itemType, castAt)
    } catch { /* ignora JSON inválido */ }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (colCount === 0) {
    return (
      <div style={panel}>
        <div style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          {t('rotation.timeline.title')}
        </div>
        <div style={{ color: '#474f6b', fontSize: '0.8rem', fontStyle: 'italic', padding: '1rem 0' }}>
          {t('rotation.timeline.noSkills')}
        </div>
      </div>
    )
  }

  return (
    <div style={panel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('rotation.timeline.title')}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#474f6b', flex: 1 }}>
          {t('rotation.timeline.instruction')}
        </span>
        {timeline.length > 0 && (
          <button
            onClick={() => clearAllTimeline(rotation.id)}
            title={t('rotation.timeline.clearAllTooltip')}
            style={{
              fontSize: '0.65rem', padding: '2px 8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4, color: '#f87171', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {t('rotation.timeline.clearAllButton')}
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: 420 }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ ...th, background: 'rgba(0,0,0,0.75)', width: 48, minWidth: 48 }}>Tempo</th>
              {skills.map(s => {
                const hasCasts = timeline.some(e => e.itemId === s.id)
                return (
                  <th key={s.id} title={s.skillName || 'skill'}
                    style={{ ...th, background: 'rgba(0,0,0,0.75)', width: 42, minWidth: 42, color: '#7c5cfc', padding: '3px 2px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <span>{abbrev(s.skillName)}</span>
                      {hasCasts && (
                        <button onClick={() => clearItemTimeline(rotation.id, s.id)} title={t('rotation.timeline.clearColumnTooltip')}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.6rem', padding: 0, lineHeight: 1 }}>
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                )
              })}
              {dots.map(d => {
                const hasCasts = timeline.some(e => e.itemId === d.id)
                return (
                  <th key={d.id} title={d.dotName || 'dot'}
                    style={{ ...th, background: 'rgba(0,0,0,0.75)', width: 42, minWidth: 42, color: '#f97316', padding: '3px 2px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <span>{abbrev(d.dotName)}</span>
                      {hasCasts && (
                        <button onClick={() => clearItemTimeline(rotation.id, d.id)} title={t('rotation.timeline.clearColumnTooltip')}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.6rem', padding: 0, lineHeight: 1 }}>
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                )
              })}
              {buffs.map(b => {
                const hasCasts = timeline.some(e => e.itemId === b.id)
                return (
                  <th key={b.id} title={b.buffName || 'buff'}
                    style={{ ...th, background: 'rgba(0,0,0,0.75)', width: 42, minWidth: 42, color: '#22d3ee', padding: '3px 2px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <span>{abbrev(b.buffName)}</span>
                      {hasCasts && (
                        <button onClick={() => clearItemTimeline(rotation.id, b.id)} title={t('rotation.timeline.clearColumnTooltip')}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.6rem', padding: 0, lineHeight: 1 }}>
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {TIME_STEPS.map(t => (
              <tr key={t}>
                <td style={{ ...td, fontSize: '0.65rem', color: '#474f6b', whiteSpace: 'nowrap', padding: '0 6px', background: 'rgba(0,0,0,0.08)' }}>
                  {t.toFixed(1)}s
                </td>
                {skills.map(s => {
                  const key = `${s.id}-${t}`
                  const state = getCellState(s.id, 'skill', t)
                  return (
                    <td key={s.id} style={{ padding: 1 }}>
                      <div
                        onClick={() => handleToggle(s.id, 'skill', t)}
                        onDragOver={e => { e.preventDefault(); setHoverCell(key) }}
                        onDragLeave={() => setHoverCell(null)}
                        onDrop={e => handleDrop(e, t)}
                        style={cellStyle(state, 'skill', key)}
                      />
                    </td>
                  )
                })}
                {dots.map(d => {
                  const key = `${d.id}-${t}`
                  const state = getCellState(d.id, 'dot', t)
                  return (
                    <td key={d.id} style={{ padding: 1 }}>
                      <div
                        onClick={() => handleToggle(d.id, 'dot', t)}
                        onDragOver={e => { e.preventDefault(); setHoverCell(key) }}
                        onDragLeave={() => setHoverCell(null)}
                        onDrop={e => handleDrop(e, t)}
                        style={cellStyle(state, 'dot', key)}
                      />
                    </td>
                  )
                })}
                {buffs.map(b => {
                  const key = `${b.id}-${t}`
                  const state = getCellState(b.id, 'buff', t)
                  return (
                    <td key={b.id} style={{ padding: 1 }}>
                      <div
                        onClick={() => handleToggle(b.id, 'buff', t)}
                        onDragOver={e => { e.preventDefault(); setHoverCell(key) }}
                        onDragLeave={() => setHoverCell(null)}
                        onDrop={e => handleDrop(e, t)}
                        style={cellStyle(state, 'buff', key)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Modal de importação ──────────────────────────────────────────────────────

interface ImportModalProps {
  onSelect: (buildId: string) => void
  onClose:  () => void
}

function ImportModal({ onSelect, onClose }: ImportModalProps): React.ReactElement {
  const t = useT()
  const { builds } = useBuilds()
  const list = Object.values(builds)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ ...panel, width: 420, maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#d4af37', fontWeight: 700 }}>{t('rotation.importModal.title')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7a8099', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#474f6b', marginBottom: '0.5rem' }}>
          {t('rotation.importModal.description')}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {list.length === 0 && (
            <div style={{ color: '#474f6b', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>
              {t('rotation.importModal.emptyState')}<br />{t('rotation.importModal.emptyStateNote')}
            </div>
          )}
          {list.map(b => (
            <button key={b.id} onClick={() => { onSelect(b.id); onClose() }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '0.55rem 0.75rem', marginBottom: 4,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 5, color: 'var(--text)', cursor: 'pointer', fontSize: '0.82rem',
            }}>
              <div style={{ fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#7a8099' }}>{b.weaponCombo}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function Rotation(): React.ReactElement {
  const t = useT()
  const {
    rotations, activeRotationId,
    loadFromDisk, createEmpty, deleteRotation, setActive, updateCharacter,
  } = useRotation()
  const { builds } = useBuilds()
  const { data: logTimeline, load: loadLogTimeline } = useLogTimeline()
  const { loadFromDisk: loadSkillsDB } = useSkillsDB()

  const [showImportModal, setShowImportModal] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => { loadFromDisk() }, [])
  useEffect(() => { loadLogTimeline() }, [])
  useEffect(() => { loadSkillsDB() }, [])

  const rotation = activeRotationId ? rotations[activeRotationId] : null

  // Auto-save indicator — dispara quando o rotation muda
  const saveStatus = useAutoSave(rotation)

  const result = useMemo(() => {
    if (!rotation) return null
    const rotResult   = calcRotationResult(rotation, 60)
    const timelineDps = calcTimelineDps(rotation, 60)
    return { ...rotResult, timelineDps }
  }, [rotation])

  function handleImportBuild(buildId: string): void {
    const build = builds[buildId]
    if (!build || !rotation) return
    updateCharacter(rotation.id, {
      weaponMainDmgMin:  build.stats.minWeaponDmg,
      weaponMainDmgMax:  build.stats.maxWeaponDmg,
      critChanceBase:    build.stats.critHitChance,
      heavyChanceBase:   build.stats.heavyAttackChance,
      critDmgPct:        build.stats.critDmgPct,
      heavyDmgPct:       100 + (build.stats.heavyAttackDmgComp ?? 0),
      skillDmgBoost:     build.stats.skillDmgBoost,
      speciesDmgBoost:   build.stats.speciesDmgBoost,
      bonusDamage:       build.stats.bonusDmg,
      targetDefense:     build.stats.targetDefense,
      targetEndurance:   build.stats.targetEndurance,
    })
  }

  function handleCreateNew(): void {
    const t = useT()
    const name = newName.trim() || t('rotation.sidebar.newRotation')
    createEmpty(name)
    setNewName('')
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Sidebar de rotações ───────────────────────── */}
      <div style={{
        width: 210, minWidth: 210,
        borderRight: '1px solid rgba(124,92,252,0.15)',
        background: 'var(--bg-panel)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        paddingTop: 32,
      }}>
        {/* Criar nova */}
        <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateNew()}
            placeholder={t('rotation.sidebar.rotationName')}
            style={{ ...baseInput, width: '100%', marginBottom: 6 }}
          />
          <button onClick={handleCreateNew} style={{
            width: '100%', padding: '5px 0',
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 4, color: '#f0cc55', cursor: 'pointer', fontSize: '0.78rem',
          }}>
            + {t('rotation.sidebar.newRotation')}
          </button>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {Object.values(rotations).map(r => {
            const isActive = r.id === activeRotationId
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                <button onClick={() => setActive(r.id)} style={{
                  flex: 1, textAlign: 'left',
                  padding: '0.45rem 0.6rem',
                  background: isActive ? 'rgba(124,92,252,0.15)' : 'transparent',
                  border: 'none', borderLeft: `2px solid ${isActive ? '#d4af37' : 'transparent'}`,
                  color: isActive ? '#f0cc55' : '#7a8099',
                  cursor: 'pointer', fontSize: '0.78rem', borderRadius: '0 4px 4px 0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.name}
                </button>
                {isActive && (
                  <button onClick={() => deleteRotation(r.id)} title={t('rotation.sidebar.deleteTooltip')}
                    style={{ background: 'none', border: 'none', color: '#474f6b', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#474f6b')}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Conteúdo principal ───────────────────────── */}
      <div style={{
        flex: 1, overflow: 'auto',
        padding: '1rem', paddingTop: '2.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}>
        {!rotation ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#474f6b' }}>
            {t('rotation.empty')}
          </div>
        ) : (
          <>
            {/* Nome */}
            <div style={{ fontSize: '0.95rem', color: '#f0cc55', fontWeight: 700 }}>
              {rotation.name}
            </div>

            {/* Painel do personagem */}
            <CharacterPanel
              char={rotation.character}
              onChange={patch => updateCharacter(rotation.id, patch)}
              onImportBuild={() => setShowImportModal(true)}
              saveStatus={saveStatus}
            />

            {/* Linha 1: Skills (3fr) + DoTs (2fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '0.75rem', alignItems: 'start' }}>
              <SkillTable skills={rotation.skills} char={rotation.character} rotId={rotation.id} />
              <DotBlock   dots={rotation.dots}     char={rotation.character} rotId={rotation.id} />
            </div>

            {/* Linha 2: Buffs — largura total */}
            <BuffBlock buffs={rotation.buffs ?? []} rotId={rotation.id} />

            {/* Linha 3: Regras de Encadeamento */}
            <RulesBlock rotation={rotation} />

            {/* DPS Card — posicionado acima das timelines */}
            <DpsCard
              totalDps={result?.totalDps ?? 0}
              timelineDps={result?.timelineDps ?? null}
              skillCount={rotation.skills.filter(s => s.enabled).length}
              dotCount={rotation.dots.filter(d => d.enabled).length}
              buffCount={(rotation.buffs ?? []).filter(b => b.enabled).length}
            />

            {/* Linha 4: Timelines em paralelo */}
            <div style={{ display: 'grid', gridTemplateColumns: logTimeline ? '1fr 1fr' : '1fr', gap: '0.75rem', alignItems: 'start' }}>
              {/* Coluna esquerda: Timeline planejada */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                  {t('rotation.timeline.planned')}
                </div>
                <Timeline rotation={rotation} />
              </div>

              {/* Coluna direita: Timeline do Log (se importada) */}
              {logTimeline && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {t('rotation.timeline.realLog')}
                    </span>
                  </div>
                  <LogTimelinePanel data={logTimeline} />
                </div>
              )}
            </div>

            {/* Botão de importar do Log */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => loadLogTimeline()}
                style={{
                  fontSize: '0.72rem', padding: '4px 14px',
                  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.28)',
                  borderRadius: 4, color: '#a78bfa', cursor: 'pointer',
                }}
              >
                {logTimeline ? t('rotation.timeline.updateButton') : t('rotation.timeline.importButton')}
              </button>
            </div>
          </>
        )}
      </div>

      {showImportModal && (
        <ImportModal
          onSelect={handleImportBuild}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
