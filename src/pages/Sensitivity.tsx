import React, { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  ComposedChart, Line, ReferenceLine, Legend,
} from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcSensitivity, calcTrueDps, calcReturnCurves, calcCrossoverSimulation } from '../engine/calculator'
import { DEFAULT_STATS } from '../engine/types'
import { TOOLTIP_CONTENT, TOOLTIP_LABEL, TOOLTIP_ITEM } from '../styles/chartStyles'
import type { BuildStats } from '../engine/types'
import { useT } from '../i18n/useT'
import { useState } from 'react'
import { fmt, fmtPct } from '../engine/fmt'

const fmtP = fmtPct

const RANK_COLORS = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a', '#a8b5d4']

const CRIT_COLOR  = '#7c5cfc'
const HEAVY_COLOR = '#f0965a'
const MARG_COLOR  = '#a8b5d4'

const AXIS_TICK = { fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' } as const
const X_TICKS   = [0, 1000, 2000, 3000, 4000, 5000]

function xFmt(v: number) { return v === 0 ? '0' : `${v / 1000}k` }

// ─── Balance charts ───────────────────────────────────────────────────────────

type CurveChartProps = {
  data:        ReturnType<typeof calcReturnCurves>
  pctKey:      'critPct' | 'heavyPct'
  margKey:     'critMarg' | 'heavyMarg'
  color:       string
  refX?:       number
  refLabel?:   string
  endurance?:  number
  probLabel:   string
  margLabel:   string
}

function CurveChart({ data, pctKey, margKey, color, refX, refLabel, endurance, probLabel, margLabel }: CurveChartProps) {
  const tooltipFormatter = (v: number, name: string) => {
    if (name === probLabel) return [`${v.toFixed(1)}%`, name]
    return [`${v.toFixed(3)}%`, name]
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ left: 4, right: 44, top: 8, bottom: 4 }}>
        <XAxis
          dataKey="stat"
          tick={AXIS_TICK}
          ticks={X_TICKS}
          tickFormatter={xFmt}
        />
        <YAxis
          yAxisId="prob"
          domain={[0, 100]}
          tick={AXIS_TICK}
          tickFormatter={(v: number) => `${v}%`}
          width={38}
        />
        <YAxis
          yAxisId="marg"
          orientation="right"
          tick={{ ...AXIS_TICK, fontSize: 8 }}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
          width={40}
        />
        <Tooltip
          contentStyle={TOOLTIP_CONTENT}
          labelStyle={TOOLTIP_LABEL}
          itemStyle={TOOLTIP_ITEM}
          labelFormatter={(v: number) => `Stat: ${v}`}
          formatter={tooltipFormatter}
        />
        <Line
          yAxisId="prob"
          dataKey={pctKey}
          name={probLabel}
          dot={false}
          stroke={color}
          strokeWidth={2.5}
          activeDot={{ r: 3 }}
        />
        <Line
          yAxisId="marg"
          dataKey={margKey}
          name={margLabel}
          dot={false}
          stroke={MARG_COLOR}
          strokeWidth={1.5}
          strokeDasharray="5 3"
          activeDot={{ r: 2 }}
        />
        {(endurance ?? 0) > 0 && (
          <ReferenceLine
            yAxisId="prob"
            x={endurance}
            stroke="#f25f5c"
            strokeDasharray="2 4"
            strokeWidth={1}
            label={{ value: 'end.', position: 'insideTopLeft', fill: '#f25f5c', fontSize: 7 }}
          />
        )}
        {(refX ?? 0) > 0 && (
          <ReferenceLine
            yAxisId="prob"
            x={refX}
            stroke={color}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            label={{ value: refLabel, position: 'insideTopRight', fill: color, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // ── Return curves ──────────────────────────────────────────────────────────
  const endurance     = activeStats.targetEndurance ?? 0
  const curveData     = useMemo(() => calcReturnCurves(endurance), [endurance])
  const crossoverData = useMemo(() => calcCrossoverSimulation(activeStats), [activeStats])

  // total = base + bônus vs chefe (mesma lógica do calcAverageDPS)
  const critStat  = (activeStats.critHitChance   ?? 0) + (activeStats.bossCritChance  ?? 0)
  const heavyStat = (activeStats.heavyAttackChance ?? 0) + (activeStats.bossHeavyChance ?? 0)
  const critEff   = Math.max(0, critStat - endurance)

  const critPctNow   = critEff  > 0 ? critEff  / (critEff  + 1000) * 100 : 0
  const heavyPctNow  = heavyStat > 0 ? heavyStat / (heavyStat + 1000) * 100 : 0

  const critEffN   = Math.max(0, critStat  + 100 - endurance)
  const critMargNow  = (critEffN  / (critEffN  + 1000) - critEff  / (critEff  + 1000)) * 100
  const heavyMargNow = ((heavyStat + 100) / (heavyStat + 1100) - heavyStat / (heavyStat + 1000)) * 100

  const invest: 'crit' | 'heavy' | 'balanced' =
    critMargNow > heavyMargNow + 0.001 ? 'crit' :
    heavyMargNow > critMargNow + 0.001 ? 'heavy' : 'balanced'

  // ── Crossover: onde critMarg(x) == heavyMarg(x) na mesma escala ──────────
  const crossoverStat = useMemo(() => {
    if (endurance === 0) return null
    let prev = curveData[0]
    for (let i = 1; i < curveData.length; i++) {
      const curr = curveData[i]
      const pd = prev.critMarg - prev.heavyMarg
      const cd = curr.critMarg - curr.heavyMarg
      if (pd * cd <= 0 && pd !== cd) {
        // interpolação linear
        return Math.round(prev.stat + Math.abs(pd) / (Math.abs(pd) + Math.abs(cd)) * (curr.stat - prev.stat))
      }
      prev = curr
    }
    return null
  }, [curveData, endurance])

  // alvo analítico de balanceamento: critEff = heavyStat
  const critTargetStat  = heavyStat + endurance   // onde crit deveria estar
  const heavyTargetStat = critEff                  // onde heavy deveria estar
  const balanceMarg     = Math.min(critMargNow, heavyMargNow)

  const tb = t('sensitivity.balance')

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
            {t('sensitivity.noStats')}
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
                  {t('sensitivity.statInfo')} <span className="font-mono" style={{ color: '#3dd68c', fontWeight: 600 }}>{fmtP(best.weight)}</span> {t('sensitivity.statInfoTotal')}
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
                        `${t('sensitivity.tooltipWeight')}${entry?.payload?.delta ?? '?'})`,
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
                  <div style={{ color: 'var(--text-soft)', fontWeight: 600, marginBottom: 4 }}>{t('sensitivity.deltaLabel')}</div>
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

        {/* ── Return curves section (sempre visível quando há build) ── */}
        {baseDps > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{tb.title}</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-soft)', margin: '0 0 1rem' }}>{tb.subtitle}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Crit curve */}
              <div className="tl-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: CRIT_COLOR }} />
                  <span className="tl-eyebrow" style={{ color: CRIT_COLOR }}>{tb.critChart}</span>
                  {critStat > 0 && (
                    <span className="tl-tag font-mono" style={{ marginLeft: 'auto', background: `${CRIT_COLOR}18`, border: `1px solid ${CRIT_COLOR}44`, color: CRIT_COLOR }}>
                      {critPctNow.toFixed(1)}%
                    </span>
                  )}
                </div>
                <CurveChart
                  data={curveData}
                  pctKey="critPct"
                  margKey="critMarg"
                  color={CRIT_COLOR}
                  refX={critStat > 0 ? critStat : undefined}
                  refLabel={critStat > 0 ? `${critPctNow.toFixed(1)}%` : undefined}
                  endurance={endurance > 0 ? endurance : undefined}
                  probLabel={tb.probLine}
                  margLabel={tb.margLine}
                />
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{tb.probLine}: <span className="font-mono" style={{ color: CRIT_COLOR }}>{critPctNow.toFixed(2)}%</span></span>
                  <span>{tb.margLine}: <span className="font-mono" style={{ color: MARG_COLOR }}>{critMargNow.toFixed(3)}%</span></span>
                </div>
              </div>

              {/* Heavy curve */}
              <div className="tl-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: HEAVY_COLOR }} />
                  <span className="tl-eyebrow" style={{ color: HEAVY_COLOR }}>{tb.heavyChart}</span>
                  {heavyStat > 0 && (
                    <span className="tl-tag font-mono" style={{ marginLeft: 'auto', background: `${HEAVY_COLOR}18`, border: `1px solid ${HEAVY_COLOR}44`, color: HEAVY_COLOR }}>
                      {heavyPctNow.toFixed(1)}%
                    </span>
                  )}
                </div>
                <CurveChart
                  data={curveData}
                  pctKey="heavyPct"
                  margKey="heavyMarg"
                  color={HEAVY_COLOR}
                  refX={heavyStat > 0 ? heavyStat : undefined}
                  refLabel={heavyStat > 0 ? `${heavyPctNow.toFixed(1)}%` : undefined}
                  probLabel={tb.probLine}
                  margLabel={tb.margLine}
                />
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{tb.probLine}: <span className="font-mono" style={{ color: HEAVY_COLOR }}>{heavyPctNow.toFixed(2)}%</span></span>
                  <span>{tb.margLine}: <span className="font-mono" style={{ color: MARG_COLOR }}>{heavyMargNow.toFixed(3)}%</span></span>
                </div>
              </div>
            </div>

            {/* ── Terceiro gráfico: cruzamento de retorno marginal ── */}
            <div className="tl-panel" style={{ marginTop: '1rem' }}>
              <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{tb.crossChart}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', margin: '0 0 0.75rem' }}>{tb.crossSubtitle}</p>

              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={crossoverData} margin={{ left: 4, right: 56, top: 8, bottom: 4 }}>
                  <XAxis
                    dataKey="stat"
                    tick={AXIS_TICK}
                    ticks={X_TICKS}
                    tickFormatter={xFmt}
                  />
                  {/* Eixo esquerdo: retorno marginal % */}
                  <YAxis
                    yAxisId="marg"
                    tick={AXIS_TICK}
                    tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                    width={44}
                    label={{ value: '% / +100', angle: -90, position: 'insideLeft', fill: '#7a8099', fontSize: 8, dy: 30 }}
                  />
                  {/* Eixo direito: dano total 60s */}
                  <YAxis
                    yAxisId="dps"
                    orientation="right"
                    tick={AXIS_TICK}
                    tickFormatter={(v: number) => fmt(v)}
                    width={52}
                    label={{ value: 'DMG 60s', angle: 90, position: 'insideRight', fill: '#7a8099', fontSize: 8, dy: -28 }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT}
                    labelStyle={TOOLTIP_LABEL}
                    itemStyle={TOOLTIP_ITEM}
                    labelFormatter={(v: number) => `Stat: ${v}`}
                    formatter={(v: number, name: string) => {
                      if (name.startsWith('DMG')) return [fmt(v), name]
                      return [`${v.toFixed(3)}%`, name]
                    }}
                  />
                  <Legend
                    iconType="line"
                    wrapperStyle={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', paddingTop: 4 }}
                  />

                  {/* Curvas de retorno marginal (eixo esquerdo) */}
                  <Line yAxisId="marg" dataKey="critMarg"  name="Retorno Crítico %"  dot={false} stroke={CRIT_COLOR}  strokeWidth={2}   activeDot={{ r: 3 }} />
                  <Line yAxisId="marg" dataKey="heavyMarg" name="Retorno Pesado %"   dot={false} stroke={HEAVY_COLOR} strokeWidth={2}   activeDot={{ r: 3 }} />

                  {/* Curvas DPS 60s (eixo direito) */}
                  <Line yAxisId="dps" dataKey="dps60sCrit"  name="DMG 60s (+Crítico)"  dot={false} stroke={CRIT_COLOR}  strokeWidth={1.5} strokeDasharray="6 3" activeDot={{ r: 2 }} />
                  <Line yAxisId="dps" dataKey="dps60sHeavy" name="DMG 60s (+Pesado)"   dot={false} stroke={HEAVY_COLOR} strokeWidth={1.5} strokeDasharray="6 3" activeDot={{ r: 2 }} />
                  <Line yAxisId="dps" dataKey="dps60sBoth"  name="DMG 60s (Ambos)"     dot={false} stroke="#3dd68c"     strokeWidth={1.5} strokeDasharray="3 3" activeDot={{ r: 2 }} />

                  {/* Posições atuais */}
                  {critStat > 0 && (
                    <ReferenceLine yAxisId="marg" x={critStat} stroke={CRIT_COLOR} strokeDasharray="3 3" strokeWidth={1.5}
                      label={{ value: `C:${critStat}`, position: 'insideTopRight', fill: CRIT_COLOR, fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                  )}
                  {heavyStat > 0 && (
                    <ReferenceLine yAxisId="marg" x={heavyStat} stroke={HEAVY_COLOR} strokeDasharray="3 3" strokeWidth={1.5}
                      label={{ value: `H:${heavyStat}`, position: 'insideTopLeft', fill: HEAVY_COLOR, fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                  )}

                  {/* Ponto de cruzamento das curvas marginais */}
                  {crossoverStat !== null && (
                    <ReferenceLine yAxisId="marg" x={crossoverStat} stroke="#3dd68c" strokeWidth={2}
                      label={{ value: `▼ ${crossoverStat}`, position: 'insideTop', fill: '#3dd68c', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}
                    />
                  )}

                  {/* Linha horizontal de nivelamento */}
                  {balanceMarg > 0 && (
                    <ReferenceLine yAxisId="marg" y={balanceMarg} stroke="#f0cc55" strokeDasharray="4 3" strokeWidth={1}
                      label={{ value: tb.crossTarget, position: 'insideTopRight', fill: '#f0cc55', fontSize: 8 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>

              {/* Alvos numéricos de balanceamento */}
              <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.72rem' }}>
                <div style={{ padding: '0.5rem 0.75rem', background: `${CRIT_COLOR}0d`, border: `1px solid ${CRIT_COLOR}33`, borderRadius: 6 }}>
                  <div className="tl-eyebrow" style={{ color: CRIT_COLOR, marginBottom: 3 }}>{tb.crossTargetCrit}</div>
                  <span className="font-mono" style={{ color: CRIT_COLOR, fontWeight: 700 }}>{critTargetStat}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>(atual: {critStat})</span>
                </div>
                <div style={{ padding: '0.5rem 0.75rem', background: `${HEAVY_COLOR}0d`, border: `1px solid ${HEAVY_COLOR}33`, borderRadius: 6 }}>
                  <div className="tl-eyebrow" style={{ color: HEAVY_COLOR, marginBottom: 3 }}>{tb.crossTargetHeavy}</div>
                  <span className="font-mono" style={{ color: HEAVY_COLOR, fontWeight: 700 }}>{heavyTargetStat}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>(atual: {heavyStat})</span>
                </div>
                <div style={{ padding: '0.5rem 0.75rem', background: '#3dd68c0d', border: '1px solid #3dd68c33', borderRadius: 6 }}>
                  <div className="tl-eyebrow" style={{ color: '#3dd68c', marginBottom: 3 }}>
                    {crossoverStat !== null ? `${tb.crossAt} ${crossoverStat}` : tb.crossNone}
                  </div>
                  <span className="font-mono" style={{ color: '#3dd68c', fontWeight: 700 }}>{balanceMarg.toFixed(3)}%</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{tb.crossTarget}</span>
                </div>
              </div>
            </div>

            {/* Balance insight card */}
            <div className="tl-panel" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.25rem', alignItems: 'center' }}>
              {/* Crit marginal */}
              <div>
                <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{tb.margCrit}</div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: CRIT_COLOR }}>
                  {critMargNow.toFixed(3)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  {tb.perPts} · {tb.currChance} <span className="font-mono">{critPctNow.toFixed(1)}%</span>
                </div>
              </div>

              {/* Heavy marginal */}
              <div>
                <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{tb.margHeavy}</div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: HEAVY_COLOR }}>
                  {heavyMargNow.toFixed(3)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  {tb.perPts} · {tb.currChance} <span className="font-mono">{heavyPctNow.toFixed(1)}%</span>
                </div>
              </div>

              {/* Recommendation */}
              <div style={{
                textAlign: 'center',
                padding: '0.75rem 1.25rem',
                borderRadius: 8,
                border: `1px solid ${invest === 'crit' ? `${CRIT_COLOR}55` : invest === 'heavy' ? `${HEAVY_COLOR}55` : '#3dd68c55'}`,
                background: invest === 'crit' ? `${CRIT_COLOR}10` : invest === 'heavy' ? `${HEAVY_COLOR}10` : '#3dd68c10',
                minWidth: 160,
              }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: invest === 'crit' ? CRIT_COLOR : invest === 'heavy' ? HEAVY_COLOR : '#3dd68c',
                  marginBottom: 4,
                }}>
                  {invest === 'crit' ? tb.investCrit : invest === 'heavy' ? tb.investHeavy : tb.balanced}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>
                  {invest === 'balanced' ? tb.equalReturn : tb.higherReturn}
                </div>
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {tb.equilibrium}
                  <br />
                  <span style={{ color: 'var(--text-soft)' }}>
                    {critEff} {invest === 'balanced' ? '=' : critEff > heavyStat ? '>' : '<'} {heavyStat}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
