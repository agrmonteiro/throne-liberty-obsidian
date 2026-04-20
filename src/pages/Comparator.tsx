import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcAverageDPS, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import type { Build } from '../engine/types'
import { fmt, fmtP, fmtPct, fmtDec } from '../engine/fmt'
import { useT } from '../i18n/useT'

const COLORS = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a']

// ─── Axes definition: [internalKey, displayLabel, normMax] ───────────────────
const AXES: Array<[string, string, number]> = [
  ['crit',    'Crit %',      100],
  ['heavy',   'Heavy %',     100],
  ['critDmg', 'Crit Dmg',    300],
  ['skill',   'Skill Boost', 3000],
  ['bonus',   'Bonus Dmg',   1000],
  ['species', 'Species',     1000],
  ['weapon',  'Weapon Max',  5000],
]

function buildToNorm(b: Build): Record<string, number> {
  return {
    crit:    Math.min(100, critChanceFromStat(b.stats.critHitChance) * 100),
    heavy:   Math.min(100, heavyChanceFromStat(b.stats.heavyAttackChance) * 100),
    critDmg: Math.min(100, (b.stats.critDmgPct / 300) * 100),
    skill:   Math.min(100, (b.stats.skillDmgBoost / 3000) * 100),
    bonus:   Math.min(100, (b.stats.bonusDmg / 1000) * 100),
    species: Math.min(100, (b.stats.speciesDmgBoost / 1000) * 100),
    weapon:  Math.min(100, (b.stats.maxWeaponDmg / 5000) * 100),
  }
}

function rawLabel(b: Build, key: string): string {
  switch (key) {
    case 'crit':    return `${fmtP(critChanceFromStat(b.stats.critHitChance) * 100)}  (stat ${b.stats.critHitChance})`
    case 'heavy':   return `${fmtP(heavyChanceFromStat(b.stats.heavyAttackChance) * 100)}  (stat ${b.stats.heavyAttackChance})`
    case 'critDmg': return `+${b.stats.critDmgPct}%`
    case 'skill':   return String(b.stats.skillDmgBoost)
    case 'bonus':   return String(b.stats.bonusDmg)
    case 'species': return String(b.stats.speciesDmgBoost)
    case 'weapon':  return String(b.stats.maxWeaponDmg)
    default:        return '—'
  }
}

interface SelPoint {
  buildId:    string
  buildName:  string
  axisKey:    string
  axisLabel:  string
  normalized: number
  rawValue:   string
  color:      string
}

