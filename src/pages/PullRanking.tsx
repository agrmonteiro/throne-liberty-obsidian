import React, { useMemo, useEffect, useRef } from 'react'
import { parseAndEnrichLog, type EnrichedPull } from '../engine/logParser'
import { useT } from '../i18n/useT'
import { useRankingStore } from '../store/useRankingStore'

const WEAPON_COLORS: Record<string, string> = {
  'Longbow': '#D4AF37', 'Arco Longo': '#D4AF37',
  'Wand & Tome': '#5C6BC0', 'Varinha e Tomo': '#5C6BC0',
  'Staff': '#7C5CFC', 'Cajado': '#7C5CFC',
  'Dagger': '#3DD68C', 'Adaga': '#3DD68C',
  'Spear': '#F25F5C', 'Lança': '#F25F5C',
  'Orb': '#FF00FF', 'Orbe': '#FF00FF',
  'Greatsword': '#B71C1C', 'Espadão': '#B71C1C',
  'Crossbow': '#00BCD4', 'Besta': '#00BCD4',
  'Sword & Shield': '#1976D2', 'Espada e Escudo': '#1976D2',
}

function fmtDamage(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  return Math.round(v).toLocaleString('pt-BR')
}

function fmtDps(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k'
  return Math.round(v).toString()
}

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function fmtDateTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function commentKey(pull: EnrichedPull): string {
  return `${pull.logFile}#${pull.id}#${pull.startTime}`
}

