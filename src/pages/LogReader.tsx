import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line,
  PieChart, Pie, Cell
} from 'recharts'
import { getWeaponBySkill, getSkillInfo } from '../engine/skillsDB'
import { fmt, fmtPct } from '../engine/fmt'
import { useLogTimeline } from '../store/useLogTimeline'
import type { LogTimelineData } from '../store/useLogTimeline'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CombatEvent {
  tsMs: number
  eventType: string
  skill: string
  skillId: string
  damage: number
  isCrit: boolean
  isHeavy: boolean
  hitType: string
  source: string
  target: string
}

interface LogFile {
  name: string
  path: string
  sizeBytes: number
  mtime: number
}

interface Pull {
  id: number
  startTime: number
  endTime: number
  events: CombatEvent[]
  damage: number
}

interface TargetSummary {
  name: string
  totalDamage: number
}

// ─── Constants & Utils ────────────────────────────────────────────────────────

const PULL_GAP_MS = 15000 // 15 seconds gap defineds a new pull

function parseTLLogTime(str: string): number {
  if (str.length < 21) return 0
  const y  = parseInt(str.slice(0, 4), 10)
  const M  = parseInt(str.slice(4, 6), 10) - 1
  const d  = parseInt(str.slice(6, 8), 10)
  const h  = parseInt(str.slice(9, 11), 10)
  const m  = parseInt(str.slice(12, 14), 10)
  const s  = parseInt(str.slice(15, 17), 10)
  const ms = parseInt(str.slice(18, 21), 10)
  return new Date(y, M, d, h, m, s, ms).getTime()
}

function fmtCompact(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M'
  return Math.round(v).toLocaleString('pt-BR')
}

