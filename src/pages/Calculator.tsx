import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcResult, calcElasticity, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import { DEFAULT_STATS } from '../engine/types'
import type { BuildStats } from '../engine/types'

import { fmt, fmtPct } from '../engine/fmt'

const COLS    = 4
const COLORS  = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c']

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
  const [showLabels, setShowLabels] = useState(false)
  const [showFormula, setShowFormula] = useState(false)

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

  function runElasticity() {
    setElastic(calcElasticity(colStats[0], iterations))
    setActiveTab('elastic')
  }

  // Helpers para toggle e select
  function toggleHide(id: string) {
    setHidden(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Group fields
  const groups = ['skill', 'build', 'target'] as const
  const groupLabels = { skill: '🗡 Skill', build: '⚔ Build Stats', target: '🎯 Alvo' }

  // Chart data
  const barData  = results.map((r, i) => ({ id: `Build ${i+1}`, name: `Build ${i+1}`, dps: r.avgDamage }))
  const gainData = results.map((r, i) => ({ id: `Build ${i+1}`, name: `Build ${i+1}`, gain: r.gainPct }))

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
          <Tooltip formatter={(v: number) => [fmt(v), 'DPS']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} labelStyle={{ color: 'var(--gold-l)' }} />
          <Legend formatter={(value) => <span style={{ fontSize: '0.72rem' }}>Clique no Card (Build 1, 2...) para ocultar barras</span>} iconSize={0} />
          <Bar
            dataKey="dps"
            radius={[4, 4, 0, 0]}
            label={showLabels ? { position: 'top', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) } : undefined}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(d: any, i: number) => setSelPoint({ title: 'Dano Absoluto', buildName: d.name, text: fmt(d.dps), color: COLORS[i] })}
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
          <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => fmtPct(v, 1)} />
          <Tooltip formatter={(v: number) => [fmtPct(v), 'Ganho vs Build 1']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} labelStyle={{ color: 'var(--gold-l)' }} />
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
          <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} tickFormatter={(v) => fmtPct(v, 1)} />
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
                      <div style={{ color: '#3dd68c' }}>Ganho: {(p.value as number) >= 0 ? '+' : ''}{fmtPct(p.value as number)}</div>
                      {s && (<>
                        <div style={{ color: 'var(--text-soft)', marginTop: 2 }}>
                          Crit stat: <span style={{ color: '#e2e4ec' }}>{s.critHitChance}</span>
                          {' → '}<span style={{ color: '#d4af37' }}>{fmtPct(critChanceFromStat(s.critHitChance) * 100, 1)}</span>
                        </div>
                        <div style={{ color: 'var(--text-soft)' }}>
                          Heavy stat: <span style={{ color: '#e2e4ec' }}>{s.heavyAttackChance}</span>
                          {' → '}<span style={{ color: '#7c5cfc' }}>{fmtPct(heavyChanceFromStat(s.heavyAttackChance) * 100, 1)}</span>
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
              label={showLabels ? { position: 'top', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmtPct(v, 1) } : undefined}
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
              {maximized === 'bar' ? '📊 Dano Absoluto' : maximized === 'gain' ? '📈 Ganho %' : '⚙ Elasticidade'}
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
                      style={{ padding: '0.1rem 0.3rem', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  )}
                  <button 
                    className="tl-btn-ghost" 
                    title="Salvar como nova Build (Manual)" 
                    onClick={() => handleSaveStats(i)}
                    style={{ padding: '0.1rem 0.3rem', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                  {t === 'bar' ? '📊 Dano Absoluto' : t === 'gain' ? '📈 Ganho %' : '⚙ Elasticidade'}
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
                  <input type="number" className="tl-input" style={{ width: 80 }} min={1} max={100} value={iterations} onChange={(e) => setIter(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))} />
                </div>
                <button className="tl-btn" style={{ marginTop: 20 }} onClick={runElasticity}>▶ Calcular</button>
              </div>
              {renderElastic(300)}
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
