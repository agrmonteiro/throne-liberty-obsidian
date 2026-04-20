import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcAverageDPS, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import { useT } from '../i18n/useT'

const COLORS = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a']

import { fmt, fmtP } from '../engine/fmt'

export function Dashboard(): React.ReactElement {
  const { builds, activeBuildId, setActive } = useBuilds()
  const t = useT()

  const buildList = useMemo(() => Object.values(builds), [builds])

  const dpsData = useMemo(() =>
    buildList
      .map((b) => ({ name: b.name.slice(0, 20), dps: calcAverageDPS(b.stats), id: b.id }))
      .sort((a, b) => b.dps - a.dps),
    [buildList]
  )

  const best     = dpsData[0]
  const active   = activeBuildId ? builds[activeBuildId] : null
  const activeDps = active ? calcAverageDPS(active.stats) : 0
  const activeCrit  = active ? critChanceFromStat(active.stats.critHitChance) * 100 : 0
  const activeHeavy = active ? heavyChanceFromStat(active.stats.heavyAttackChance) * 100 : 0

  return (
    <div style={{ padding: '0 1.75rem 2rem', overflowY: 'auto', height: '100%' }}>
      {/* Hero */}
      <div className="tl-hero">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('dashboard.kpi.savedBuilds'), value: buildList.length.toString(), color: '#7c5cfc' },
          { label: t('dashboard.kpi.bestDps'),     value: best ? fmt(best.dps) : '—',   color: '#f0cc55' },
          { label: t('dashboard.kpi.critActive'),  value: fmtP(activeCrit),             color: '#d4af37' },
          { label: t('dashboard.kpi.heavyActive'), value: fmtP(activeHeavy),            color: '#7c5cfc' },
          { label: t('dashboard.kpi.dpsActive'),   value: activeDps > 0 ? fmt(activeDps) : '—', color: '#00d4ff' },
        ].map((k) => (
          <div key={k.label} className="tl-stat-card">
            <div className="tl-eyebrow" style={{ marginBottom: 6 }}>{k.label}</div>
            <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Main row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>
        {/* Bar chart */}
        <div className="tl-panel">
          <div className="tl-eyebrow" style={{ marginBottom: 8 }}>{t('dashboard.chart')}</div>
          {dpsData.length === 0 ? (
            <div style={{ color: 'var(--text-soft)', fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>
              {t('common.noBuilds')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, dpsData.length * 44)}>
              <BarChart data={dpsData} layout="vertical" margin={{ left: 8, right: 40 }}>
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#e2e4ec' }} width={130} />
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'DPS Real (/s)']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  labelStyle={{ color: 'var(--gold-l)' }}
                />
                <Bar dataKey="dps" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) }}>
                  {dpsData.map((entry, i) => (
                    <Cell key={entry.id} fill={i === 0 ? '#d4af37' : COLORS[(i) % COLORS.length]} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Active build panel */}
        <div className="tl-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="tl-eyebrow">{t('dashboard.activeBuild')}</div>
          {active ? (
            <>
              <div style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
                {active.name}
              </div>
              {active.weaponCombo && (
                <span className="tl-tag tl-tag-violet" style={{ alignSelf: 'flex-start' }}>{active.weaponCombo}</span>
              )}
              <hr className="tl-divider" />
              {[
                { label: 'DPS estimado',   value: fmt(activeDps),        color: '#f0cc55' },
                { label: 'Crit Chance',    value: fmtP(activeCrit),      color: '#d4af37' },
                { label: 'Heavy Chance',   value: fmtP(activeHeavy),     color: '#7c5cfc' },
                { label: 'Skill Boost',    value: active.stats.skillDmgBoost.toString(), color: '#00d4ff' },
                { label: 'Crit Damage %',  value: `${active.stats.critDmgPct}%`,         color: '#d4af37' },
                { label: 'Max Weapon',     value: active.stats.maxWeaponDmg.toString(),   color: '#a8b5d4' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>{row.label}</span>
                  <span className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: 'var(--text-soft)', fontSize: '0.82rem', textAlign: 'center', paddingTop: '1.5rem' }}>
              {t('dashboard.noBuild')}
            </div>
          )}

          {/* Build selector */}
          {buildList.length > 0 && (
            <>
              <hr className="tl-divider" />
              <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{t('dashboard.switchBuild')}</div>
              <select
                className="tl-input"
                value={activeBuildId ?? ''}
                onChange={(e) => setActive(e.target.value || null)}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <option value="">{t('common.selectBuild')}...</option>
                {buildList.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Feature panels */}
      <hr className="tl-divider" style={{ marginTop: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {[
          { icon: '⚔', titleKey: 'dashboard.features.calc', subKey: 'dashboard.features.calcSub' },
          { icon: '🕷', titleKey: 'dashboard.features.comp', subKey: 'dashboard.features.compSub' },
          { icon: '📡', titleKey: 'dashboard.features.sens', subKey: 'dashboard.features.sensSub' },
        ].map((f) => (
          <div key={f.titleKey} className="tl-panel">
            <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{t(f.titleKey)}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>{t(f.subKey)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
