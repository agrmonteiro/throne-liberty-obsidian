import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcResult, calcElasticity, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import { DEFAULT_STATS } from '../engine/types'
import type { BuildStats } from '../engine/types'

const COLS    = 4
const COLORS  = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c']
const fmt     = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const fmtPct  = (n: number) => `${n.toFixed(2)}%`

// ─── Stat field definitions ───────────────────────────────────────────────────

type StatKey = keyof BuildStats

interface FieldDef {
  key:     StatKey
  label:   string
  group:   'skill' | 'build' | 'target'
  tooltip?: string
}

const FIELDS: FieldDef[] = [
  { key: 'skillBaseDamagePct',  label: 'Skill Base Damage %',  group: 'skill'  },
  { key: 'skillBonusBaseDmg',   label: 'Skill Bonus Base Dmg', group: 'skill'  },
  { key: 'minWeaponDmg',        label: 'Min Weapon Base Dmg',  group: 'build'  },
  { key: 'maxWeaponDmg',        label: 'Max Weapon Base Dmg',  group: 'build'  },
  { key: 'critHitChance',       label: 'Crit Hit Chance',      group: 'build'  },
  { key: 'heavyAttackChance',   label: 'Heavy Attack Chance',  group: 'build'  },
  { key: 'heavyAttackDmgComp',  label: 'Heavy Dmg Compl. *',  group: 'build', tooltip: 'Só o complemento acima de +100% (ex: jogo 114% → inserir 14)' },
  { key: 'skillDmgBoost',       label: 'Skill Damage Boost',   group: 'build'  },
  { key: 'monsterDmgBoostPct',  label: 'Monster Dmg Boost %',  group: 'build'  },
  { key: 'dmgBuffPct',          label: 'Damage Buff %',        group: 'build'  },
  { key: 'bonusDmg',            label: 'Bonus Damage',         group: 'build'  },
  { key: 'critDmgPct',          label: 'Crit Damage %',        group: 'build'  },
  { key: 'speciesDmgBoost',     label: 'Species Dmg Boost',    group: 'build'  },
  { key: 'targetDefense',       label: "Target's Defense",     group: 'target' },
  { key: 'targetEvasion',       label: "Target's Evasion",     group: 'target' },
  { key: 'targetEndurance',     label: "Target's Endurance",   group: 'target', tooltip: 'Endurance do alvo — reduz a crit chance efetiva antes do DR' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function Calculator(): React.ReactElement {
  const { builds } = useBuilds()
  const buildList  = useMemo(() => [{ id: '', name: 'Manual (zerado)' }, ...Object.values(builds)], [builds])

  const [sources,   setSources]   = useState<string[]>(['', '', '', ''])
  const [colStats,  setColStats]  = useState<BuildStats[]>(Array(COLS).fill(null).map(() => ({ ...DEFAULT_STATS })))
  const [iterations, setIter]     = useState(10)
  const [activeTab, setActiveTab] = useState<'bar' | 'gain' | 'elastic'>('bar')
  const [elasticData, setElastic] = useState<ReturnType<typeof calcElasticity> | null>(null)

  // Compute results
  const results = useMemo(() => {
    const baseline = calcResult(colStats[0], 0).avgDamage
    return colStats.map((s) => calcResult(s, baseline))
  }, [colStats])

  function applySource(colIdx: number, buildId: string) {
    const next = [...sources]
    next[colIdx] = buildId
    setSources(next)

    const nextStats = [...colStats]
    if (!buildId) {
      nextStats[colIdx] = { ...DEFAULT_STATS }
    } else {
      const build = builds[buildId]
      nextStats[colIdx] = build ? { ...build.stats } : { ...DEFAULT_STATS }
    }
    setColStats(nextStats)
  }

  function updateField(colIdx: number, key: StatKey, value: number) {
    const nextStats = colStats.map((s, i) => i === colIdx ? { ...s, [key]: value } : s)
    setColStats(nextStats)
  }

  function applyAutoVariations() {
    const base = { ...colStats[0] }
    const next = [...colStats]
    next[1] = { ...base, critHitChance:    base.critHitChance + 100 }
    next[2] = { ...base, heavyAttackChance: base.heavyAttackChance + 100 }
    next[3] = { ...base, critDmgPct:        base.critDmgPct + 1 }
    setColStats(next)
    setSources(['', 'Var: +100 Crit', 'Var: +100 Heavy', 'Var: +1% CritDmg'])
  }

  function runElasticity() {
    setElastic(calcElasticity(colStats[0], iterations))
    setActiveTab('elastic')
  }

  // Group fields
  const groups = ['skill', 'build', 'target'] as const
  const groupLabels = { skill: '🗡 Skill', build: '⚔ Build Stats', target: '🎯 Alvo' }

  // Chart data
  const barData  = results.map((r, i) => ({ name: `Build ${i + 1}`, dps: r.avgDamage }))
  const gainData = results.map((r, i) => ({ name: `Build ${i + 1}`, gain: r.gainPct }))

  // Elasticity chart data
  const elasticChartData = useMemo(() => {
    if (!elasticData) return []
    const byIter: Record<number, Record<string, unknown>> = {}
    for (const pt of elasticData) {
      if (!byIter[pt.iter]) byIter[pt.iter] = { iter: pt.iter }
      byIter[pt.iter][pt.label] = pt.gainPct
    }
    return Object.values(byIter)
  }, [elasticData])

  const elasticLabels = elasticData ? [...new Set(elasticData.map((p) => p.label))] : []
  const elasticColors = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a']

  // Lookup: label → iter → stats (para o tooltip detalhado)
  const elasticPointDetails = useMemo(() => {
    if (!elasticData) return {} as Record<string, Record<number, typeof elasticData[0]['stats']>>
    const map: Record<string, Record<number, typeof elasticData[0]['stats']>> = {}
    for (const pt of elasticData) {
      if (!map[pt.label]) map[pt.label] = {}
      map[pt.label][pt.iter] = pt.stats
    }
    return map
  }, [elasticData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Hero */}
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>Calculadora PvE</h1>
        <p>Compare 4 variações de build. Fórmulas Maxroll com Diminishing Returns.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* Source selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="tl-eyebrow" style={{ alignSelf: 'center' }}>Fonte</div>
          {Array.from({ length: COLS }).map((_, i) => (
            <div key={i}>
              <div className="tl-eyebrow" style={{ color: COLORS[i], marginBottom: 4 }}>Build {i + 1}</div>
              <select className="tl-input" style={{ fontFamily: 'Inter,sans-serif' }} value={sources[i]} onChange={(e) => applySource(i, e.target.value)}>
                {buildList.map((b) => <option key={b.id} value={b.id}>{b.id ? b.name.slice(0, 22) : 'Manual (zerado)'}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className="tl-btn-ghost" onClick={applyAutoVariations}>⚡ Variações automáticas</button>
        </div>

        {/* Result cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {results.map((r, i) => {
            const isBest = r.avgDamage === Math.max(...results.map((x) => x.avgDamage)) && r.avgDamage > 0
            return (
              <div key={i} className="tl-stat-card" style={{ borderColor: isBest ? COLORS[i] : undefined }}>
                <div className="tl-eyebrow" style={{ color: COLORS[i], marginBottom: 6 }}>
                  Build {i + 1}{isBest ? <span className="tl-tag tl-tag-gold" style={{ marginLeft: 6 }}>BEST</span> : null}
                </div>
                <div className="tl-dmg">{r.avgDamage > 0 ? fmt(r.avgDamage) : '—'}</div>
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-soft)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>Ganho: <span className={r.gainPct > 0 ? 'tl-gain-pos' : r.gainPct < 0 ? 'tl-gain-neg' : 'tl-gain-neu'}>{i === 0 ? 'BASE' : r.gainPct > 0 ? `+${fmtPct(r.gainPct)}` : fmtPct(r.gainPct)}</span></span>
                  <span>Crit: <span className="font-mono">{fmtPct(r.critChancePct)}</span></span>
                  <span>Heavy: <span className="font-mono">{fmtPct(r.heavyChancePct)}</span></span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="tl-card" style={{ marginBottom: '1.25rem' }}>
          <div className="tl-tabs">
            {(['bar', 'gain', 'elastic'] as const).map((t) => (
              <button key={t} className={`tl-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'bar' ? '📊 Dano Absoluto' : t === 'gain' ? '📈 Ganho %' : '⚙ Elasticidade'}
              </button>
            ))}
          </div>

          {activeTab === 'bar' && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#e2e4ec' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} />
                <Tooltip formatter={(v: number) => [fmt(v), 'DPS']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} labelStyle={{ color: 'var(--gold-l)' }} />
                <Bar dataKey="dps" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) }}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i]} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'gain' && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={gainData} margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#e2e4ec' }} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Ganho vs Build 1']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} labelStyle={{ color: 'var(--gold-l)' }} />
                <Bar dataKey="gain" radius={[4, 4, 0, 0]}>
                  {gainData.map((d, i) => <Cell key={i} fill={d.gain > 0 ? '#3dd68c' : d.gain < 0 ? '#f25f5c' : '#474f6b'} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'elastic' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div className="tl-eyebrow" style={{ marginBottom: 4 }}>Iterações</div>
                  <input type="number" className="tl-input" style={{ width: 80 }} min={1} max={100} value={iterations} onChange={(e) => setIter(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} />
                </div>
                <button className="tl-btn" style={{ marginTop: 20 }} onClick={runElasticity}>▶ Calcular</button>
              </div>
              {elasticData && elasticChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={elasticChartData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <XAxis dataKey="iter" tick={{ fontSize: 10, fill: '#7a8099' }} label={{ value: 'Iteração', position: 'insideBottom', offset: -5, fill: '#7a8099', fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '8px 12px', maxWidth: 270 }}>
                          <div style={{ color: '#d4af37', fontWeight: 700, marginBottom: 6, fontSize: 11 }}>Iteração {label}</div>
                          {payload.map((p: any) => {
                            const s = elasticPointDetails[p.dataKey]?.[label as number]
                            return (
                              <div key={p.dataKey} style={{ marginBottom: 5, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ color: p.stroke, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{p.dataKey}</div>
                                <div style={{ color: '#3dd68c' }}>Ganho: {(p.value as number) >= 0 ? '+' : ''}{(p.value as number).toFixed(2)}%</div>
                                {s && (<>
                                  <div style={{ color: 'var(--text-soft)', marginTop: 2 }}>
                                    Crit stat: <span style={{ color: '#e2e4ec' }}>{s.critHitChance}</span>
                                    {' → '}<span style={{ color: '#d4af37' }}>{(critChanceFromStat(s.critHitChance) * 100).toFixed(1)}%</span>
                                  </div>
                                  <div style={{ color: 'var(--text-soft)' }}>
                                    Heavy stat: <span style={{ color: '#e2e4ec' }}>{s.heavyAttackChance}</span>
                                    {' → '}<span style={{ color: '#7c5cfc' }}>{(heavyChanceFromStat(s.heavyAttackChance) * 100).toFixed(1)}%</span>
                                  </div>
                                  <div style={{ color: 'var(--text-soft)' }}>Crit Dmg: <span style={{ color: '#e2e4ec' }}>{s.critDmgPct}%</span></div>
                                  <div style={{ color: 'var(--text-soft)' }}>Skill Boost: <span style={{ color: '#e2e4ec' }}>{s.skillDmgBoost}</span></div>
                                </>)}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#e2e4ec' }} />
                    {elasticLabels.map((label, i) => (
                      <Line key={label} type="monotone" dataKey={label} stroke={elasticColors[i % elasticColors.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
                  Clique em ▶ Calcular para gerar o gráfico.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input grid */}
        <div className="tl-panel">
          <div className="tl-eyebrow" style={{ marginBottom: '0.75rem' }}>Parâmetros de Entrada</div>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div />
            {Array.from({ length: COLS }).map((_, i) => (
              <div key={i} className="tl-eyebrow" style={{ color: COLORS[i], textAlign: 'center' }}>Build {i + 1}</div>
            ))}
          </div>

          {groups.map((group) => (
            <div key={group}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.75rem 0 0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                {groupLabels[group]}
              </div>
              {FIELDS.filter((f) => f.group === group).map((field) => (
                <React.Fragment key={field.key}>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }} title={field.tooltip}>{field.label}</div>
                    {colStats.map((s, i) => (
                      <input
                        key={i}
                        type="number"
                        className="tl-input"
                        style={{ textAlign: 'right', borderColor: i === 0 ? 'rgba(212,175,55,0.2)' : undefined }}
                        value={s[field.key] as number}
                        step={1}
                        onChange={(e) => updateField(i, field.key, parseFloat(e.target.value) || 0)}
                      />
                    ))}
                  </div>
                  {field.key === 'critHitChance' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 8 }}>↳ Crit %</div>
                      {colStats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#d4af37', padding: '3px 8px', background: 'rgba(212,175,55,0.05)', borderRadius: 4 }}>
                          {fmtPct(critChanceFromStat(s.critHitChance) * 100)}
                        </div>
                      ))}
                    </div>
                  )}
                  {field.key === 'heavyAttackChance' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 8 }}>↳ Heavy %</div>
                      {colStats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7c5cfc', padding: '3px 8px', background: 'rgba(124,92,252,0.05)', borderRadius: 4 }}>
                          {fmtPct(heavyChanceFromStat(s.heavyAttackChance) * 100)}
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            * Heavy Dmg Compl. → informar só o complemento acima de 100% (ex: jogo mostra 114% → digitar 14)
          </div>
        </div>
      </div>
    </div>
  )
}
