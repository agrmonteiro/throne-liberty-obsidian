import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcSensitivity, calcTrueDps } from '../engine/calculator'
import { DEFAULT_STATS } from '../engine/types'
import { TOOLTIP_CONTENT, TOOLTIP_LABEL, TOOLTIP_ITEM } from '../styles/chartStyles'
import type { BuildStats } from '../engine/types'
import { useT } from '../i18n/useT'

import { fmt, fmtPct } from '../engine/fmt'
const fmtP = fmtPct

const RANK_COLORS = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a', '#a8b5d4']

export function Sensitivity(): React.ReactElement {
  const { builds, activeBuildId } = useBuilds()
  const t = useT()
  const buildList = useMemo(() => Object.values(builds), [builds])

  const [sourceId, setSourceId] = useState<string>(activeBuildId ?? '')

  const activeStats: BuildStats = useMemo(() => {
    if (sourceId && builds[sourceId]) return builds[sourceId].stats
    return { ...DEFAULT_STATS }
  }, [sourceId, builds])

  const sensitivity = useMemo(() => calcSensitivity(activeStats), [activeStats])
  const baseDps     = useMemo(() => calcTrueDps(activeStats), [activeStats])
  const best        = sensitivity[0]

  const barData = sensitivity.map((s) => ({
    label:  s.label.length > 22 ? s.label.slice(0, 22) + '…' : s.label,
    weight: parseFloat(s.weight.toFixed(2)),
    delta:  s.delta,
    attr:   s.attr,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>{t('sensitivity.title')}</h1>
        <p>{t('sensitivity.subtitle')}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* Source selector */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{t('sensitivity.source')}</div>
            <select className="tl-input" style={{ fontFamily: 'Inter,sans-serif', width: 240 }} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">{t('sensitivity.manual')}</option>
              {buildList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {baseDps > 0 && (
            <div className="tl-stat-card" style={{ padding: '0.6rem 1rem' }}>
              <div className="tl-eyebrow" style={{ marginBottom: 2 }}>{t('sensitivity.dpsBase')}</div>
              <div className="font-mono" style={{ fontSize: '1.1rem', color: '#f0cc55', fontWeight: 700 }}>{fmt(baseDps)}</div>
            </div>
          )}
        </div>

        {baseDps === 0 ? (
          <div className="tl-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-soft)' }}>
            Selecione uma build com stats de arma para análise.
          </div>
        ) : (
          <>
            {/* Best stat callout */}
            {best && (
              <div className="tl-panel" style={{ marginBottom: '1.25rem', borderColor: 'var(--border-gold)', background: 'rgba(212,175,55,0.04)' }}>
                <div className="tl-eyebrow" style={{ marginBottom: 6 }}>{t('sensitivity.recommendation')}</div>
                <div style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontSize: '1.1rem', fontWeight: 700 }}>
                  {t('sensitivity.prioritize')} {best.label}
                </div>
                <div style={{ color: 'var(--text-soft)', fontSize: '0.82rem', marginTop: 4 }}>
                  Stat com maior ganho de DPS por unidade investida. Peso relativo: <span className="font-mono" style={{ color: '#3dd68c', fontWeight: 600 }}>{fmtP(best.weight)}</span> do total de ganho simulado.
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Bar chart */}
              <div className="tl-panel">
                <div className="tl-eyebrow" style={{ marginBottom: 8 }}>{t('sensitivity.chart')}</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 50, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => fmtPct(v)} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#e2e4ec' }} width={150} />
                    <Tooltip
                      formatter={(v: number, _: string, entry: { payload?: { delta?: number } }) => [
                        fmtPct(v),
                        `Peso (delta: +${entry?.payload?.delta ?? '?'})`,
                      ]}
                      contentStyle={TOOLTIP_CONTENT}
                      labelStyle={TOOLTIP_LABEL}
                      itemStyle={TOOLTIP_ITEM}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]}
                      label={{ position: 'right', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmtPct(v) }}>
                      {barData.map((_, i) => <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ranked list */}
              <div className="tl-panel">
                <div className="tl-eyebrow" style={{ marginBottom: 10 }}>{t('sensitivity.ranking')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sensitivity.map((s, i) => {
                    const barW = Math.max(4, s.weight)
                    const medal = ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`
                    const color = RANK_COLORS[i % RANK_COLORS.length]
                    return (
                      <div key={s.attr}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', width: '1.5rem' }}>{medal}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{s.label}</span>
                          </div>
                          <span className="tl-tag" style={{ background: `${color}18`, border: `1px solid ${color}44`, color, fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmtP(s.weight)}
                          </span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${barW}%`, height: '100%', background: color, borderRadius: 2, opacity: 0.75, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Delta info */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <div style={{ color: 'var(--text-soft)', fontWeight: 600, marginBottom: 4 }}>{t('sensitivity.deltas')}</div>
                  {sensitivity.map((s) => (
                    <div key={s.attr} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.label}</span>
                      <span className="font-mono">+{s.delta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
