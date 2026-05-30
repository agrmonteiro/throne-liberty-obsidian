import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useBuilds } from '../store/useBuilds'
import { calcAverageDPS, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import { useT } from '../i18n/useT'
import { TOOLTIP_CONTENT, TOOLTIP_LABEL, TOOLTIP_ITEM } from '../styles/chartStyles'
import { fmt, fmtP } from '../engine/fmt'

const COLORS = ['#d4af37', '#7c5cfc', '#00d4ff', '#3dd68c', '#f25f5c', '#f0965a']

type Page = 'dashboard' | 'calculator' | 'comparator' | 'sensitivity' | 'builds' | 'logreader' | 'rotation' | 'settings' | 'pullranking' | 'skillsdb' | 'masterytrees'

interface Props {
  onNavigate?: (page: Page) => void
}

// Passos do guia de primeiros passos — cada um leva a uma ferramenta
const STEPS: Array<{ key: 'build' | 'calc' | 'improve' | 'validate'; icon: string; page: Page; color: string }> = [
  { key: 'build',    icon: '📁', page: 'builds',      color: '#7c5cfc' },
  { key: 'calc',     icon: '⚔',  page: 'calculator',  color: '#f0cc55' },
  { key: 'improve',  icon: '📡', page: 'sensitivity', color: '#00d4ff' },
  { key: 'validate', icon: '📄', page: 'logreader',   color: '#3dd68c' },
]

// Guia das ferramentas — "o que faz" e "quando usar"
const TOOLS: Array<{ key: 'builds' | 'calculator' | 'comparator' | 'sensitivity' | 'logreader' | 'pullranking'; icon: string; page: Page }> = [
  { key: 'builds',      icon: '📁', page: 'builds'      },
  { key: 'calculator',  icon: '⚔',  page: 'calculator'  },
  { key: 'comparator',  icon: '🕷',  page: 'comparator'  },
  { key: 'sensitivity', icon: '📡', page: 'sensitivity' },
  { key: 'logreader',   icon: '📄', page: 'logreader'   },
  { key: 'pullranking', icon: '🏆', page: 'pullranking' },
]

export function Dashboard({ onNavigate }: Props): React.ReactElement {
  const { builds, activeBuildId, setActive } = useBuilds()
  const t = useT()

  const buildList = useMemo(() => Object.values(builds), [builds])
  const isEmpty = buildList.length === 0

  // Guia visível por padrão só quando não há builds; senão fica recolhido
  const [showGuide, setShowGuide] = useState(isEmpty)

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

  const go = (page: Page) => onNavigate?.(page)

  // ─── Bloco "Comece aqui" ────────────────────────────────────────────────────
  const gettingStarted = (
    <div className="tl-panel" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontSize: '1.05rem', fontWeight: 700 }}>
            {t('dashboard.gettingStarted.title')}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginTop: 3 }}>
            {t('dashboard.gettingStarted.subtitle')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => go(step.page)}
            className="tl-panel"
            style={{
              textAlign: 'left', cursor: 'pointer', background: 'var(--bg-elev, rgba(124,92,252,0.05))',
              border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = step.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: step.color, color: '#0b0d14', fontWeight: 800, fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{i + 1}</span>
              <span style={{ fontSize: '1.1rem' }}>{step.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                {t(`dashboard.gettingStarted.steps.${step.key}.title`)}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)', lineHeight: 1.45 }}>
              {t(`dashboard.gettingStarted.steps.${step.key}.desc`)}
            </div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: step.color, marginTop: 'auto' }}>
              {t('dashboard.gettingStarted.cta')} →
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Guia de ferramentas ────────────────────────────────────────────────────
  const toolsGuide = (
    <>
      <hr className="tl-divider" style={{ marginTop: '1.5rem' }} />
      <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{t('dashboard.toolsGuide.title')}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginBottom: '0.9rem' }}>
        {t('dashboard.toolsGuide.subtitle')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            onClick={() => go(tool.page)}
            className="tl-panel"
            style={{
              textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.45rem',
              border: '1px solid var(--border)', transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{tool.icon}</span>
              <span style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontSize: '0.92rem', fontWeight: 700 }}>
                {t(`dashboard.toolsGuide.items.${tool.key}.name`)}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-soft)', lineHeight: 1.45 }}>
              {t(`dashboard.toolsGuide.items.${tool.key}.what`)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-soft)' }}>{t('dashboard.toolsGuide.whenLabel')}:</span>{' '}
              {t(`dashboard.toolsGuide.items.${tool.key}.when`)}
            </div>
          </button>
        ))}
      </div>
    </>
  )

  return (
    <div style={{ padding: '0 1.75rem 2rem', overflowY: 'auto', height: '100%' }}>
      {/* Hero */}
      <div className="tl-hero">
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* Sem builds: guia em destaque, sem gráficos vazios */}
      {isEmpty ? (
        <>
          {gettingStarted}
          {toolsGuide}
        </>
      ) : (
        <>
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
              <ResponsiveContainer width="100%" height={Math.max(160, dpsData.length * 44)}>
                <BarChart data={dpsData} layout="vertical" margin={{ left: 8, right: 40 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#7a8099' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#e2e4ec' }} width={130} />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), 'DPS Real (/s)']}
                    contentStyle={TOOLTIP_CONTENT}
                    labelStyle={TOOLTIP_LABEL}
                    itemStyle={TOOLTIP_ITEM}
                  />
                  <Bar dataKey="dps" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#a8b5d4', formatter: (v: number) => fmt(v) }}>
                    {dpsData.map((entry, i) => (
                      <Cell key={entry.id} fill={i === 0 ? '#d4af37' : COLORS[(i) % COLORS.length]} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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

          {/* Guia de primeiros passos (recolhível quando já há builds) */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setShowGuide((v) => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'var(--text-soft)', fontSize: '0.82rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>{showGuide ? '▼' : '▶'}</span>
              {showGuide ? t('dashboard.gettingStarted.toggleHide') : t('dashboard.gettingStarted.toggleShow')}
            </button>
            {showGuide && <div style={{ marginTop: '0.75rem' }}>{gettingStarted}</div>}
          </div>

          {toolsGuide}
        </>
      )}
    </div>
  )
}
