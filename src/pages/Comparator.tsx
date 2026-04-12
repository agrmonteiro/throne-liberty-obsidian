import React, { useState, useMemo } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcAverageDPS, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import type { Build } from '../engine/types'

import { fmt, fmtP, fmtPct, fmtDec } from '../engine/fmt'

const COLORS = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a']

// Radar axes: [key, label, maxForNorm]
const AXES: Array<[string, string, number]> = [
  ['crit',    'Crit %',      100],
  ['heavy',   'Heavy %',     100],
  ['critDmg', 'Crit Dmg',   300],
  ['skill',   'Skill Boost', 3000],
  ['bonus',   'Bonus Dmg',   1000],
  ['species', 'Species',     1000],
  ['weapon',  'Weapon Max',  5000],
]

function buildToRadar(b: Build): Record<string, number> {
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

export function Comparator(): React.ReactElement {
  const { builds } = useBuilds()
  const buildList  = useMemo(() => Object.values(builds), [builds])
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 6 ? [...prev, id] : prev
    )
  }

  const selBuilds  = useMemo(() => selected.map((id) => builds[id]).filter(Boolean), [selected, builds])
  const dpsList    = useMemo(() => selBuilds.map((b) => calcAverageDPS(b.stats)), [selBuilds])
  const bestDps    = Math.max(...dpsList, 0)

  // Radar data: one row per axis
  const radarData = useMemo(() => AXES.map(([key, label]) => {
    const row: Record<string, number | string> = { axis: label }
    selBuilds.forEach((b) => {
      row[b.name.slice(0, 18)] = buildToRadar(b)[key]
    })
    return row
  }), [selBuilds])

  // Bar data
  const barData = useMemo(() =>
    selBuilds.map((b, i) => ({ name: b.name.slice(0, 18), dps: dpsList[i] })),
    [selBuilds, dpsList]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>Comparador de Builds</h1>
        <p>Spider-chart normalizado + tabela side-by-side. Selecione até 6 builds.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* Build selector */}
        <div className="tl-panel" style={{ marginBottom: '1rem' }}>
          <div className="tl-eyebrow" style={{ marginBottom: 8 }}>Selecionar Builds</div>
          {buildList.length === 0 ? (
            <div style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>Nenhuma build salva. Vá em <b>Builds</b> para importar.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {buildList.map((b, i) => {
                const isSelected = selected.includes(b.id)
                const color = COLORS[selected.indexOf(b.id) % COLORS.length]
                return (
                  <button
                    key={b.id}
                    onClick={() => toggle(b.id)}
                    className="tl-btn-ghost"
                    style={{
                      borderColor: isSelected ? color : undefined,
                      color:       isSelected ? color : undefined,
                      background:  isSelected ? `${color}18` : undefined,
                    }}
                  >
                    {isSelected && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}>●</span>}
                    {b.name.slice(0, 24)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selBuilds.length < 2 ? (
          <div className="tl-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-soft)' }}>
            Selecione pelo menos 2 builds para comparar.
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(selBuilds.length, 4)}, 1fr)`, gap: '0.75rem', marginBottom: '1.25rem' }}>
              {selBuilds.map((b, i) => {
                const dps    = dpsList[i]
                const isBest = dps === bestDps && bestDps > 0
                const gain   = bestDps > 0 && !isBest ? ((dps - bestDps) / bestDps) * 100 : 0
                const color  = COLORS[i % COLORS.length]
                return (
                  <div key={b.id} className="tl-stat-card" style={{ borderColor: color }}>
                    <div className="tl-eyebrow" style={{ color, marginBottom: 4 }}>
                      {b.name.slice(0, 20)}{isBest && <span className="tl-tag tl-tag-gold" style={{ marginLeft: 6 }}>BEST</span>}
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

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Radar */}
              <div className="tl-panel">
                <div className="tl-eyebrow" style={{ marginBottom: 8 }}>🕷 Radar de Stats (normalizado 0–100)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#7a8099' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fill: '#474f6b' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`${fmtDec(v, 1)}/100`, '']} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#e2e4ec' }} />
                    {selBuilds.map((b, i) => (
                      <Radar
                        key={b.id}
                        name={b.name.slice(0, 18)}
                        dataKey={b.name.slice(0, 18)}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* DPS bar */}
              <div className="tl-panel">
                <div className="tl-eyebrow" style={{ marginBottom: 8 }}>📊 DPS Comparativo</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 50 }}>
                    <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#e2e4ec' }} width={100} />
                    <Tooltip formatter={(v: number) => [fmt(v), 'DPS']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} labelStyle={{ color: 'var(--gold-l)' }} />
                    <Bar dataKey="dps" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) }}>
                      {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stat table */}
            <div className="tl-panel">
              <div className="tl-eyebrow" style={{ marginBottom: 12 }}>📋 Tabela Detalhada</div>
              {[
                { label: 'DPS Estimado',     fn: (b: Build) => fmt(calcAverageDPS(b.stats)) },
                { label: 'Crit Chance %',    fn: (b: Build) => fmtP(critChanceFromStat(b.stats.critHitChance) * 100) },
                { label: 'Heavy Chance %',   fn: (b: Build) => fmtP(heavyChanceFromStat(b.stats.heavyAttackChance) * 100) },
                { label: 'Crit Damage %',    fn: (b: Build) => `${b.stats.critDmgPct}` },
                { label: 'Skill Dmg Boost',  fn: (b: Build) => `${b.stats.skillDmgBoost}` },
                { label: 'Bonus Damage',     fn: (b: Build) => `${b.stats.bonusDmg}` },
                { label: 'Max Weapon Dmg',   fn: (b: Build) => `${b.stats.maxWeaponDmg}` },
                { label: 'Species Boost',    fn: (b: Build) => `${b.stats.speciesDmgBoost}` },
              ].map((row) => {
                const vals = selBuilds.map((b) => row.fn(b))
                return (
                  <div key={row.label} style={{ display: 'grid', gridTemplateColumns: `160px repeat(${selBuilds.length}, 1fr)`, gap: '0.5rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', alignSelf: 'center' }}>{row.label}</div>
                    {vals.map((v, i) => (
                      <div key={i} className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 600, color: COLORS[i % COLORS.length], textAlign: 'right' }}>{v}</div>
                    ))}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