export function PullRanking(): React.ReactElement {
  const t = useT()
  const { logs, comments, filters, updateComment, setComments, setFilter, setLogs, setFilters } = useRankingStore()
  const { target: selTarget, weapon: selWeapon, duration: durationFilter, sortBy } = filters

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logsSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filtersSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carrega dados persistidos na abertura
  useEffect(() => {
    const api = (window.dataAPI as any)
    Promise.all([
      api?.read?.('pullComments.json').catch(() => null),
      api?.read?.('rankingLogs.json').catch(() => null),
      api?.read?.('rankingFilters.json').catch(() => null),
    ]).then(([savedComments, savedLogs, savedFilters]) => {
      if (savedComments) setComments(savedComments)
      if (Array.isArray(savedLogs) && savedLogs.length > 0) setLogs(savedLogs)
      if (savedFilters && typeof savedFilters === 'object') setFilters(savedFilters)
    })
  }, [])

  // Persiste logs quando mudam (debounce 800ms)
  useEffect(() => {
    if (logsSaveRef.current) clearTimeout(logsSaveRef.current)
    logsSaveRef.current = setTimeout(() => {
      ;(window.dataAPI as any)?.write?.('rankingLogs.json', logs).catch(() => {})
    }, 800)
  }, [logs])

  // Persiste filtros quando mudam (debounce 400ms)
  useEffect(() => {
    if (filtersSaveRef.current) clearTimeout(filtersSaveRef.current)
    filtersSaveRef.current = setTimeout(() => {
      ;(window.dataAPI as any)?.write?.('rankingFilters.json', filters).catch(() => {})
    }, 400)
  }, [filters])

  const allPulls = useMemo<EnrichedPull[]>(() => {
    return logs.flatMap(log => parseAndEnrichLog(log.content, log.name))
  }, [logs])

  const targets = useMemo(() => {
    const s = new Set(allPulls.map(p => p.mainTarget))
    return Array.from(s).sort()
  }, [allPulls])

  const weapons = useMemo(() => {
    const s = new Set(allPulls.flatMap(p => p.weapons))
    return Array.from(s).sort()
  }, [allPulls])

  const filtered = useMemo(() => {
    let list = allPulls
    if (selTarget !== 'all') list = list.filter(p => p.mainTarget === selTarget)
    if (selWeapon !== 'all') list = list.filter(p => p.weapons.includes(selWeapon))
    if (durationFilter !== 'all') list = list.filter(p => p.durationGroup === durationFilter)
    return [...list].sort((a, b) => b[sortBy] - a[sortBy])
  }, [allPulls, selTarget, selWeapon, durationFilter, sortBy])

  function handleCommentChange(pull: EnrichedPull, value: string) {
    const key = commentKey(pull)
    updateComment(key, value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      ;(window.dataAPI as any)?.write?.('pullComments.json', { ...comments, [key]: value }).catch(() => {})
    }, 600)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <div>
          <h1>🏆 {t('nav.pullranking')}</h1>
          <p>{t('nav.pullrankingSub')}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* Filtros */}
        {allPulls.length > 0 && (
          <div style={{
            display: 'flex', gap: '0.75rem', alignItems: 'center',
            flexWrap: 'wrap', marginBottom: '1.25rem',
          }}>
            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 4 }}>Alvo</div>
              <select
                className="tl-input"
                value={selTarget}
                onChange={e => setFilter('target', e.target.value)}
                style={{ fontFamily: 'Inter,sans-serif', minWidth: 140 }}
              >
                <option value="all">Todos</option>
                {targets.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 4 }}>Armas</div>
              <select
                className="tl-input"
                value={selWeapon}
                onChange={e => setFilter('weapon', e.target.value)}
                style={{ fontFamily: 'Inter,sans-serif', minWidth: 140 }}
              >
                <option value="all">Todas</option>
                {weapons.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 4 }}>Duração</div>
              <div style={{ display: 'flex', gap: 0 }}>
                {(['all', 'short', 'long'] as const).map((opt, i) => {
                  const labels = { all: 'Todos', short: '<120s', long: '≥120s' }
                  const isActive = durationFilter === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setFilter('duration', opt)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        borderLeft: i === 0 ? '1px solid var(--border)' : 'none',
                        borderRadius: i === 0 ? '5px 0 0 5px' : i === 2 ? '0 5px 5px 0' : '0',
                        background: isActive ? 'rgba(124,92,252,0.18)' : 'var(--bg-input)',
                        color: isActive ? '#c4b5fd' : 'var(--text-soft)',
                      }}
                    >
                      {labels[opt]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 4 }}>Ordenar</div>
              <div style={{ display: 'flex', gap: 0 }}>
                {(['damage', 'dps'] as const).map((opt, i) => {
                  const labels = { damage: 'DMG', dps: 'DPS' }
                  const isActive = sortBy === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setFilter('sortBy', opt)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        borderLeft: i === 0 ? '1px solid var(--border)' : 'none',
                        borderRadius: i === 0 ? '5px 0 0 5px' : '0 5px 5px 0',
                        background: isActive ? 'rgba(212,175,55,0.15)' : 'var(--bg-input)',
                        color: isActive ? '#f0cc55' : 'var(--text-soft)',
                      }}
                    >
                      {labels[opt]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Lista rankeada */}
        {logs.length === 0 ? (
          <div className="tl-panel" style={{
            textAlign: 'center', padding: '4rem 2rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{ fontSize: '2.5rem', opacity: 0.5 }}>📂</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-soft)', fontWeight: 600 }}>
              Nenhum log enviado para ranking ainda.
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
              Abra o Log Reader, carregue um arquivo e clique em &quot;Enviar para Ranking&quot;.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="tl-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-soft)' }}>
            Nenhum pull encontrado com os filtros selecionados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((pull, index) => {
              const rank = index + 1
              const isTop3 = rank <= 3
              const rankColor = rank === 1 ? '#D4AF37' : rank === 2 ? '#a8b5d4' : rank === 3 ? '#c08552' : 'var(--text-muted)'
              const key = commentKey(pull)

              return (
                <div
                  key={key}
                  className="tl-panel"
                  style={{
                    borderColor: isTop3 ? `${rankColor}44` : undefined,
                    background: isTop3 ? `${rankColor}05` : undefined,
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Badge ranking */}
                    <div style={{
                      minWidth: 36, height: 36,
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isTop3 ? `${rankColor}22` : 'var(--bg-input)',
                      border: `2px solid ${rankColor}`,
                      color: rankColor,
                      fontSize: isTop3 ? '0.88rem' : '0.72rem',
                      fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      flexShrink: 0,
                    }}>
                      #{rank}
                    </div>

                    {/* Conteúdo principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Linha 1: personagem, alvo, stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.92rem', fontWeight: 700,
                          color: 'var(--text)', fontFamily: 'Noto Serif, serif',
                        }}>
                          {pull.character}
                        </span>

                        <span style={{ color: 'var(--text-soft)', fontSize: '0.8rem' }}>
                          vs <strong style={{ color: 'var(--text)' }}>{pull.mainTarget}</strong>
                        </span>

                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {fmtDuration(pull.durationMs)}
                        </span>

                        <span className="tl-tag-gold" style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.8rem', fontWeight: 700,
                        }}>
                          {fmtDamage(pull.damage)}
                        </span>

                        <span style={{
                          fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace',
                          color: '#3dd68c', fontWeight: 600,
                        }}>
                          {fmtDps(pull.dps)} DPS
                        </span>
                      </div>

                      {/* Linha 2: armas + data/hora + arquivo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {pull.weapons.map(w => (
                          <span
                            key={w}
                            style={{
                              padding: '0.15rem 0.55rem',
                              borderRadius: 20,
                              fontSize: '0.7rem', fontWeight: 600,
                              border: `1px solid ${WEAPON_COLORS[w] ?? '#7a8099'}55`,
                              background: `${WEAPON_COLORS[w] ?? '#7a8099'}18`,
                              color: WEAPON_COLORS[w] ?? 'var(--text-soft)',
                            }}
                          >
                            {w}
                          </span>
                        ))}

                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {fmtDateTime(pull.startTime)}
                        </span>

                        <span style={{
                          fontSize: '0.68rem', color: 'var(--text-muted)',
                          fontStyle: 'italic', maxWidth: 160,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                          title={pull.logFile}
                        >
                          {pull.logFile}
                        </span>
                      </div>

                      {/* Textarea de comentário */}
                      <textarea
                        value={comments[key] ?? ''}
                        onChange={e => handleCommentChange(pull, e.target.value)}
                        placeholder='Digite sua build ou referência (ex: Longbow/Dagger — set de open world)'
                        rows={2}
                        style={{
                          width: '100%',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          color: 'var(--text)',
                          fontSize: '0.78rem',
                          padding: '0.45rem 0.65rem',
                          resize: 'vertical',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1.5,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