export function Comparator(): React.ReactElement {
  const { builds } = useBuilds()
  const t = useT()
  const buildList  = useMemo(() => Object.values(builds), [builds])

  const [selected,  setSelected]  = useState<string[]>([])
  const [hidden,    setHidden]    = useState<Set<string>>(new Set())
  const [maximized, setMaximized] = useState<'stats' | 'dps' | null>(null)
  const [selPoint,  setSelPoint]  = useState<SelPoint | null>(null)
  const [showLabels, setShowLabels] = useState(false)

  // ── Selection helpers ───────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 6 ? [...p, id] : p)
    setSelPoint(null)
  }

  function toggleHide(id: string) {
    setHidden(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const selBuilds = useMemo(() => selected.map(id => builds[id]).filter(Boolean), [selected, builds])
  const dpsList   = useMemo(() => selBuilds.map(b => calcAverageDPS(b.stats)), [selBuilds])
  const bestDps   = Math.max(...dpsList, 0)

  // ── Chart data ──────────────────────────────────────────────────────────────
  const statsData = useMemo(() =>
    AXES.map(([key, label]) => {
      const row: Record<string, string | number> = { axis: label, _key: key }
      selBuilds.forEach(b => { row[b.id] = buildToNorm(b)[key] })
      return row
    }),
    [selBuilds]
  )

  const dpsData = useMemo(() =>
    selBuilds.map((b, i) => ({ name: b.name.slice(0, 18), dps: dpsList[i], id: b.id })),
    [selBuilds, dpsList]
  )

  // ── Legend callbacks ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onLegendClick(o: any) {
    if (typeof o?.dataKey === 'string') toggleHide(o.dataKey)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function legendFmt(value: string, entry: any) {
    const isHid = hidden.has(entry?.dataKey as string)
    return (
      <span style={{
        opacity: isHid ? 0.28 : 1,
        textDecoration: isHid ? 'line-through' : 'none',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '0.72rem',
      }}>
        {value}
      </span>
    )
  }

  // ── Point selection ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function pickStats(rowData: any, b: Build, i: number) {
    const axisKey   = String(rowData._key ?? '')
    const axisLabel = String(rowData.axis ?? '')
    const normalized = Number(rowData[b.id] ?? 0)
    setSelPoint({ buildId: b.id, buildName: b.name, axisKey, axisLabel, normalized, rawValue: rawLabel(b, axisKey), color: COLORS[i % COLORS.length] })
  }

  function pickDps(d: { id: string; name: string; dps: number }, i: number) {
    setSelPoint({ buildId: d.id, buildName: d.name, axisKey: 'dps', axisLabel: 'DPS Estimado', normalized: 100, rawValue: fmt(d.dps), color: COLORS[i % COLORS.length] })
  }

  // ── Chart renderers (helper fns, NOT React components) ─────────────────────

  function renderStats(height: number | string) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={statsData} margin={{ left: 0, right: 20, top: 10, bottom: 5 }}>
          <XAxis dataKey="axis" tick={{ fontSize: 10, fill: '#e2e4ec' }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            labelStyle={{ color: 'var(--gold-l)' }}
            formatter={(v: number, name: string) => [`${fmtDec(v, 1)}/100`, name]}
          />
          <Legend
            onClick={onLegendClick}
            formatter={legendFmt}
            wrapperStyle={{ cursor: 'pointer' }}
          />
          {selBuilds.map((b, i) => (
            <Bar
              key={b.id}
              dataKey={b.id}
              name={b.name.slice(0, 22)}
              fill={COLORS[i % COLORS.length]}
              radius={[3, 3, 0, 0]}
              opacity={hidden.has(b.id) ? 0 : 0.85}
              hide={hidden.has(b.id)}
              label={showLabels ? { position: 'top', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmtDec(v, 1) } : undefined}
              style={{ cursor: 'pointer' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) => pickStats(d, b, i)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  function renderDps(height: number | string) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={dpsData} layout="vertical" margin={{ left: 8, right: 50 }}>
          <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#e2e4ec' }} width={100} />
          <Tooltip
            formatter={(v: number) => [fmt(v), 'DPS']}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            labelStyle={{ color: 'var(--gold-l)' }}
          />
          <Bar
            dataKey="dps"
            radius={[0, 4, 4, 0]}
            label={showLabels ? { position: 'right', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) } : undefined}
            style={{ cursor: 'pointer' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(d: any, i: number) => pickDps(d as { id: string; name: string; dps: number }, i)}
          >
            {dpsData.map((entry, i) => (
              <Cell
                key={entry.id}
                fill={COLORS[i % COLORS.length]}
                opacity={hidden.has(entry.id) ? 0.1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Fullscreen overlay ──────────────────────────────────────────────── */}
      {maximized && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'var(--bg)', display: 'flex', flexDirection: 'column', padding: '1.25rem 2rem' }}
          onKeyDown={(e) => { if (e.key === 'Escape') setMaximized(null) }}
          tabIndex={-1}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
            <div className="tl-eyebrow" style={{ fontSize: '0.78rem' }}>
              {maximized === 'stats' ? t('comparator.charts.stats') : t('comparator.charts.dps')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Esc para fechar</div>
              <button className="tl-btn-ghost" onClick={() => setMaximized(null)} style={{ padding: '0.3rem 0.9rem' }}>✕ Fechar</button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {maximized === 'stats' ? renderStats('100%') : renderDps('100%')}
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>{t('comparator.title')}</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p>{t('comparator.subtitle')}</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-soft)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: 6, background: 'var(--bg-card)' }}>
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            Exibir valores nos gráficos
          </label>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>

        {/* Build selector */}
        <div className="tl-panel" style={{ marginBottom: '1rem' }}>
          <div className="tl-eyebrow" style={{ marginBottom: 8 }}>{t('comparator.select')}</div>
          {buildList.length === 0 ? (
            <div style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>
              {t('comparator.noBuilds')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {buildList.map(b => {
                const isSel = selected.includes(b.id)
                const isHid = hidden.has(b.id)
                const color = COLORS[selected.indexOf(b.id) % COLORS.length]
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleSelect(b.id)}
                    className="tl-btn-ghost"
                    style={{
                      borderColor: isSel ? color : undefined,
                      color:       isSel ? (isHid ? 'var(--text-muted)' : color) : undefined,
                      background:  isSel ? `${color}18` : undefined,
                      opacity:     isHid ? 0.5 : 1,
                    }}
                  >
                    {isSel && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', marginRight: 4 }}>●</span>}
                    {b.name.slice(0, 24)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selBuilds.length < 2 ? (
          <div className="tl-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-soft)' }}>
            {t('comparator.needTwo')}
          </div>
        ) : (
          <>
            {/* KPI cards — clicáveis para toggle de visibilidade ────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selBuilds.length, 4)}, 1fr)`, gap: '0.75rem', marginBottom: '1.25rem' }}>
              {selBuilds.map((b, i) => {
                const dps    = dpsList[i]
                const isBest = dps === bestDps && bestDps > 0
                const gain   = bestDps > 0 && !isBest ? ((dps - bestDps) / bestDps) * 100 : 0
                const color  = COLORS[i % COLORS.length]
                const isHid  = hidden.has(b.id)
                return (
                  <div
                    key={b.id}
                    className="tl-stat-card"
                    onClick={() => toggleHide(b.id)}
                    title={isHid ? 'Clique para mostrar nos gráficos' : 'Clique para ocultar nos gráficos'}
                    style={{ borderColor: color, opacity: isHid ? 0.32 : 1, cursor: 'pointer', transition: 'opacity 0.22s, border-color 0.22s', userSelect: 'none' }}
                  >
                    <div className="tl-eyebrow" style={{ color, marginBottom: 4 }}>
                      {b.name.slice(0, 20)}
                      {isBest && <span className="tl-tag tl-tag-gold" style={{ marginLeft: 6 }}>BEST</span>}
                      {isHid  && <span className="tl-tag" style={{ marginLeft: 6, background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.6rem' }}>oculto</span>}
                    </div>
                    <div className="tl-dmg">{fmt(dps)}</div>
                    <div style={{ fontSize: '0.72rem', marginTop: 4 }}>
                      <span className={isBest ? 'tl-gain-neu' : gain >= 0 ? 'tl-gain-pos' : 'tl-gain-neg'}>
                        {isBest ? 'BASE' : `${gain >= 0 ? '+' : ''}${fmtPct(gain)}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: 4 }}>
                      Crit {fmtP(critChanceFromStat(b.stats.critHitChance) * 100)} · Heavy {fmtP(heavyChanceFromStat(b.stats.heavyAttackChance) * 100)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected point detail ──────────────────────────────────────── */}
            {selPoint && (
              <div
                className="tl-panel"
                style={{
                  marginBottom: '1.25rem',
                  borderColor: selPoint.color,
                  background: `${selPoint.color}09`,
                  animation: 'tl-modal-slide 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="tl-eyebrow" style={{ marginBottom: 6, color: selPoint.color }}>
                      Ponto selecionado · {selPoint.axisLabel}
                    </div>
                    <div style={{ fontFamily: 'Noto Serif, serif', color: selPoint.color, fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>
                      {selPoint.buildName}
                    </div>
                    <div style={{ display: 'flex', gap: '2.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                      {selPoint.axisKey !== 'dps' && (
                        <span>
                          <span style={{ color: 'var(--text-soft)' }}>Normalizado: </span>
                          <span style={{ color: selPoint.color, fontWeight: 700 }}>{fmtDec(selPoint.normalized, 1)} / 100</span>
                        </span>
                      )}
                      <span>
                        <span style={{ color: 'var(--text-soft)' }}>Valor real: </span>
                        <span style={{ color: '#e2e4ec', fontWeight: 700 }}>{selPoint.rawValue}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    className="tl-btn-ghost"
                    onClick={() => setSelPoint(null)}
                    style={{ padding: '0.25rem 0.6rem', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Charts ────────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="tl-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div className="tl-eyebrow">{t('comparator.charts.stats')}</div>
                  <button
                    className="tl-btn-ghost"
                    title="Maximizar gráfico (Esc para fechar)"
                    onClick={() => setMaximized('stats')}
                    style={{ padding: '0.3rem 0.5rem', lineHeight: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M5 2H2v3M9 2h3v3M2 9v3h3M12 9v3h-3"/>
                    </svg>
                    <span style={{ marginLeft: 6, fontSize: '0.7rem' }}>Maximizar</span>
                  </button>
                </div>
                {renderStats(300)}
              </div>

              <div className="tl-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div className="tl-eyebrow">{t('comparator.charts.dps')}</div>
                  <button
                    className="tl-btn-ghost"
                    title="Maximizar gráfico (Esc para fechar)"
                    onClick={() => setMaximized('dps')}
                    style={{ padding: '0.3rem 0.5rem', lineHeight: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M5 2H2v3M9 2h3v3M2 9v3h3M12 9v3h-3"/>
                    </svg>
                    <span style={{ marginLeft: 6, fontSize: '0.7rem' }}>Maximizar</span>
                  </button>
                </div>
                {renderDps(280)}
              </div>
            </div>

            {/* Stat table ────────────────────────────────────────────────── */}
            <div className="tl-panel">
              <div className="tl-eyebrow" style={{ marginBottom: 12 }}>{t('comparator.table')}</div>
              {([
                { label: 'DPS Estimado',    fn: (b: Build) => fmt(calcAverageDPS(b.stats)) },
                { label: 'Crit Chance %',   fn: (b: Build) => fmtP(critChanceFromStat(b.stats.critHitChance) * 100) },
                { label: 'Heavy Chance %',  fn: (b: Build) => fmtP(heavyChanceFromStat(b.stats.heavyAttackChance) * 100) },
                { label: 'Crit Damage %',   fn: (b: Build) => `${b.stats.critDmgPct}` },
                { label: 'Skill Dmg Boost', fn: (b: Build) => `${b.stats.skillDmgBoost}` },
                { label: 'Bonus Damage',    fn: (b: Build) => `${b.stats.bonusDmg}` },
                { label: 'Max Weapon Dmg',  fn: (b: Build) => `${b.stats.maxWeaponDmg}` },
                { label: 'Species Boost',   fn: (b: Build) => `${b.stats.speciesDmgBoost}` },
              ] as { label: string; fn: (b: Build) => string }[]).map(row => (
                <div
                  key={row.label}
                  style={{ display: 'grid', gridTemplateColumns: `160px repeat(${selBuilds.length}, 1fr)`, gap: '0.5rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', alignSelf: 'center' }}>{row.label}</div>
                  {selBuilds.map((b, i) => (
                    <div
                      key={b.id}
                      className="font-mono"
                      style={{ fontSize: '0.78rem', fontWeight: 600, color: COLORS[i % COLORS.length], textAlign: 'right', opacity: hidden.has(b.id) ? 0.25 : 1, transition: 'opacity 0.2s' }}
                    >
                      {row.fn(b)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
