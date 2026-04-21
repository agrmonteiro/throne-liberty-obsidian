import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcResult, calcElasticity, critChanceFromStat, heavyChanceFromStat, effectiveCastTime, effectiveCooldown } from '../engine/calculator'
import type { ElasticityTest } from '../engine/calculator'
import { TOOLTIP_CONTENT, TOOLTIP_LABEL, TOOLTIP_ITEM } from '../styles/chartStyles'
import { DEFAULT_STATS } from '../engine/types'
import type { BuildStats } from '../engine/types'

import { fmt, fmtPct } from '../engine/fmt'

const COLS    = 4
const COLORS  = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c']

const ADDITIVE_OPTS: Array<{ key: StatKey; label: string; defaultStep: number }> = [
  { key: 'critHitChance',     label: 'Crit Chance',      defaultStep: 100 },
  { key: 'heavyAttackChance', label: 'Heavy Chance',     defaultStep: 100 },
  { key: 'maxWeaponDmg',      label: 'Max Weapon Dmg',   defaultStep: 10  },
  { key: 'skillDmgBoost',     label: 'Skill Dmg Boost',  defaultStep: 50  },
  { key: 'cdrPct',            label: 'Cooldown Speed %', defaultStep: 5   },
  { key: 'attackSpeedPct',    label: 'Attack Speed %',   defaultStep: 5   },
]

const ELASTIC_STAT_OPTS: Array<{ key: StatKey; label: string }> = [
  { key: 'critHitChance',      label: 'Crit Hit Chance'     },
  { key: 'bossCritChance',     label: 'Boss Crit Chance'    },
  { key: 'heavyAttackChance',  label: 'Heavy Attack Chance' },
  { key: 'bossHeavyChance',    label: 'Boss Heavy Chance'   },
  { key: 'critDmgPct',         label: 'Crit Damage %'       },
  { key: 'maxWeaponDmg',       label: 'Max Weapon Dmg'      },
  { key: 'minWeaponDmg',       label: 'Min Weapon Dmg'      },
  { key: 'skillDmgBoost',      label: 'Skill Dmg Boost'     },
  { key: 'bonusDmg',           label: 'Bonus Damage'        },
  { key: 'speciesDmgBoost',    label: 'Species Dmg Boost'   },
  { key: 'monsterDmgBoostPct', label: 'Monster Dmg Boost %' },
  { key: 'dmgBuffPct',         label: 'Damage Buff %'       },
  { key: 'cdrPct',             label: 'Cooldown Speed %'    },
  { key: 'attackSpeedPct',     label: 'Attack Speed %'      },
]

interface SwapConfig {
  fromStat: StatKey
  fromStep: number
  toStat:   StatKey
  toStep:   number
}

// ─── Stat field definitions ───────────────────────────────────────────────────

type StatKey = keyof BuildStats

interface FieldDef {
  key:      StatKey
  label:    string
  group:    'skill' | 'build' | 'target'
  tooltip?: string
  max?:     number
}