function fmtFull(v: number) {
  return Math.round(v).toLocaleString('pt-BR')
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fmtDateShort(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

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
  'Buffs, Itens & Maestrias': '#8884d8',
  'Item/Proc': '#8884d8',
  'Desconhecido': '#666666'
}

function getSeriesColor(name: string): string {
  if (WEAPON_COLORS[name]) return WEAPON_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${Math.abs(hash) % 360}, 60%, 65%)`
}

// ─── Log Timeline View ────────────────────────────────────────────────────────

function LogTimelineView({ events, skills, pullDurationSec, maxHeight = 420 }: {
  events: Array<{ castAtSec: number; skillName: string }>
  skills: string[]
  pullDurationSec: number
  maxHeight?: number | string
}): React.ReactElement {
  const displaySkills = skills.slice(0, 15)
  const steps = Array.from(
    { length: Math.min(120, Math.ceil(pullDurationSec / 0.5) + 1) },
    (_, i) => parseFloat((i * 0.5).toFixed(1))
  )
  const eventMap = new Set(events.map(e => `${e.skillName}|${e.castAtSec}`))

  const thStyle: React.CSSProperties = {
    fontSize: '0.63rem',
    color: '#7a8099',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    padding: '5px 7px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(0,0,0,0.75)',
  }

  const tdStyle: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: '0.8rem',
    color: 'var(--text)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  }

  return (
    <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <th style={{ ...thStyle, width: 48, minWidth: 48 }}>Tempo</th>
            {displaySkills.map(sk => (
              <th key={sk} title={sk}
                style={{ ...thStyle, width: 42, minWidth: 42, color: getSeriesColor(sk) }}>
                {sk.length > 8 ? sk.slice(0, 8) : sk}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {steps.map(t => (
            <tr key={t}>
              <td style={{ ...tdStyle, fontSize: '0.65rem', color: '#474f6b', whiteSpace: 'nowrap', padding: '0 6px', background: 'rgba(0,0,0,0.08)' }}>
                {t.toFixed(1)}s
              </td>
              {displaySkills.map(sk => {
                const active = eventMap.has(`${sk}|${t}`)
                return (
                  <td key={sk} style={{ padding: 1 }}>
                    <div style={{
                      width: 36, height: 18, borderRadius: 2,
                      background: active ? getSeriesColor(sk) : 'rgba(0,0,0,0.15)',
                      border: active
                        ? '1px solid rgba(255,255,255,0.15)'
                        : '1px solid rgba(255,255,255,0.04)',
                      opacity: active ? 0.88 : 1,
                    }} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RAPID_GAP_MS  = 800   // threshold para skills de hit rápido / DoT
const SKILL_GAP_MS  = 3000  // threshold para skills com gap >3s entre usos

function avgCastInterval(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null
  const sorted = [...timestamps].sort((a, b) => a - b)

  // Se o maior gap entre hits consecutivos excede 3s, a skill some do log entre
  // usos (cast discreto). Usamos 3s como separador de casts para não confundir
  // múltiplos projéteis do mesmo cast (ex: Chuva de Fogo dispara vários em ~0.2s).
  // Caso contrário (hits sempre <3s apart) a skill é contínua: usa 800ms.
  let maxGap = 0
  for (let i = 1; i < sorted.length; i++) maxGap = Math.max(maxGap, sorted[i] - sorted[i - 1])
  const threshold = maxGap > SKILL_GAP_MS ? SKILL_GAP_MS : RAPID_GAP_MS

  const castStarts: number[] = []
  let lastCast = -Infinity
  for (const ts of sorted) {
    if (ts - lastCast > threshold) { castStarts.push(ts); lastCast = ts }
  }
  if (castStarts.length < 2) return null
  return (castStarts[castStarts.length - 1] - castStarts[0]) / (castStarts.length - 1) / 1000
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LogReaderProps {
  onToggleSplit?: () => void
  isSplitView?: boolean
}

export function LogReader({ onToggleSplit, isSplitView }: LogReaderProps = {}): React.ReactElement {
  const [logText, setLogText] = useState<string>('')
  const [logName, setLogName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Navigation / Filter state
  const [folder, setFolder] = useState<string | null>(null)
  const [fileList, setFileList] = useState<LogFile[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [selTarget, setSelTarget] = useState<string>('All targets')
  const [selPullId, setSelPullId] = useState<number | 'all'>('all')
  const [selSkill, setSelSkill]   = useState<string | null>(null)
  const [sortCol, setSortCol]     = useState<string>('damage')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [disabledSkills, setDisabledSkills] = useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = useState<'weapon' | 'skill'>('weapon')
  const [isStacked, setIsStacked] = useState<boolean>(true) // Ativo por padrão
  const [chartInterval, setChartInterval]   = useState<number>(1.0) // Seconds grouping

  // Split tool
  const [userSplits, setUserSplits] = useState<number[]>([])
  const [splitMode, setSplitMode]   = useState(false)
  const [splitOffsetSec, setSplitOffsetSec] = useState(0)

  // Log Timeline
  const { save: saveLogTimeline } = useLogTimeline()
  const [showLogTimeline, setShowLogTimeline] = useState(false)
  const [timelineMaximized, setTimelineMaximized] = useState(false)

  // Initialization
  useEffect(() => {
    window.dataAPI?.combatlogGetFolder?.().then((saved) => { if (saved) setFolder(saved) })
  }, [])

  const refreshFiles = useCallback(async () => {
    if (!folder) return
    const files = await window.dataAPI.combatlogListFiles(folder)
    setFileList(files ?? [])
  }, [folder])

  useEffect(() => { refreshFiles() }, [refreshFiles])

  // Scroll to top when pull changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selPullId])

  // Auto-save splits per file whenever they change
  useEffect(() => {
    if (!logName) return
    window.dataAPI.read('combatlog_splits.json')
      .then(data => {
        const all = (data as Record<string, number[]>) ?? {}
        all[logName] = userSplits
        return window.dataAPI.write('combatlog_splits.json', all)
      })
      .catch(() => {})
  }, [userSplits, logName])

  // Data Loading
  async function handlePickFolder() {
    try {
      setLoading(true)
      const res = await window.dataAPI.combatlogPickFolder()
      
      if (res && typeof res === 'object' && 'error' in res) {
        throw new Error(res.error)
      }

      if (typeof res === 'string') {
        setFolder(res)
      }
    } catch (err: any) {
      console.error('Falha ao selecionar diretório:', err)
      const msg = err?.message || String(err)
      alert(`Erro técnico: ${msg}\n\nIsso pode ocorrer por falta de permissão ou se o sistema do seletor do Windows estiver ocupado.`)
      
      // Fallback: Ask user if they want to type/paste it manually
      const manual = prompt('O seletor falhou. Deseja colar o caminho da pasta manualmente? (Ex: C:\\Users\\...\\Saved\\CombatLogs)')
      if (manual) setFolder(manual.trim())
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteFile(file: LogFile, e: React.MouseEvent) {
    e.stopPropagation()
    const confirmed = window.confirm(
      `Deletar permanentemente o arquivo:\n\n"${file.name}"\n\nEsta ação não pode ser desfeita.`
    )
    if (!confirmed) return
    const res = await window.dataAPI.combatlogDeleteFile(file.path)
    if (!res.ok) {
      alert(`Erro ao deletar: ${res.error}`)
      return
    }
    if (logName === file.name) {
      setLogText('')
      setLogName('')
      setSelTarget('All targets')
      setSelPullId('all')
      setSelSkill(null)
      setUserSplits([])
    }
    refreshFiles()
  }

  async function handleLoadFile(file: LogFile) {
    setLoading(true)
    setLogName(file.name)
    const text = await window.dataAPI.combatlogReadFile(file.path)
    setLogText(text ?? '')
    setSelTarget('All targets')
    setSelPullId('all')
    setSelSkill(null)
    setSplitMode(false)
    // Restore saved splits for this file
    try {
      const data = await window.dataAPI.read('combatlog_splits.json')
      const all = (data as Record<string, number[]>) ?? {}
      setUserSplits(all[file.name] ?? [])
    } catch {
      setUserSplits([])
    }
    setLoading(false)
  }

  // ─── Computational Logic ───────────────────────────────────────────────────

  // Parse Raw
  const rawEvents = useMemo(() => {
    if (!logText) return []
    const lines = logText.split('\n')
    const parsed: CombatEvent[] = []
    for (const line of lines) {
      if (!line || !line.includes(',')) continue
      const p = line.split(',')
      if (p[1] === 'DamageDone' && p.length >= 10) {
        parsed.push({
          tsMs: parseTLLogTime(p[0]),
          eventType: p[1],
          skill: p[2],
          skillId: p[3],
          damage: parseFloat(p[4]) || 0,
          isCrit: p[5] === '1',
          isHeavy: p[6] === '1',
          hitType: p[7],
          source: p[8],
          target: p[9].trim()
        })
      }
    }
    return parsed.sort((a, b) => a.tsMs - b.tsMs)
  }, [logText])

  // Get Character Info and Identified Weapons
  const combatIdentity = useMemo(() => {
    // Weapon detection based on Top 5 ACTIVE skills by total damage
    if (rawEvents.length === 0) return { name: 'Unknown character', weapons: ['Análise de Classe...'] }

    const skillAgg: Record<string, number> = {}
    rawEvents.forEach(e => {
      skillAgg[e.skill] = (skillAgg[e.skill] || 0) + e.damage
    })

    const topActiveWeapons = Object.entries(skillAgg)
      .map(([name, damage]) => ({ name, damage, info: getSkillInfo(name) }))
      .filter(item => item.info && item.info.category === 'active' && item.info.weapon !== 'Basic')
      .sort((a, b) => b.damage - a.damage)
      .slice(0, 5)
      .map(item => item.info!.weapon)

    // Get unique weapons from top 5 (usually 2)
    const detected = Array.from(new Set(topActiveWeapons))

    return { 
      name: rawEvents[0].source, 
      weapons: detected.length > 0 ? detected : ['Análise de Classe...']
    }
  }, [rawEvents])

  // Unique Targets List (Chronological)
  const targets = useMemo(() => {
    const firstSeen: Record<string, number> = {}
    rawEvents.forEach(e => {
      if (firstSeen[e.target] === undefined || e.tsMs < firstSeen[e.target]) {
        firstSeen[e.target] = e.tsMs
      }
    })
    return Object.keys(firstSeen).sort((a, b) => firstSeen[a] - firstSeen[b])
  }, [rawEvents])

  // Filtered by target
  const filteredByTarget = useMemo(() => {
    if (selTarget === 'All targets') return rawEvents
    return rawEvents.filter(e => e.target === selTarget)
  }, [rawEvents, selTarget])

  // Divide into Pulls
  const pulls = useMemo(() => {
    if (filteredByTarget.length === 0) return []
    const results: Pull[] = []
    let currentPull: CombatEvent[] = [filteredByTarget[0]]
    let pullIdx = 1

    for (let i = 1; i < filteredByTarget.length; i++) {
      const prev = filteredByTarget[i-1]
      const curr = filteredByTarget[i]
      const isGap       = curr.tsMs - prev.tsMs > PULL_GAP_MS
      const isUserSplit = userSplits.some(ts => prev.tsMs < ts && ts <= curr.tsMs)
      if (isGap || isUserSplit) {
        // Close current pull
        results.push({
          id: pullIdx++,
          startTime: currentPull[0].tsMs,
          endTime: currentPull[currentPull.length-1].tsMs,
          events: currentPull,
          damage: currentPull.reduce((acc, e) => acc + e.damage, 0)
        })
        currentPull = [curr]
      } else {
        currentPull.push(curr)
      }
    }
    // Last one
    if (currentPull.length > 0) {
      results.push({
        id: pullIdx,
        startTime: currentPull[0].tsMs,
        endTime: currentPull[currentPull.length-1].tsMs,
        events: currentPull,
        damage: currentPull.reduce((acc, e) => acc + e.damage, 0)
      })
    }
    return results
  }, [filteredByTarget, userSplits])

  // Enrich pulls with DPS and weapon detection
  const enrichedPulls = useMemo(() => pulls.map(p => {
    const durationSec = (p.endTime - p.startTime) / 1000
    const dps = durationSec > 0 ? p.damage / durationSec : 0
    const skillAgg: Record<string, number> = {}
    p.events.forEach(e => { skillAgg[e.skill] = (skillAgg[e.skill] || 0) + e.damage })
    const weapons = Array.from(new Set(
      Object.entries(skillAgg)
        .map(([name, dmg]) => ({ name, dmg, info: getSkillInfo(name) }))
        .filter(item => item.info?.category === 'active' && item.info?.weapon !== 'Basic')
        .sort((a, b) => b.dmg - a.dmg)
        .slice(0, 5)
        .map(item => item.info!.weapon)
    ))
    return { ...p, dps, weapons }
  }), [pulls])

  // Targets visible in the currently selected pull
  const availableTargets = useMemo(() => {
    if (selPullId === 'all') return targets
    const pull = pulls.find(p => p.id === selPullId)
    if (!pull) return targets
    const inPull = new Set(pull.events.map(e => e.target))
    return targets.filter(t => inPull.has(t))
  }, [targets, selPullId, pulls])

  // Reset selTarget if the current target is not in the selected pull
  useEffect(() => {
    if (selPullId === 'all' || selTarget === 'All targets') return
    const pull = pulls.find(p => p.id === selPullId)
    if (!pull) return
    const inPull = new Set(pull.events.map(e => e.target))
    if (!inPull.has(selTarget)) setSelTarget('All targets')
  }, [selPullId, pulls, selTarget])

  // Currently Selected Pull Events
  const activeEvents = useMemo(() => {
    if (selPullId === 'all') return filteredByTarget
    const p = pulls.find(p => p.id === selPullId)
    return p ? p.events : []
  }, [selPullId, filteredByTarget, pulls])

  // Dashboard Aggregates
  const stats = useMemo(() => {
    if (activeEvents.length === 0) return null
    const first = activeEvents[0].tsMs
    const last  = activeEvents[activeEvents.length - 1].tsMs
    const durationMs = Math.max(1000, last - first)
    const totalDmg   = activeEvents.reduce((acc, e) => acc + e.damage, 0)
    const dps        = totalDmg / (durationMs / 1000)

    // Skills breakdown
    const skillsMap: Record<string, { name: string, damage: number, hits: number, crits: number, heavies: number, critHeavies: number, min: number, max: number, timestamps: number[] }> = {}
    activeEvents.forEach(e => {
      if (!skillsMap[e.skill]) {
        skillsMap[e.skill] = { name: e.skill, damage: 0, hits: 0, crits: 0, heavies: 0, critHeavies: 0, min: Infinity, max: -Infinity, timestamps: [] }
      }
      const s = skillsMap[e.skill]
      s.damage += e.damage
      s.hits++
      if (e.isCrit) s.crits++
      if (e.isHeavy) s.heavies++
      if (e.isCrit && e.isHeavy) s.critHeavies++
      if (e.damage < s.min) s.min = e.damage
      if (e.damage > s.max) s.max = e.damage
      s.timestamps.push(e.tsMs)
    })

    const skillsList = Object.values(skillsMap).sort((a,b) => b.damage - a.damage)

    const interval = chartInterval // e.g. 500ms
    const chartMap: Record<number, Record<string, number>> = {}
    
    // Determine the series names based on grouping
    const seriesNames = groupBy === 'weapon' 
      ? [
          'Arco Longo', 'Longbow', 
          'Varinha e Tomo', 'Wand & Tome', 
          'Cajado', 'Staff', 
          'Adaga', 'Dagger',
          'Lança', 'Spear',
          'Orbe', 'Orb',
          'Espadão', 'Greatsword',
          'Besta', 'Crossbow',
          'Espada e Escudo', 'Sword & Shield',
          'Buffs, Itens & Maestrias',
          'Desconhecido'
        ]
      : Array.from(new Set(activeEvents.map(e => e.skill)))

    activeEvents.forEach(e => {
      const bucket = Math.floor((e.tsMs - first) / (interval * 1000)) * interval
      if (!chartMap[bucket]) {
        chartMap[bucket] = { sec: bucket } as any
        seriesNames.forEach(name => (chartMap[bucket] as any)[name] = 0)
      }
      
      let key = e.skill
      if (groupBy === 'weapon') {
        const info = getSkillInfo(e.skill)
        if (info) {
          if (info.category !== 'active' || info.weapon === 'Item/Proc') {
            key = 'Buffs, Itens & Maestrias'
          } else {
            key = info.weapon
          }
        } else {
          key = 'Desconhecido'
        }
      }
      
      const point = chartMap[bucket] as any
      if (point[key] !== undefined) {
        point[key] += e.damage
      } else if (groupBy === 'skill') {
        point[key] = (point[key] || 0) + e.damage
      }
    })

    const chartData = Object.values(chartMap).sort((a, b) => (a as any).sec - (b as any).sec)
    
    chartData.forEach((d: any) => {
      const windowStart = d.sec - 1.5
      const windowEnd = d.sec + 1.5
      let totalDmgInWindow = 0
      activeEvents.forEach(e => {
        const eSec = (e.tsMs - first) / 1000
        if (eSec >= windowStart && eSec <= windowEnd) totalDmgInWindow += e.damage
      })
      d.movingAvg = totalDmgInWindow / 3
    })
    
    const activeSeriesNames = seriesNames.filter(name => {
      return chartData.some(d => d[name] > 0)
    })

    const allSkills = Array.from(new Set(activeEvents.map(e => e.skill))).sort()

    // ─── Weapon Distribution ──────────────────────────────────────────
    const weaponMap: Record<string, number> = {}
    const unmapped: Array<{ name: string, damage: number }> = []

    skillsList.forEach(s => {
      const info = getSkillInfo(s.name)
      let label = 'Desconhecido'
      
      if (info) {
        if (info.category !== 'active' || info.weapon === 'Item/Proc') {
          label = 'Buffs, Itens & Maestrias'
        } else {
          label = info.weapon
        }
      } else {
        // Track unmapped for review
        label = 'Não Mapeado (Revisar)'
        unmapped.push({ name: s.name, damage: s.damage })
      }
      
      weaponMap[label] = (weaponMap[label] || 0) + s.damage
    })
    const weaponDist = Object.entries(weaponMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return { first, durationMs, totalDmg, dps, skillsList, chartData, allSkills, weaponDist, unmapped, activeSeriesNames }
  }, [activeEvents, chartInterval, groupBy])

  // Selected Skill Detail
  const skillDetail = useMemo(() => {
    if (!selSkill || !stats) return null
    const base = stats.skillsList.find(s => s.name === selSkill)
    if (!base) return null

    // Fine detail filtering
    const sEvents = activeEvents.filter(e => e.skill === selSkill)
    const normals = sEvents.filter(e => !e.isCrit && !e.isHeavy)
    const crits   = sEvents.filter(e => e.isCrit)
    const heavies = sEvents.filter(e => e.isHeavy)

    const calc = (evs: CombatEvent[]) => {
      if (evs.length === 0) return { min: 0, max: 0, avg: 0, dps: 0 }
      const total = evs.reduce((acc, e) => acc + e.damage, 0)
      return {
        min: Math.min(...evs.map(e => e.damage)),
        max: Math.max(...evs.map(e => e.damage)),
        avg: total / evs.length,
        dps: total / (stats.durationMs / 1000)
      }
    }

    return {
      name: selSkill,
      basic: calc(normals),
      crit:  calc(crits),
      heavy: calc(heavies),
      ratio: (base.damage / stats.totalDmg) * 100,
      critRate:      (base.crits       / base.hits) * 100,
      heavyRate:     (base.heavies     / base.hits) * 100,
      critHeavyRate: (base.critHeavies / base.hits) * 100,
    }
  }, [selSkill, stats, activeEvents])

  // ─── Rendering Helpers ─────────────────────────────────────────────────────

  const renderStatBox = (title: string, data: { min: number, max: number, avg: number, dps: number }, ratio: string, color: string) => (
    <div style={{ flex: 1, background: `linear-gradient(135deg, ${color}18 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid ${color}50`, borderRadius: 4, padding: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Ratio {ratio}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Min</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#e2e4ec' }}>{fmtFull(data.min)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Ratio</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#e2e4ec' }}>—</div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Max</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#e2e4ec' }}>{fmtFull(data.max)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>DPS</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: '#e2e4ec' }}>{fmtCompact(data.dps)}</div>
        </div>
        <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Average</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'JetBrains Mono', color: '#f0cc55' }}>{fmtFull(data.avg)}</div>
        </div>
      </div>
    </div>
  )

  const chartColors = [
    '#7c5cfc', '#3dd68c', '#f0cc55', '#f25f5c', '#00d4ff', 
    '#e2e4ec', '#d4af37', '#b9a8ff', '#ff8c00', '#00ff7f'
  ]

  const getSkillColor = (skill: string) => {
    if (!stats) return '#7c5cfc'
    const idx = stats.allSkills.indexOf(skill)
    return chartColors[idx % chartColors.length]
  }

  const toggleAllSkills = (enable: boolean) => {
    if (!stats) return
    if (enable) setDisabledSkills(new Set())
    else setDisabledSkills(new Set(stats.allSkills))
  }

  const toggleSkill = (skill: string) => {
    setDisabledSkills(prev => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  // ─── Log Timeline Export ───────────────────────────────────────────────────

  async function handleExportTimeline(): Promise<void> {
    if (!activeEvents.length) return
    const first = activeEvents[0].tsMs
    const last  = activeEvents[activeEvents.length - 1].tsMs
    const pullDurationSec = (last - first) / 1000

    const dmgBySkill: Record<string, number> = {}
    activeEvents.forEach(e => { dmgBySkill[e.skill] = (dmgBySkill[e.skill] ?? 0) + e.damage })
    const skills = Object.keys(dmgBySkill).sort((a, b) => dmgBySkill[b] - dmgBySkill[a])

    const castSet = new Set<string>()
    const casts: Array<{ castAtSec: number; skillName: string }> = []

    activeEvents.forEach(e => {
      const relSec = (e.tsMs - first) / 1000
      const bucket = parseFloat((Math.round(relSec / 0.5) * 0.5).toFixed(1))
      const key = `${e.skill}|${bucket}`
      if (!castSet.has(key)) {
        castSet.add(key)
        casts.push({ castAtSec: bucket, skillName: e.skill })
      }
    })

    const data: LogTimelineData = {
      savedAt: new Date().toISOString(),
      source: activeEvents[0]?.source ?? 'Desconhecido',
      pullDurationSec,
      skills,
      casts: casts.sort((a, b) => a.castAtSec - b.castAtSec),
    }

    await saveLogTimeline(data)
    alert(`Timeline exportada com sucesso!\n${skills.length} skills · ${casts.length} casts · ${pullDurationSec.toFixed(1)}s`)
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#05060a' }}>
      
      {/* ─── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{ width: 220, minWidth: 220, background: '#0a0b0f', borderRight: '1px solid rgba(124,92,252,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Character info */}
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: '#474f6b', marginBottom: 2 }}>Character</div>
          <div style={{ fontSize: '0.9rem', color: '#e2e4ec', fontWeight: 700 }}>{combatIdentity.name}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--gold)', marginTop: 2 }}>{combatIdentity.weapons.join(' + ') || 'Class Analysis'}</div>
        </div>

        {/* Scrollable Sidebar Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Logs list */}
          <div>
            <div style={{ padding: '0.75rem 1rem 0.4rem', fontSize: '0.58rem', fontWeight: 700, color: '#474f6b', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
              Arquivos de Log <span>({fileList.length})</span>
            </div>
            {fileList.map(f => (
              <div key={f.path} style={{ display: 'flex', alignItems: 'stretch' }}>
                <button onClick={() => handleLoadFile(f)} style={{
                  flex: 1, textAlign: 'left', padding: '0.5rem 0.5rem 0.5rem 1rem', background: logName === f.name ? 'rgba(212,175,55,0.08)' : 'transparent', border: 'none', borderLeft: `2px solid ${logName === f.name ? 'var(--gold)' : 'transparent'}`, cursor: 'pointer', color: logName === f.name ? '#f0cc55' : '#7a8099', transition: 'all 0.15s', minWidth: 0
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>{fmtDateShort(f.mtime)} · {fmtBytes(f.sizeBytes)}</div>
                </button>
                <button
                  onClick={(e) => handleDeleteFile(f, e)}
                  title="Deletar arquivo permanentemente"
                  style={{ flexShrink: 0, width: 28, background: 'transparent', border: 'none', cursor: 'pointer', color: '#474f6b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f25f5c')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#474f6b')}
                >✕</button>
              </div>
            ))}
            {!folder && (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <button className="tl-btn" onClick={handlePickFolder} style={{ fontSize: '0.65rem', padding: '0.4rem' }}>Configurar Pasta</button>
              </div>
            )}
          </div>

          {/* Group Break */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.5rem 1rem' }} />

          {/* Targets list */}
          <div>
            <div style={{ padding: '0.75rem 1rem 0.4rem', fontSize: '0.58rem', fontWeight: 700, color: '#474f6b', textTransform: 'uppercase' }}>Alvos Detectados</div>
            <button onClick={() => setSelTarget('All targets')} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: selTarget === 'All targets' ? 'rgba(124,92,252,0.1)' : 'transparent', border: 'none', borderLeft: `2px solid ${selTarget === 'All targets' ? '#7c5cfc' : 'transparent'}`, color: selTarget === 'All targets' ? '#e2e4ec' : '#7a8099', cursor: 'pointer', fontSize: '0.7rem'
            }}>Todos os Alvos</button>
            {availableTargets.map(t => (
              <button key={t} onClick={() => setSelTarget(t)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: selTarget === t ? 'rgba(124,92,252,0.1)' : 'transparent', border: 'none', borderLeft: `2px solid ${selTarget === t ? '#7c5cfc' : 'transparent'}`, color: selTarget === t ? '#e2e4ec' : '#7a8099', cursor: 'pointer', fontSize: '0.7rem'
              }}>{t}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Combat Identity Header */}
        <header style={{ padding: '0.75rem 10rem 0.75rem 1.5rem', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <div className="tl-eyebrow" style={{ color: 'var(--text-muted)' }}>Personagem</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-l)', fontFamily: 'Noto Serif, serif', lineHeight: 1.1 }}>{combatIdentity.name}</div>
            </div>
            
            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
            
            <div>
              <div className="tl-eyebrow" style={{ color: 'var(--text-muted)' }}>Armas Detectadas</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                {combatIdentity.weapons.length > 0 ? combatIdentity.weapons.map(w => (
                  <span key={w} className="tl-tag tl-tag-gold" style={{ fontSize: '0.65rem', padding: '0.1rem 0.6rem' }}>{w}</span>
                )) : (
                  <span className="tl-tag" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>Analisando...</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {onToggleSplit && (
              <button
                className={isSplitView ? 'tl-btn' : 'tl-btn-ghost'}
                onClick={onToggleSplit}
                style={{ fontSize: '0.65rem' }}
                title="Análise lado a lado"
              >
                {isSplitView ? '✕ Fechar Split' : '⊞ Split View'}
              </button>
            )}
             <button className="tl-btn-ghost" onClick={handlePickFolder} style={{ fontSize: '0.65rem' }}>Alterar Pasta</button>
             <button className="tl-btn" onClick={refreshFiles} style={{ fontSize: '0.65rem' }}>Atualizar Lista</button>
          </div>
        </header>

        {/* Dashboard Scroll Area */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>Processing data...</div>
          ) : !stats ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(212,175,55,0.2)', borderRadius: 8 }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📡</span>
                Select a log and target to see combat statistics.
              </div>
            </div>
          ) : (
            <>
              {/* Combat Sessions (Pulls) at the TOP */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Combat Sessions (Pulls)</div>
                  {userSplits.length > 0 && (
                    <button className="tl-btn-ghost" onClick={() => setUserSplits([])} style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem' }}>
                      Limpar Cortes ({userSplits.length})
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                   <div 
                    onClick={() => setSelPullId('all')}
                    style={{
                      padding: '0.75rem', borderRadius: 6, border: '1px solid', borderColor: selPullId === 'all' ? 'var(--gold)' : 'rgba(255,255,255,0.06)', background: selPullId === 'all' ? 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.03) 100%)' : 'rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: selPullId === 'all' ? 'var(--gold)' : '#e2e4ec' }}>All Combat</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Full log data for this target</div>
                  </div>
                  {enrichedPulls.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelPullId(p.id)}
                      style={{
                        padding: '0.75rem', borderRadius: 6, border: '1px solid', borderColor: selPullId === p.id ? 'var(--gold)' : 'rgba(255,255,255,0.06)', background: selPullId === p.id ? 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.03) 100%)' : 'rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: selPullId === p.id ? 'var(--gold)' : '#e2e4ec' }}>Pull #{p.id}</div>
                        <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: selPullId === p.id ? '#f0cc55' : '#a8b5d4' }}>{fmtCompact(p.dps)} DPS</div>
                      </div>
                      {p.weapons.length > 0 && (
                        <div style={{ fontSize: '0.6rem', marginTop: 2, opacity: 0.9 }}>
                          {p.weapons.map((w, i) => (
                            <span key={w}>
                              {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 3px' }}>+</span>}
                              <span style={{ color: WEAPON_COLORS[w] ?? 'var(--text-soft)' }}>{w}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        <span style={{ color: '#e2e4ec' }}>{fmtCompact(p.damage)}</span> dmg · <span style={{ color: '#e2e4ec' }}>{fmtDuration(p.endTime - p.startTime)}</span>
                      </div>
                      {selPullId === p.id && (
                        <button
                          className="tl-btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            const durSec = Math.floor((p.endTime - p.startTime) / 1000)
                            setSplitOffsetSec(Math.max(1, Math.floor(durSec / 2)))
                            setSplitMode(true)
                          }}
                          style={{ fontSize: '0.55rem', marginTop: '0.4rem', padding: '0.1rem 0.5rem', width: '100%' }}
                        >
                          ✂ Dividir Pull
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Split tool panel */}
                {splitMode && selPullId !== 'all' && (() => {
                  const ap = pulls.find(p => p.id === selPullId)
                  if (!ap) return null
                  const durSec = (ap.endTime - ap.startTime) / 1000
                  const splitTs = ap.startTime + splitOffsetSec * 1000
                  const bef = ap.events.filter(e => e.tsMs < splitTs)
                  const aft = ap.events.filter(e => e.tsMs >= splitTs)
                  const befDmg = bef.reduce((a, e) => a + e.damage, 0)
                  const aftDmg = aft.reduce((a, e) => a + e.damage, 0)
                  const befDps = splitOffsetSec > 0 ? befDmg / splitOffsetSec : 0
                  const aftDurSec = Math.max(1, durSec - splitOffsetSec)
                  const aftDps = aftDmg / aftDurSec
                  return (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.75rem', fontWeight: 700 }}>
                        ✂ Cortar Pull #{selPullId}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>0s</span>
                        <input
                          type="range"
                          min={1}
                          max={Math.max(2, Math.floor(durSec) - 1)}
                          step={1}
                          value={Math.round(splitOffsetSec)}
                          onChange={(e) => setSplitOffsetSec(parseFloat(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--gold)', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.6rem', color: 'var(--gold)', minWidth: 32, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(splitOffsetSec)}s</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{Math.floor(durSec)}s</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '0.5rem' }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: 4 }}>Antes · 0s → {Math.round(splitOffsetSec)}s</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e4ec', fontFamily: 'JetBrains Mono, monospace' }}>{fmtCompact(befDmg)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtCompact(befDps)} DPS</div>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>{bef.length} hits</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(212,175,55,0.6)', fontSize: '1.2rem', padding: '0 0.25rem' }}>✂</div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '0.5rem' }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: 4 }}>{Math.round(splitOffsetSec)}s → {Math.floor(durSec)}s</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e4ec', fontFamily: 'JetBrains Mono, monospace' }}>{fmtCompact(aftDmg)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtCompact(aftDps)} DPS</div>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>{aft.length} hits</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="tl-btn"
                          disabled={bef.length === 0 || aft.length === 0}
                          onClick={() => {
                            setUserSplits(prev => [...prev, splitTs])
                            setSplitMode(false)
                          }}
                          style={{ fontSize: '0.65rem' }}
                        >
                          Confirmar Corte
                        </button>
                        <button className="tl-btn-ghost" onClick={() => setSplitMode(false)} style={{ fontSize: '0.65rem' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Target Overview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e4ec', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selTarget} 
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Normalization</span>
                      <input 
                        type="range" min="0.1" max="2.0" step="0.1" 
                        value={chartInterval} 
                        onChange={(e) => setChartInterval(parseFloat(e.target.value))}
                        style={{ width: 100, height: 4, cursor: 'pointer', accentColor: 'var(--gold)' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold)', minWidth: 30 }}>{chartInterval.toFixed(1)}s</span>
                    </div>
                    {selPullId !== 'all' && (
                       <div className="tl-tag-gold" style={{ fontSize: '0.6rem' }}>Pull #{selPullId} Isolated</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2.5rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Damage</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'JetBrains Mono' }}>{fmtFull(stats.totalDmg)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>DPS</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e4ec', fontFamily: 'JetBrains Mono' }}>{fmtFull(stats.dps)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Duration</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e4ec', fontFamily: 'JetBrains Mono' }}>{fmtDuration(stats.durationMs)}</div>
                  </div>
                </div>
              </div>

              {/* Weapon Summary Row */}
              {stats.weaponDist.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {stats.weaponDist
                    .filter(w => w.name !== 'Desconhecido' && w.name !== 'Não Mapeado (Revisar)')
                    .map(w => {
                      const color = WEAPON_COLORS[w.name] ?? '#8884d8'
                      const dps = w.value / (stats.durationMs / 1000)
                      const ratio = (w.value / stats.totalDmg) * 100
                      return (
                        <div key={w.name} style={{
                          padding: '0.45rem 0.75rem',
                          background: `${color}12`,
                          border: `1px solid ${color}35`,
                          borderRadius: 6,
                          minWidth: 100,
                        }}>
                          <div style={{ fontSize: '0.58rem', color, fontWeight: 700, marginBottom: 3 }}>{w.name}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e4ec', fontFamily: 'JetBrains Mono, monospace' }}>{fmtCompact(w.value)}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: 2 }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtCompact(dps)} DPS</span>
                            <span style={{ fontSize: '0.6rem', color: `${color}cc` }}>{ratio.toFixed(2)}%</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Damage Over Time Chart */}
              <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cronologia de Dano</div>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button 
                        onClick={() => setGroupBy('weapon')}
                        style={{ 
                          fontSize: '0.55rem', padding: '0.2rem 0.6rem', borderRadius: '3px', border: 'none',
                          background: groupBy === 'weapon' ? 'var(--gold)' : 'transparent',
                          color: groupBy === 'weapon' ? '#000' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                        }}
                      >
                        POR ARMA
                      </button>
                      <button 
                        onClick={() => setGroupBy('skill')}
                        style={{ 
                          fontSize: '0.55rem', padding: '0.2rem 0.6rem', borderRadius: '3px', border: 'none',
                          background: groupBy === 'skill' ? 'var(--gold)' : 'transparent',
                          color: groupBy === 'skill' ? '#000' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                        }}
                      >
                        POR HABILIDADE
                      </button>
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <button 
                        onClick={() => setIsStacked(true)}
                        style={{ 
                          fontSize: '0.55rem', padding: '0.2rem 0.6rem', borderRadius: '3px', border: 'none',
                          background: isStacked ? 'var(--gold)' : 'transparent',
                          color: isStacked ? '#000' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                        }}
                      >
                        EMPILHADO
                      </button>
                      <button 
                        onClick={() => setIsStacked(false)}
                        style={{ 
                          fontSize: '0.55rem', padding: '0.2rem 0.6rem', borderRadius: '3px', border: 'none',
                          background: !isStacked ? 'var(--gold)' : 'transparent',
                          color: !isStacked ? '#000' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                        }}
                      >
                        INDIVIDUAL
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="tl-btn-ghost" onClick={() => toggleAllSkills(true)} style={{ fontSize: '0.55rem', padding: '0.2rem 0.6rem' }}>Ativar Tudo</button>
                    <button className="tl-btn-ghost" onClick={() => toggleAllSkills(false)} style={{ fontSize: '0.55rem', padding: '0.2rem 0.6rem' }}>Desativar Tudo</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', height: 260 }}>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <defs>
                          {stats.activeSeriesNames.map(name => (
                            <linearGradient key={`grad-${name}`} id={`color-${name}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={getSeriesColor(name)} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={getSeriesColor(name)} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="sec" stroke="rgba(255,255,255,0.2)" fontSize={9} tickFormatter={(v) => `${v}s`} hide={false} axisLine={false} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickFormatter={(v) => fmtCompact(v)} domain={[0, 'auto']} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0a0b0f', border: '1px solid var(--border-gold)', borderRadius: 4, fontSize: 10, color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                          labelFormatter={(v) => `Tempo: ${v}s`}
                          itemSorter={(item) => -(item.value as number)}
                        />
                        {stats.activeSeriesNames.map((name) => (
                          <Area 
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stackId={isStacked ? "1" : undefined}
                            stroke={getSeriesColor(name)}
                            strokeWidth={2}
                            fill={`url(#color-${name})`}
                            fillOpacity={isStacked ? 1 : 0.4}
                            hide={disabledSkills.has(name)}
                            isAnimationActive={false}
                          />
                        ))}
                        <Line 
                          type="monotone" 
                          dataKey="movingAvg" 
                          stroke="#f25f5c" 
                          dot={false} 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          name="Média Móvel (3s)"
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ width: 180, borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>Dano por Arma</div>
                    <div style={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                              <feOffset dx="0" dy="0" result="offsetblur" />
                              <feComponentTransfer>
                                <feFuncA type="linear" slope="0.5" />
                              </feComponentTransfer>
                              <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <Pie
                            data={stats.weaponDist}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={45}
                            innerRadius={25}
                            paddingAngle={5}
                            isAnimationActive={false}
                          >
                            {stats.weaponDist.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getSeriesColor(entry.name)} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0];
                                const color = data.payload.fill || '#fff';
                                const percent = ((data.value / stats.totalDmg) * 100).toFixed(2);
                                return (
                                  <div style={{ 
                                    background: '#0a0b0f', 
                                    border: `1px solid ${color}44`, 
                                    padding: '8px 12px', 
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                                  }}>
                                    <div style={{ color, fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px' }}>{data.name}</div>
                                    <div style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{fmtCompact(data.value)}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{percent}% do total</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      {stats.weaponDist.map((w) => (
                        <div key={w.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', marginBottom: 2 }}>
                          <span style={{ color: 'var(--text-soft)' }}>{w.name}</span>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{((w.value / stats.totalDmg) * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend Toggles */}
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {stats.activeSeriesNames.map(name => (
                    <button 
                      key={name}
                      onClick={() => toggleSkill(name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '4px', border: '1px solid',
                        borderColor: disabledSkills.has(name) ? 'rgba(255,255,255,0.05)' : getSeriesColor(name) + '44',
                        background: disabledSkills.has(name) ? 'transparent' : getSeriesColor(name) + '11',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: disabledSkills.has(name) ? '#444' : getSeriesColor(name) }} />
                      <span style={{ fontSize: '0.62rem', color: disabledSkills.has(name) ? 'var(--text-muted)' : '#e2e4ec' }}>{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloco de Curadoria (Habilidades Não Mapeadas) */}
              {stats.unmapped.length > 0 && (
                <div style={{
                  marginTop: '1.2rem',
                  padding: '1.2rem',
                  background: 'rgba(242, 95, 92, 0.05)',
                  border: '1px solid rgba(242, 95, 92, 0.2)',
                  borderRadius: '8px',
                  position: 'relative',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '0.78rem', color: '#f25f5c', marginBottom: '0.5rem', fontWeight: 600 }}>
                    ⚠️ {Array.from(new Set(stats.unmapped.map(s => s.name))).length} Habilidade(s) Não Mapeada(s)
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.8rem', lineHeight: '1.4' }}>
                    Identificamos nomes que não estão no banco de dados. Me informe o que são para catalogarmos:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.from(new Set(stats.unmapped.map(s => s.name))).map((name, i) => (
                      <code key={i} style={{ 
                        background: 'rgba(0,0,0,0.4)', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.68rem', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        color: '#e2e4ec',
                        fontFamily: 'JetBrains Mono'
                      }}>
                        {name}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Attack Breakdown Detail (Selected Skill) */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Attack Breakdown</div>
                {skillDetail ? (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-l)', marginBottom: '0.75rem' }}>{skillDetail.name}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {renderStatBox('Basic Attack', skillDetail.basic, fmtPct(100 - skillDetail.critRate - skillDetail.heavyRate + skillDetail.critHeavyRate), '#e2e4ec')}
                      {renderStatBox('Critical Hit', skillDetail.crit, fmtPct(skillDetail.critRate), '#3dd68c')}
                      {renderStatBox('Heavy Attack', skillDetail.heavy, fmtPct(skillDetail.heavyRate), '#7c5cfc')}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Select a skill from the table below to see detailed analysis.
                  </div>
                )}
              </div>

              {/* ── Log Timeline ──────────────────────── */}
              {activeEvents.length > 0 && (
                <div style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid rgba(124,92,252,0.18)',
                  borderRadius: 8, padding: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Timeline do Log
                      </span>
                      <button
                        onClick={() => setShowLogTimeline(v => !v)}
                        style={{ fontSize: '0.7rem', color: '#7a8099', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                      >
                        {showLogTimeline ? 'Ocultar' : 'Mostrar'}
                      </button>
                      {showLogTimeline && (
                        <button
                          onClick={() => setTimelineMaximized(true)}
                          title="Maximizar timeline"
                          style={{ fontSize: '0.85rem', color: '#7a8099', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 7px', cursor: 'pointer', lineHeight: 1.2 }}
                        >
                          ⛶
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleExportTimeline}
                      style={{
                        fontSize: '0.72rem', padding: '4px 12px',
                        background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.3)',
                        borderRadius: 4, color: '#a78bfa', cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      📤 Enviar para Rotação
                    </button>
                  </div>
                  {showLogTimeline && (() => {
                    const first = activeEvents[0].tsMs
                    const last  = activeEvents[activeEvents.length - 1].tsMs
                    const pullDurationSec = (last - first) / 1000
                    const dmgBySkill: Record<string, number> = {}
                    activeEvents.forEach(e => { dmgBySkill[e.skill] = (dmgBySkill[e.skill] ?? 0) + e.damage })
                    const skills = Object.keys(dmgBySkill).sort((a, b) => dmgBySkill[b] - dmgBySkill[a])

                    const castSet = new Set<string>()
                    const castEvents: Array<{ castAtSec: number; skillName: string }> = []
                    activeEvents.forEach(e => {
                      const relSec = (e.tsMs - first) / 1000
                      const bucket = parseFloat((Math.round(relSec / 0.5) * 0.5).toFixed(1))
                      const key = `${e.skill}|${bucket}`
                      if (!castSet.has(key)) {
                        castSet.add(key)
                        castEvents.push({ castAtSec: bucket, skillName: e.skill })
                      }
                    })
                    return (
                      <>
                        <LogTimelineView events={castEvents} skills={skills} pullDurationSec={pullDurationSec} />

                        {/* Modal maximizado */}
                        {timelineMaximized && (
                          <div
                            onClick={() => setTimelineMaximized(false)}
                            style={{
                              position: 'fixed', inset: 0, zIndex: 2000,
                              background: 'rgba(0,0,0,0.88)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '95vw', height: '90vh',
                                background: 'var(--bg-panel)',
                                border: '1px solid rgba(124,92,252,0.25)',
                                borderRadius: 10, padding: '1rem',
                                display: 'flex', flexDirection: 'column',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.72rem', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                  Timeline do Log — Visualização Completa
                                </span>
                                <button
                                  onClick={() => setTimelineMaximized(false)}
                                  style={{ background: 'none', border: 'none', color: '#7a8099', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}
                                >
                                  ×
                                </button>
                              </div>
                              <div style={{ flex: 1, overflow: 'hidden' }}>
                                <LogTimelineView
                                  events={castEvents}
                                  skills={skills}
                                  pullDurationSec={pullDurationSec}
                                  maxHeight="100%"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Skill Table */}
              {(() => {
                // ── Ordenação ─────────────────────────────────────────────────
                function handleSort(col: string) {
                  if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                  else { setSortCol(col); setSortDir('desc') }
                }

                function sortIndicator(col: string): string {
                  if (sortCol !== col) return ' ↕'
                  return sortDir === 'desc' ? ' ↓' : ' ↑'
                }

                const durationSec = stats.durationMs / 1000
                const sorted = [...stats.skillsList].sort((a, b) => {
                  let va = 0; let vb = 0
                  switch (sortCol) {
                    case 'name':     return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
                    case 'weapon':   return sortDir === 'asc'
                      ? (getWeaponBySkill(a.name) || '').localeCompare(getWeaponBySkill(b.name) || '')
                      : (getWeaponBySkill(b.name) || '').localeCompare(getWeaponBySkill(a.name) || '')
                    case 'damage':   va = a.damage;  vb = b.damage;  break
                    case 'dps':      va = a.damage / durationSec; vb = b.damage / durationSec; break
                    case 'ratio':    va = a.damage;  vb = b.damage;  break
                    case 'hits':     va = a.hits;    vb = b.hits;    break
                    case 'interval':
                      va = avgCastInterval(a.timestamps) ?? Infinity
                      vb = avgCastInterval(b.timestamps) ?? Infinity
                      break
                    case 'crit':     va = a.crits / a.hits;       vb = b.crits / b.hits;       break
                    case 'heavy':    va = a.heavies / a.hits;     vb = b.heavies / b.hits;     break
                    case 'critHeavy':va = a.critHeavies / a.hits; vb = b.critHeavies / b.hits; break
                  }
                  return sortDir === 'asc' ? va - vb : vb - va
                })

                const thS = (col: string, label: string, color = 'var(--text-muted)', align: 'left' | 'right' = 'right', title?: string): React.ReactElement => (
                  <th
                    onClick={() => handleSort(col)}
                    title={title}
                    style={{
                      padding: '0.6rem 1rem', fontSize: '0.6rem', textTransform: 'uppercase',
                      color: sortCol === col ? '#f0cc55' : color,
                      textAlign: align, cursor: 'pointer', userSelect: 'none',
                      whiteSpace: 'nowrap',
                      background: sortCol === col ? 'rgba(212,175,55,0.06)' : undefined,
                    }}
                  >
                    {label}{sortIndicator(col)}
                  </th>
                )

                return (
                  <div className="tl-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {thS('name',      'Habilidade',     'var(--text-muted)', 'left')}
                          {thS('weapon',    'Arma',           'var(--text-muted)', 'left')}
                          {thS('damage',    'Dano Total',     'var(--text-muted)')}
                          {thS('dps',       'DPS',            'var(--text-muted)')}
                          {thS('ratio',     'Ratio',          'var(--text-muted)')}
                          {thS('hits',      'Hits',           'var(--text-muted)')}
                          {thS('interval',  'Intervalo Médio','#22d3ee',           'right', 'Tempo médio entre usos da habilidade (threshold adaptativo detecta separação intra-cast vs inter-cast)')}
                          {thS('crit',      'Crit',           '#3dd68c')}
                          {thS('heavy',     'Heavy',          '#7c5cfc')}
                          {thS('critHeavy', 'Crit+Heavy',     'var(--gold)')}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((s, idx) => {
                          const ratio  = (s.damage / stats.totalDmg) * 100
                          const critP  = (s.crits / s.hits) * 100
                          const heavyP = (s.heavies / s.hits) * 100
                          const combP  = (s.critHeavies / s.hits) * 100
                          return (
                            <tr
                              key={s.name}
                              onClick={() => setSelSkill(s.name)}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                background: selSkill === s.name ? 'rgba(212,175,55,0.06)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                cursor: 'pointer',
                                color: selSkill === s.name ? '#f0cc55' : undefined,
                              }}
                            >
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 500 }}>{s.name}</td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', color: 'var(--text-soft)' }}>{getWeaponBySkill(s.name) || 'Indefinido'}</td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{fmtFull(s.damage)}</td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--text-soft)' }}>{fmtCompact(s.damage / durationSec)}</td>
                              <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                  <span style={{ fontSize: '0.65rem' }}>{ratio.toFixed(2)}%</span>
                                  <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                                    <div style={{ height: '100%', width: `${ratio}%`, background: ratio > 20 ? 'var(--gold)' : '#7c5cfc', borderRadius: 2 }} />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', color: 'var(--text-soft)' }}>{s.hits}</td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', color: '#22d3ee', fontFamily: 'JetBrains Mono' }}>
                                {(() => { const v = avgCastInterval(s.timestamps); return v != null ? `${v.toFixed(2)}s` : '—' })()}
                              </td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', color: '#3dd68c' }}>{critP.toFixed(2)}%</td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', color: '#7c5cfc' }}>{heavyP.toFixed(2)}%</td>
                              <td style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textAlign: 'right', color: 'var(--gold-l)' }}>{combP.toFixed(2)}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