const FIELDS: FieldDef[] = [
  { key: 'skillBaseDamagePct',  label: 'Skill Base Damage %',  group: 'skill'  },
  { key: 'skillBonusBaseDmg',   label: 'Skill Bonus Base Dmg', group: 'skill'  },
  { key: 'skillCooldown',       label: 'Cooldown Base (s)',     group: 'skill', tooltip: 'Cooldown base da skill em segundos' },
  { key: 'skillCastTime',       label: 'Tempo de Cast (s)',     group: 'skill', tooltip: 'Tempo de cast da skill em segundos' },
  { key: 'minWeaponDmg',        label: 'Min Weapon Base Dmg',  group: 'build'  },
  { key: 'maxWeaponDmg',        label: 'Max Weapon Base Dmg',  group: 'build'  },
  { key: 'cdrPct',              label: 'Cooldown Speed %',     group: 'build', tooltip: 'Redução de cooldown em % — hard cap: 120%', max: 120 },
  { key: 'attackSpeedPct',     label: 'Attack Speed %',       group: 'build', tooltip: 'Velocidade de ataque adicional em % — hard cap: 150%', max: 150 },
  { key: 'critHitChance',       label: 'Crit Hit Chance',      group: 'build'  },
  { key: 'bossCritChance',      label: 'Boss Crit Chance',     group: 'build', tooltip: 'Bônus EXTRA vs Chefe — inserir apenas a diferença (quest log boss − crit normal). Ex: quest log mostra 700 boss e 500 normal → inserir 200.' },
  { key: 'heavyAttackChance',   label: 'Heavy Attack Chance',  group: 'build'  },
  { key: 'bossHeavyChance',     label: 'Boss Heavy Chance',    group: 'build', tooltip: 'Bônus EXTRA vs Chefe — inserir apenas a diferença (quest log boss − heavy normal). Ex: quest log mostra 400 boss e 300 normal → inserir 100.' },
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

export function Calculator(): React.ReactElement {
  const { builds, saveBuild, createEmpty } = useBuilds()
  const buildList  = useMemo(() => [{ id: '', name: 'Manual (zerado)' }, ...Object.values(builds)], [builds])

  const [sources,   setSources]   = useState<string[]>(['', '', '', ''])
  const [colStats,  setColStats]  = useState<BuildStats[]>(Array(COLS).fill(null).map(() => ({ ...DEFAULT_STATS })))
  const [iterations, setIter]     = useState(10)
  const [activeTab, setActiveTab] = useState<'bar' | 'gain' | 'elastic'>('bar')
  const [elasticData, setElastic] = useState<ReturnType<typeof calcElasticity> | null>(null)

  // Novas features: maximize, hidden e selPoint
  const [maximized, setMaximized] = useState<'bar' | 'gain' | 'elastic' | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [selPoint, setSelPoint] = useState<{ title: string; buildName: string; text: string; color: string } | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [showFormula, setShowFormula] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [addSteps, setAddSteps] = useState<Record<string, number>>(
    Object.fromEntries(ADDITIVE_OPTS.map((o) => [o.key, o.defaultStep]))
  )
  const [swaps, setSwaps] = useState<SwapConfig[]>([
    { fromStat: 'critHitChance', fromStep: 100, toStat: 'heavyAttackChance', toStep: 100 },
  ])

  // Compute results
  const results = useMemo(() => {
    const baseline = calcResult(colStats[0], 0).avgDamage
    return colStats.map((s) => calcResult(s, baseline))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colStats, refreshKey])

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

  function copyPrevious(colIdx: number) {
    if (colIdx === 0) return
    const prevStats = { ...colStats[colIdx - 1] }
    const nextStats = [...colStats]
    nextStats[colIdx] = prevStats
    setColStats(nextStats)
    
    // Desvincular da fonte original para indicar que é uma cópia solta (não afetar a base se editar)
    const nextSources = [...sources]
    nextSources[colIdx] = ''
    setSources(nextSources)
  }

  async function handleSaveStats(colIdx: number) {
    const defaultName = sources[colIdx] && builds[sources[colIdx]] 
      ? `Cópia: ${builds[sources[colIdx]].name}` 
      : `Variação Customizada ${colIdx}`
      
    const name = window.prompt('Salvar variação de Build: digite o nome de identificação', defaultName)
    if (!name) return

    const stats = { ...colStats[colIdx] }
    const newBuild = createEmpty(name)
    newBuild.stats = stats
    
    await saveBuild(newBuild)
    
    const nextSources = [...sources]
    nextSources[colIdx] = newBuild.id
    setSources(nextSources)
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

  function updateSwap(idx: number, field: keyof SwapConfig, value: StatKey | number) {
    setSwaps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }
  function addSwap() {
    setSwaps((prev) => [...prev, { fromStat: 'heavyAttackChance', fromStep: 100, toStat: 'critHitChance', toStep: 100 }])
  }
  function removeSwap(idx: number) {
    setSwaps((prev) => prev.filter((_, i) => i !== idx))
  }

  function runElasticity() {
    const customTests: ElasticityTest[] = [
      ...ADDITIVE_OPTS.map((opt) => ({
        key:   `add_${opt.key}`,
        label: `${opt.label} (+${addSteps[opt.key]}/iter)`,
        run:   (b: BuildStats, i: number) => ({ ...b, [opt.key]: (b[opt.key] as number) + addSteps[opt.key] * i }),
      })),
      ...swaps.map((sw, idx) => {
        const fromLabel = ELASTIC_STAT_OPTS.find((o) => o.key === sw.fromStat)?.label ?? sw.fromStat
        const toLabel   = ELASTIC_STAT_OPTS.find((o) => o.key === sw.toStat)?.label ?? sw.toStat
        return {
          key:   `swap_${idx}`,
          label: `${fromLabel} ▸ ${toLabel}`,
          stopWhen: (base: BuildStats, i: number) => (base[sw.fromStat] as number) - sw.fromStep * i <= 0,
          run:   (b: BuildStats, i: number) => ({
            ...b,
            [sw.fromStat]: Math.max(0, (b[sw.fromStat] as number) - sw.fromStep * i),
            [sw.toStat]:   (b[sw.toStat]   as number) + sw.toStep   * i,
          }),
        }
      }),
    ]
    setElastic(calcElasticity(colStats[0], iterations, customTests))
    setActiveTab('elastic')
  }

  // Helpers para toggle e select
  function toggleHide(id: string) {
    setHidden(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Group fields
  const groups = ['skill', 'build', 'target'] as const
  const groupLabels = { skill: '🗡 Skill', build: '⚔ Build Stats', target: '🎯 Alvo' }

  // Chart data — usando trueDps (dano médio / ciclo) como métrica principal
  const barData  = results.map((r, i) => ({ id: `Build ${i+1}`, name: `Build ${i+1}`, dps: r.trueDps }))
  const baseTrueDps = results[0]?.trueDps ?? 0
  const gainData = results.map((r, i) => ({
    id: `Build ${i+1}`,
    name: `Build ${i+1}`,
    gain: i === 0 ? 0 : baseTrueDps > 0 ? ((r.trueDps - baseTrueDps) / baseTrueDps) * 100 : 0,
  }))

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

  const elasticPointDetails = useMemo(() => {
    if (!elasticData) return {} as Record<string, Record<number, typeof elasticData[0]['stats']>>
    const map: Record<string, Record<number, typeof elasticData[0]['stats']>> = {}
    for (const pt of elasticData) {
      if (!map[pt.label]) map[pt.label] = {}
      map[pt.label][pt.iter] = pt.stats
    }
    return map
  }, [elasticData])

  // Legend formatting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function legendFmt(value: string, entry: any) {
    const isHid = hidden.has(entry?.dataKey as string)
    return (
      <span style={{ opacity: isHid ? 0.28 : 1, textDecoration: isHid ? 'line-through' : 'none', cursor: 'pointer', userSelect: 'none', fontSize: '0.72rem' }}>
        {value}
      </span>
    )
  }

  // Chart Renderers (para reaproveitar entre normal e maximized)
  function renderBar(height: number | string) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={barData} margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#e2e4ec' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} />
          <Tooltip formatter={(v: number) => [fmt(v), 'Dano Simples (/s)']} contentStyle={TOOLTIP_CONTENT} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          <Legend formatter={(value) => <span style={{ fontSize: '0.72rem' }}>Clique no Card (Build 1, 2...) para ocultar barras</span>} iconSize={0} />
          <Bar
            dataKey="dps"
            radius={[4, 4, 0, 0]}
            label={showLabels ? { position: 'top', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) } : undefined}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(d: any, i: number) => setSelPoint({ title: 'Dano Simples (/s)', buildName: d.name, text: fmt(d.dps), color: COLORS[i] })}
            style={{ cursor: 'pointer' }}
          >
            {barData.map((d, i) => <Cell key={i} fill={COLORS[i]} opacity={hidden.has(d.id) ? 0.1 : 0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  function renderGain(height: number | string) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={gainData} margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#e2e4ec' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => fmtPct(v)} />
          <Tooltip formatter={(v: number) => [fmtPct(v), 'Ganho vs Build 1']} contentStyle={TOOLTIP_CONTENT} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          <Legend formatter={(value) => <span style={{ fontSize: '0.72rem' }}>Clique no Card (Build 1, 2...) para ocultar barras</span>} iconSize={0} />
          <Bar
            dataKey="gain"
            radius={[4, 4, 0, 0]}
            label={showLabels ? { position: 'top', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmtPct(v) } : undefined}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(d: any) => setSelPoint({ title: 'Ganho %', buildName: d.name, text: fmtPct(d.gain), color: d.gain > 0 ? '#3dd68c' : d.gain < 0 ? '#f25f5c' : '#474f6b' })}
            style={{ cursor: 'pointer' }}
          >
            {gainData.map((d, i) => <Cell key={i} fill={d.gain > 0 ? '#3dd68c' : d.gain < 0 ? '#f25f5c' : '#474f6b'} opacity={hidden.has(d.id) ? 0.1 : 0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  function renderElastic(height: number | string) {
    if (!elasticData || elasticChartData.length === 0) {
      return <div style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>Clique em ▶ Calcular para gerar o gráfico.</div>
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={elasticChartData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
          <XAxis dataKey="iter" tick={{ fontSize: 10, fill: '#7a8099' }} label={{ value: 'Iteração', position: 'insideBottom', offset: -5, fill: '#7a8099', fontSize: 10 }} />
          <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => fmtPct(v)} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-gold)', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.55), 0 0 12px var(--gold-glow)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '8px 12px', maxWidth: 270 }}>
                <div style={{ color: '#d4af37', fontWeight: 700, marginBottom: 6, fontSize: 11 }}>Iteração {label}</div>
                {[...(payload ?? [])].sort((a: any, b: any) => (b.value as number) - (a.value as number)).map((p: any) => {
                  const s = elasticPointDetails[p.dataKey]?.[label as number]
                  return (
                    <div key={p.dataKey} style={{ marginBottom: 5, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: p.stroke, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{p.dataKey}</div>
                      <div style={{ color: '#3dd68c' }}>Ganho: {(p.value as number) >= 0 ? '+' : ''}{fmtPct(p.value as number)}</div>
                      {s && (<>
                        <div style={{ color: 'var(--text-soft)', marginTop: 2 }}>
                          {(() => {
                            const tc = s.critHitChance + (s.bossCritChance ?? 0)
                            const zero = tc <= 0
                            return <>
                              Crit stat: <span style={{ color: zero ? '#f0965a' : '#e2e4ec', fontWeight: zero ? 700 : undefined }}>{tc}</span>
                              {(s.bossCritChance ?? 0) > 0 && <span style={{ color: '#8a9bbf', fontSize: 9 }}> ({s.critHitChance}+{s.bossCritChance}b)</span>}
                              {' → '}<span style={{ color: '#d4af37' }}>{fmtPct(critChanceFromStat(tc, s.targetEndurance) * 100)}</span>
                            </>
                          })()}
                        </div>
                        <div style={{ color: 'var(--text-soft)' }}>
                          {(() => {
                            const th = s.heavyAttackChance + (s.bossHeavyChance ?? 0)
                            const zero = th <= 0
                            return <>
                              Heavy stat: <span style={{ color: zero ? '#f0965a' : '#e2e4ec', fontWeight: zero ? 700 : undefined }}>{th}</span>
                              {(s.bossHeavyChance ?? 0) > 0 && <span style={{ color: '#8a9bbf', fontSize: 9 }}> ({s.heavyAttackChance}+{s.bossHeavyChance}b)</span>}
                              {' → '}<span style={{ color: '#7c5cfc' }}>{fmtPct(heavyChanceFromStat(th) * 100)}</span>
                            </>
                          })()}
                        </div>
                        <div style={{ color: 'var(--text-soft)' }}>Crit Dmg: <span style={{ color: '#e2e4ec' }}>{s.critDmgPct}%</span></div>
                        <div style={{ color: 'var(--text-soft)' }}>Skill Boost: <span style={{ color: '#e2e4ec' }}>{s.skillDmgBoost}</span></div>
                        {((s.cdrPct ?? 0) > 0 || (s.attackSpeedPct ?? 0) > 0) && (
                          <div style={{ marginTop: 3, paddingTop: 3, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                            {(s.cdrPct ?? 0) > 0 && (
                              <div style={{ color: 'var(--text-soft)' }}>
                                CDR: <span style={{ color: '#e2e4ec' }}>{s.cdrPct}%</span>
                                {' → CD '}<span style={{ color: '#f0965a' }}>{effectiveCooldown(s.skillCooldown ?? 12, s.cdrPct ?? 0).toFixed(2)}s</span>
                              </div>
                            )}
                            {(s.attackSpeedPct ?? 0) > 0 && (
                              <div style={{ color: 'var(--text-soft)' }}>
                                Atk Speed: <span style={{ color: '#e2e4ec' }}>{s.attackSpeedPct}%</span>
                                {' → cast '}<span style={{ color: '#00d4ff' }}>{effectiveCastTime(s.skillCastTime ?? 2, s.attackSpeedPct ?? 0).toFixed(2)}s</span>
                              </div>
                            )}
                            <div style={{ color: 'var(--text-soft)' }}>
                              Ciclo: <span style={{ color: '#d4af37', fontWeight: 700 }}>{Math.max(effectiveCastTime(s.skillCastTime ?? 2, s.attackSpeedPct ?? 0), effectiveCooldown(s.skillCooldown ?? 12, s.cdrPct ?? 0)).toFixed(2)}s</span>
                            </div>
                          </div>
                        )}
                      </>)}
                    </div>
                  )
                })}
              </div>
            )
          }} />
          <Legend onClick={(o: any) => { if (typeof o.dataKey === 'string') toggleHide(o.dataKey) }} formatter={legendFmt} wrapperStyle={{ cursor: 'pointer' }} />
          {elasticLabels.map((label, i) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={elasticColors[i % elasticColors.length]}
              strokeWidth={2}
              dot={false}
              hide={hidden.has(label)}
              label={showLabels ? { position: 'top', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmtPct(v) } : undefined}
              activeDot={{
                onClick: (e: any, payload: any) => setSelPoint({ title: 'Elasticidade', buildName: `Iteração ${payload.payload.iter} — ${label}`, text: fmtPct(payload.value), color: elasticColors[i % elasticColors.length] }),
                style: { cursor: 'pointer' }
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Formula Reference Modal ─────────────────────────────────────────── */}
      {showFormula && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 7, 16, 0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowFormula(false)} />
          <div className="tl-panel tl-modal-slide" style={{ position: 'relative', width: 680, maxWidth: '90%', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--border-gold)' }}>
            <button className="tl-btn-ghost" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem' }} onClick={() => setShowFormula(false)}>✕</button>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--gold)' }}>🛠 Fórmulas de Dano (Throne & Liberty)</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
              <p>As fórmulas abaixo foram mapeadas e validadas pela comunidade Theorycrafter e representam a ordem oficial de operações utilizada pelo motor (engine) do jogo:</p>
              
              <h3 style={{ marginTop: '1.2rem', color: '#e2e4ec', fontSize: '0.9rem' }}>1. Dano Base da Skill</h3>
              <div style={{ background: 'var(--bg)', padding: '0.6rem 0.8rem', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', margin: '0.4rem 0', color: '#a8b5d4' }}>
                Base = (Weapon Dmg * SkillBaseDamage%) + FlatSkillBonus
              </div>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                <li>A média Weapon (Min+Max/2) é usada em hits normais/Heavy.</li>
                <li>O valor <b>Max Weapon Dmg</b> é sempre forçado independente da rolagem caso o hit seja um <b>Crítico</b>.</li>
              </ul>

              <h3 style={{ marginTop: '1.2rem', color: '#e2e4ec', fontSize: '0.9rem' }}>2. Multiplicadores &amp; Diminishing Returns</h3>
              <p>Múltiplos status utilizam a curva de retornos decrescentes (Diminishing Return, ou DR) seguindo a base de milhar <code style={{ color: '#d4af37' }}>stat / (stat + 1000)</code>.</p>
              <ul style={{ paddingLeft: '1.2rem', margin: '0.4rem 0' }}>
                <li><b>Defesa Alvo:</b> Reduz <code style={{ color: '#d4af37' }}>Defesa / (Defesa + 2500)</code></li>
                <li><b>Skill Dmg Boost:</b> Multiplica <code style={{ color: '#d4af37' }}>1 + SDB / (SDB + 1000)</code></li>
                <li><b>Species Boost:</b> Diferente de bônus flat, ele atua como base exponencial: <code style={{ color: '#d4af37' }}>1 + Species / (Species + 1000)</code></li>
                <li><b>PVE/PvP/Buffs:</b> Escalam diretamente (ex: 40% Monster Damage resulta em <code style={{ color: '#d4af37' }}>1.4</code>).</li>
              </ul>

              <h3 style={{ marginTop: '1.2rem', color: '#e2e4ec', fontSize: '0.9rem' }}>3. Pipeline Final do Dano (Dano Efetivo)</h3>
              <div style={{ background: 'var(--bg)', padding: '0.6rem 0.8rem', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', margin: '0.4rem 0', color: '#a8b5d4' }}>
                Final = ((Base Dmg * [Multipliers]) * Heavy Mult) + Bonus Damage - Dmg Reduction
              </div>
              <p>O <b>Bonus Damage</b> não é engolido pelos multiplicadores; ele é adicionado puramente como um fator flat (aditivo) no extremo final do cálculo, após todos os multiplicadores e bônus de Heavy Attack. Diferente de grandes armas de pancada única, torna-se super otimizado para armas com altíssima cadência (hits/segundo).</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen overlay ──────────────────────────────────────────────── */}
      {maximized && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'var(--bg)', display: 'flex', flexDirection: 'column', padding: '1.25rem 2rem' }}
          onKeyDown={(e) => { if (e.key === 'Escape') setMaximized(null) }}
          tabIndex={-1}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
            <div className="tl-eyebrow" style={{ fontSize: '0.78rem' }}>
              {maximized === 'bar' ? '📊 Dano Simples (/s)' : maximized === 'gain' ? '📈 Ganho Dano Simples %' : '⚙ Elasticidade — Dano Simples'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="tl-btn-ghost" onClick={() => setMaximized(null)} style={{ padding: '0.3rem 0.9rem' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M5 2H2v3M9 2h3v3M2 9v3h3M12 9v3h-3"/>
                </svg>
                Restaurar Tamanho (Esc)
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {maximized === 'bar' ? renderBar('100%') : maximized === 'gain' ? renderGain('100%') : renderElastic('100%')}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>Calculadora PvE</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p>Compare 4 variações de build. Fórmulas Maxroll com Diminishing Returns.</p>
            <p style={{ marginTop: '0.4rem' }}>
              <span style={{ color: 'var(--gold)' }}>legenda</span> ou{' '}
              <span style={{ color: 'var(--gold)' }}>card</span> para ocultar série ·{' '}
              <span style={{ color: 'var(--gold)' }}>expand</span> maximiza
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button
              className="tl-btn-ghost"
              title="Forçar recálculo dos cards e gráficos"
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 5 }}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Atualizar
            </button>
            <button className="tl-btn-ghost" onClick={() => setShowFormula(true)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              Ver Metodologia da Engine
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-soft)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: 6, background: 'var(--bg-card)' }}>
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
              Exibir pontuação inline
            </label>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* Source selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="tl-eyebrow" style={{ alignSelf: 'center' }}>Fonte</div>
          {Array.from({ length: COLS }).map((_, i) => (
            <div key={i}>
              <div className="tl-eyebrow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: COLORS[i], marginBottom: 4 }}>
                <span style={{ textTransform: 'uppercase' }}>Build {i + 1}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {i > 0 && (
                    <button
                      className="tl-btn-ghost"
                      title="Replicar estatísticas da coluna esquerda"
                      onClick={() => copyPrevious(i)}
                      style={{ padding: '0.1rem 0.3rem', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff', borderColor: 'rgba(0,212,255,0.35)', background: 'rgba(0,212,255,0.07)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  )}
                  <button
                    className="tl-btn-ghost"
                    title="Salvar como nova Build (Manual)"
                    onClick={() => handleSaveStats(i)}
                    style={{ padding: '0.1rem 0.3rem', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3dd68c', borderColor: 'rgba(61,214,140,0.35)', background: 'rgba(61,214,140,0.07)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  </button>
                </div>
              </div>
              <select className="tl-input" style={{ fontFamily: 'Inter,sans-serif' }} value={sources[i]} onChange={(e) => applySource(i, e.target.value)}>
                {buildList.map((b) => {
                  if (!b.id) return <option key="manual" value="">Opcional: Selecionar...</option>
                  // @ts-ignore typescript não percebeu array desestruturado
                  const tag = b.rawStats ? '[Importada]' : '[Manual]'
                  const label = `${tag} ${b.name}`
                  return <option key={b.id} value={b.id}>{label.slice(0, 36)}</option>
                })}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className="tl-btn-ghost" onClick={applyAutoVariations}>⚡ Variações automáticas</button>
        </div>

        {/* Result cards (clickables to hide build in bar/gain charts) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {results.map((r, i) => {
            const bId    = `Build ${i+1}`
            const isBest = r.avgDamage === Math.max(...results.map((x) => x.avgDamage)) && r.avgDamage > 0
            const isHid  = hidden.has(bId)
            return (
              <div
                key={i}
                className="tl-stat-card"
                onClick={() => toggleHide(bId)}
                title={isHid ? 'Mostrar no gráfico' : 'Ocultar do gráfico'}
                style={{ borderColor: isBest ? COLORS[i] : undefined, opacity: isHid ? 0.32 : 1, cursor: 'pointer', transition: 'opacity 0.22s, border-color 0.22s', userSelect: 'none' }}
              >
                <div className="tl-eyebrow" style={{ color: COLORS[i], marginBottom: 6 }}>
                  {bId}{isBest ? <span className="tl-tag tl-tag-gold" style={{ marginLeft: 6 }}>BEST</span> : null}
                  {isHid  && <span className="tl-tag" style={{ marginLeft: 6, background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.6rem' }}>oculto</span>}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>dano por cast</div>
                <div className="tl-dmg">{r.avgDamage > 0 ? fmt(r.avgDamage) : '—'}</div>
                {r.totalDmg60s > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                      60s total: <span style={{ color: '#3dd68c', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmt(r.totalDmg60s)}</span>
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                      DPS/s: <span style={{ color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(r.trueDps)}</span>
                      {' · '}{r.casts60s.toFixed(2)}× · {r.cycleTime.toFixed(2)}s
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-soft)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>Ganho: <span className={r.gainPct > 0 ? 'tl-gain-pos' : r.gainPct < 0 ? 'tl-gain-neg' : 'tl-gain-neu'}>{i === 0 ? 'BASE' : r.gainPct > 0 ? `+${fmtPct(r.gainPct)}` : fmtPct(r.gainPct)}</span></span>
                  <span>Crit: <span className="font-mono">{fmtPct(r.critChancePct)}</span></span>
                  <span>Heavy: <span className="font-mono">{fmtPct(r.heavyChancePct)}</span></span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected point detail */}
        {selPoint && (
          <div className="tl-panel" style={{ marginBottom: '1.25rem', borderColor: selPoint.color, background: `${selPoint.color}09`, animation: 'tl-modal-slide 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="tl-eyebrow" style={{ marginBottom: 6, color: selPoint.color }}>Ponto selecionado · {selPoint.title}</div>
                <div style={{ fontFamily: 'Noto Serif, serif', color: selPoint.color, fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>{selPoint.buildName}</div>
                <div style={{ display: 'flex', gap: '1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                  <span style={{ color: '#e2e4ec', fontWeight: 700 }}>{selPoint.text}</span>
                </div>
              </div>
              <button className="tl-btn-ghost" onClick={() => setSelPoint(null)} style={{ padding: '0.25rem 0.6rem', flexShrink: 0 }}>✕</button>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="tl-card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="tl-tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
              {(['bar', 'gain', 'elastic'] as const).map((t) => (
                <button key={t} className={`tl-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                  {t === 'bar' ? '📊 Dano Simples (/s)' : t === 'gain' ? '📈 Ganho Dano Simples %' : '⚙ Elasticidade'}
                </button>
              ))}
            </div>
            <button
              className="tl-btn-ghost"
              title="Maximizar gráfico (Esc para fechar)"
              onClick={() => setMaximized(activeTab)}
              style={{ padding: '0.3rem 0.5rem', lineHeight: 0, display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 2H2v3M9 2h3v3M2 9v3h3M12 9v3h-3"/>
              </svg>
              <span style={{ marginLeft: 6, fontSize: '0.7rem' }}>Maximizar Gráfico</span>
            </button>
          </div>
          <div className="tl-divider" style={{ marginTop: 0 }} />

          {activeTab === 'bar' && renderBar(200)}
          {activeTab === 'gain' && renderGain(180)}

          {activeTab === 'elastic' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div className="tl-eyebrow" style={{ marginBottom: 4 }}>Iterações</div>
                  <input type="number" className="tl-input" style={{ width: 80 }} min={1} max={100} value={iterations} onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setIter(Math.max(1, Math.min(100, v))) }} />
                </div>
                <button className="tl-btn" style={{ marginTop: 20 }} onClick={runElasticity}>▶ Calcular</button>
              </div>
              {renderElastic(300)}

              {/* ── Controles de iteração ──────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', marginTop: '1rem' }}>

                {/* Bloco 1: Aditivas */}
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--border)' }}>
                  <div className="tl-eyebrow" style={{ marginBottom: '0.65rem', fontSize: '0.68rem' }}>Entradas Aditivas</div>
                  {ADDITIVE_OPTS.map((opt) => (
                    <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-soft)' }}>{opt.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+</span>
                      <input
                        type="number"
                        className="tl-input"
                        style={{ width: 84, textAlign: 'right' }}
                        min={1}
                        value={addSteps[opt.key]}
                        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) setAddSteps((p) => ({ ...p, [opt.key]: Math.max(1, Math.min(100, v)) })) }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>/iter</span>
                    </div>
                  ))}
                </div>

                {/* Bloco 2: Permuta */}
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div className="tl-eyebrow" style={{ fontSize: '0.68rem' }}>Permuta</div>
                    <button className="tl-btn-ghost" style={{ padding: '0.1rem 0.45rem', fontSize: '0.68rem' }} onClick={addSwap}>+ Adicionar</button>
                  </div>
                  {swaps.map((sw, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.45rem 0.55rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Troca {idx + 1}</span>
                        {swaps.length > 1 && (
                          <button className="tl-btn-ghost" style={{ padding: '0.05rem 0.3rem', fontSize: '0.65rem' }} onClick={() => removeSwap(idx)}>✕</button>
                        )}
                      </div>
                      {/* Stat reduzido */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#f25f5c', width: 14, textAlign: 'center', flexShrink: 0 }}>−</span>
                        <select
                          className="tl-input"
                          style={{ flex: 1, fontSize: '0.71rem', fontFamily: 'Inter,sans-serif' }}
                          value={sw.fromStat}
                          onChange={(e) => updateSwap(idx, 'fromStat', e.target.value as StatKey)}
                        >
                          {ELASTIC_STAT_OPTS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </select>
                        <input
                          type="number"
                          className="tl-input"
                          style={{ width: 120, textAlign: 'right', fontSize: '0.71rem', flexShrink: 0 }}
                          min={1}
                          value={sw.fromStep}
                          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateSwap(idx, 'fromStep', Math.max(1, v)) }}
                        />
                      </div>
                      {/* Stat aumentado */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#3dd68c', width: 14, textAlign: 'center', flexShrink: 0 }}>+</span>
                        <select
                          className="tl-input"
                          style={{ flex: 1, fontSize: '0.71rem', fontFamily: 'Inter,sans-serif' }}
                          value={sw.toStat}
                          onChange={(e) => updateSwap(idx, 'toStat', e.target.value as StatKey)}
                        >
                          {ELASTIC_STAT_OPTS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </select>
                        <input
                          type="number"
                          className="tl-input"
                          style={{ width: 120, textAlign: 'right', fontSize: '0.71rem', flexShrink: 0 }}
                          min={1}
                          value={sw.toStep}
                          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateSwap(idx, 'toStep', Math.max(1, v)) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
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
                        max={field.max}
                        onChange={(e) => {
                          const raw = parseFloat(e.target.value.replace(',', '.'))
                          if (!isNaN(raw)) updateField(i, field.key, field.max !== undefined ? Math.min(raw, field.max) : raw)
                        }}
                      />
                    ))}
                  </div>
                  {field.key === 'skillCastTime' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 8 }}>↳ Cast efetivo (s)</div>
                      {colStats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#00d4ff', padding: '3px 8px', background: 'rgba(0,212,255,0.05)', borderRadius: 4 }}>
                          {effectiveCastTime(s.skillCastTime, s.attackSpeedPct).toFixed(2)}s
                        </div>
                      ))}
                    </div>
                  )}
                  {field.key === 'skillCooldown' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 8 }}>↳ CD efetivo (s)</div>
                      {colStats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#f0965a', padding: '3px 8px', background: 'rgba(240,150,90,0.05)', borderRadius: 4 }}>
                          {effectiveCooldown(s.skillCooldown, s.cdrPct).toFixed(2)}s
                        </div>
                      ))}
                    </div>
                  )}
                  {field.key === 'bossCritChance' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 8 }}>↳ Crit %</div>
                      {colStats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#d4af37', padding: '3px 8px', background: 'rgba(212,175,55,0.05)', borderRadius: 4 }}>
                          {fmtPct(critChanceFromStat(s.critHitChance + (s.bossCritChance ?? 0), s.targetEndurance) * 100)}
                        </div>
                      ))}
                    </div>
                  )}
                  {field.key === 'bossHeavyChance' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(4, 1fr)', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: 8 }}>↳ Heavy %</div>
                      {colStats.map((s, i) => (
                        <div key={i} style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7c5cfc', padding: '3px 8px', background: 'rgba(124,92,252,0.05)', borderRadius: 4 }}>
                          {fmtPct(heavyChanceFromStat(s.heavyAttackChance + (s.bossHeavyChance ?? 0)) * 100)}
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
