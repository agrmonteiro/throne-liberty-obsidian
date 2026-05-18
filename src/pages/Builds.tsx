import React, { useState, useMemo, useEffect } from 'react'
import { useBuilds } from '../store/useBuilds'
import { calcAverageDPS, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import { DEFAULT_STATS } from '../engine/types'
import type { Build, BuildStats } from '../engine/types'
import { useT } from '../i18n/useT'
import { fmt, fmtPct } from '../engine/fmt'
import { NumericInput } from '../components/NumericInput'
const now  = () => new Date().toISOString()

// ─── Stat groups for the full stats editor ───────────────────────────────────

const RAW_STAT_GROUPS: [string, string[]][] = [
  ['Geral', [
    'Combat Power', 'Max Damage', 'Attack Speed', 'Attack Speed %',
    'Range', 'Range %', 'Bonus Damage', 'Species Damage Boost',
  ]],
  ['Crítico & Heavy', [
    'Melee Critical Hit Chance', 'Magic Critical Hit Chance', 'Ranged Critical Hit Chance',
    'Melee Heavy Attack Chance', 'Ranged Heavy Attack Chance', 'Magic Heavy Attack Chance',
    'Critical Damage', 'Heavy Attack Damage',
  ]],
  ['Hit Chance', ['Melee Hit Chance', 'Ranged Hit Chance', 'Magic Hit Chance']],
  ['Defesa', [
    'Damage Reduction', 'Melee Defense', 'Ranged Defense', 'Magic Defense',
    'Melee Evasion', 'Ranged Evasion', 'Magic Evasion',
    'Melee Endurance', 'Ranged Endurance', 'Magic Endurance',
    'Melee Heavy Attack Evasion', 'Ranged Heavy Attack Evasion', 'Magic Heavy Attack Evasion',
  ]],
  ['Vida & Mana', [
    'Max Health', 'Health Regen', 'Max Mana', 'Mana Regen', 'Mana Cost Efficiency',
  ]],
  ['Skills & Mov', [
    'Movement Speed', 'Stamina Regen', 'Skill Damage Boost', 'Cooldown Speed',
    'Healing', 'Buff Duration', 'Debuff Duration', 'Amitoi Healing', 'Skill Healing over Time',
  ]],
  ['CC Chance', [
    'Stun Chance', 'Fear Chance', 'Bind Chance', 'Petrification Chance',
    'Sleep Chance', 'Collision Chance', 'Silence Chance', 'Weaken Chance',
  ]],
  ['CC Resist', [
    'Weaken Resistance', 'Stun Resistance', 'Petrification Resistance',
    'Sleep Resistance', 'Silence Resistance', 'Fear Resistance',
    'Bind Resistance', 'Collision Resistance', 'Skill Damage Resistance',
  ]],
  ['PvP', [
    'PvP Melee Critical Hit Chance', 'PvP Ranged Critical Hit Chance', 'PvP Magic Critical Hit Chance',
    'PvP Melee Endurance', 'PvP Ranged Endurance', 'PvP Magic Endurance',
    'PvP Melee Hit Chance', 'PvP Ranged Hit Chance', 'PvP Magic Hit Chance',
    'PvP Melee Evasion', 'PvP Ranged Evasion', 'PvP Magic Evasion',
    'PvP Melee Heavy Attack Chance', 'PvP Ranged Heavy Attack Chance', 'PvP Magic Heavy Attack Chance',
    'PvP Ranged Heavy Attack Evasion',
  ]],
  ['Boss', [
    'Boss Damage Reduction',
    'Boss Melee Critical Hit Chance', 'Boss Ranged Critical Hit Chance', 'Boss Magic Critical Hit Chance',
    'Boss Melee Endurance', 'Boss Ranged Endurance', 'Boss Magic Endurance',
    'Boss Melee Hit Chance', 'Boss Ranged Hit Chance', 'Boss Magic Hit Chance',
    'Boss Melee Evasion', 'Boss Ranged Evasion', 'Boss Magic Evasion',
    'Boss Melee Heavy Attack Chance', 'Boss Ranged Heavy Attack Chance', 'Boss Magic Heavy Attack Chance',
    'Boss Ranged Heavy Attack Evasion',
  ]],
  ['Especial', [
    'Side Heavy Attack Chance', 'Side Evasion', 'Front Heavy Attack Evasion',
    'Demon Damage Boost', 'Wildkin Damage Boost', 'Undead Damage Boost',
    'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
  ]],
]

const ATTRIBUTE_NAMES = ['Strength', 'Dexterity', 'Wisdom', 'Perception', 'Fortitude']

// ─── Calculator fields (subset used for DPS engine) ──────────────────────────

type StatKey = keyof BuildStats
const CALC_FIELDS: Array<{ key: StatKey; label: string; group: string; max?: number }> = [
  { key: 'minWeaponDmg',       label: 'Min Weapon Dmg',      group: 'Arma'      },
  { key: 'maxWeaponDmg',       label: 'Max Weapon Dmg',      group: 'Arma'      },
  { key: 'critHitChance',      label: 'Crit Hit Chance',     group: 'Ofensivos' },
  { key: 'bossCritChance',     label: 'Boss Crit Chance',    group: 'Ofensivos' },
  { key: 'heavyAttackChance',  label: 'Heavy Attack Chance', group: 'Ofensivos' },
  { key: 'bossHeavyChance',    label: 'Boss Heavy Chance',   group: 'Ofensivos' },
  { key: 'heavyAttackDmgComp', label: 'Heavy Dmg Compl.',    group: 'Ofensivos' },
  { key: 'critDmgPct',         label: 'Crit Damage %',       group: 'Ofensivos' },
  { key: 'skillDmgBoost',      label: 'Skill Dmg Boost',     group: 'Ofensivos' },
  { key: 'bonusDmg',           label: 'Bonus Damage',        group: 'Ofensivos' },
  { key: 'speciesDmgBoost',    label: 'Species Boost',       group: 'Ofensivos' },
  { key: 'cdrPct',             label: 'Cooldown Speed %',    group: 'Ofensivos', max: 120 },
  { key: 'attackSpeedPct',     label: 'Attack Speed %',      group: 'Ofensivos', max: 150 },
  { key: 'monsterDmgBoostPct', label: 'Monster Dmg Boost %', group: 'Buffs'     },
  { key: 'dmgBuffPct',         label: 'Damage Buff %',       group: 'Buffs'     },
  { key: 'skillBaseDamagePct', label: 'Skill Base Dmg %',    group: 'Skill'     },
  { key: 'skillBonusBaseDmg',  label: 'Skill Bonus Dmg',     group: 'Skill'     },
  { key: 'skillCooldown',      label: 'Cooldown Base (s)',   group: 'Skill'     },
  { key: 'skillCastTime',      label: 'Tempo de Cast (s)',   group: 'Skill'     },
  { key: 'targetDefense',      label: "Target's Defense",    group: 'Alvo'      },
  { key: 'targetEvasion',      label: "Target's Evasion",    group: 'Alvo'      },
]

// ─── Import queue ────────────────────────────────────────────────────────────

const DEFAULT_BUILD_NAME = 'Build'
function isDefaultName(name: string) { return name.trim() === DEFAULT_BUILD_NAME }

interface QueueItem {
  qid: string
  type: 'url' | 'reimport'
  url?: string
  buildId?: string
  sourceUrl?: string
  status: 'pending' | 'running' | 'naming' | 'done' | 'error'
  result?: Build
  editName: string
  errorMsg?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Builds(): React.ReactElement {
  const t = useT()
  const { builds, saveBuild, deleteBuild, setActive, activeBuildId,
          importFromFile, importFromUrlPython, exportBuild, createEmpty } = useBuilds()
  const buildList = useMemo(() => Object.values(builds), [builds])

  const statusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingRef  = React.useRef(false)
  const importGenRef   = React.useRef(0)
  const queueRef       = React.useRef<QueueItem[]>([])

  const [editId,        setEditId]        = useState<string | null>(null)
  const [editData,      setEditData]      = useState<Build | null>(null)
  const [editTab,       setEditTab]       = useState<'stats' | 'calc'>('stats')
  const [statsFilter,   setStatsFilter]   = useState('')
  const [newName,       setNewName]       = useState('')
  const [newCombo,      setNewCombo]      = useState('')
  const [urlInput,      setUrlInput]      = useState('')
  const [status,        setStatus]        = useState<string | null>(null)
  const [statusErr,     setStatusErr]     = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [lastLog,       setLastLog]       = useState<string | null>(null)
  const [queue,         setQueue]         = useState<QueueItem[]>([])

  function startEdit(b: Build) {
    setEditId(b.id)
    setEditData({
      ...b,
      stats:          { ...b.stats },
      rawStats:       { ...(b.rawStats ?? {}) },
      rawAttributes:  { ...(b.rawAttributes ?? {}) },
    })
    setEditTab('stats')
    setStatsFilter('')
  }

  function cancelEdit() { setEditId(null); setEditData(null) }

  async function saveEdit() {
    if (!editData) return
    await saveBuild({ ...editData, editedAt: now() })
    setEditId(null)
    setEditData(null)
    showStatus(t('builds.status.saved'), false)
  }

  function updateQueue(updater: (prev: QueueItem[]) => QueueItem[]) {
    const next = updater(queueRef.current)
    queueRef.current = next
    setQueue(next)
  }

  async function handleImport() {
    showStatus(t('builds.status.importing'), false)
    const build = await importFromFile()
    if (build) showStatus(`Importado: ${build.name}`, false)
    else showStatus(t('builds.status.importCancelled'), true)
  }

  function handleUrlImport() {
    const url = urlInput.trim()
    if (!url) return
    if (!isValidQuestlogUrl(url)) {
      showStatus(t('builds.import.invalid'), true)
      return
    }
    setUrlInput('')
    addToQueue({ type: 'url', url })
  }

  function addToQueue(opts: { type: 'url'; url: string } | { type: 'reimport'; buildId: string }) {
    if (opts.type === 'reimport') {
      const already = queueRef.current.some(
        i => i.buildId === opts.buildId && (i.status === 'pending' || i.status === 'running'),
      )
      if (already) return
    }
    const sourceUrl = opts.type === 'reimport' ? (builds[opts.buildId]?.sourceUrl ?? undefined) : undefined
    const item: QueueItem = {
      qid: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...opts,
      sourceUrl,
      status: 'pending',
      editName: '',
    }
    updateQueue(prev => [...prev, item])
    kick()
  }

  async function kick() {
    if (processingRef.current) return
    const current = queueRef.current
    if (current.some(i => i.status === 'naming')) return
    const next = current.find(i => i.status === 'pending')
    if (!next) return

    processingRef.current = true
    const gen = ++importGenRef.current
    updateQueue(prev => prev.map(i => i.qid === next.qid ? { ...i, status: 'running' } : i))

    let shouldContinue = true

    if (next.type === 'url') {
      const result = await importFromUrlPython(next.url!)
      if (importGenRef.current !== gen) { processingRef.current = false; return }
      if ('error' in result) {
        const errMsg = result.error === 'cancelled' ? t('builds.status.cancelled') : result.error
        updateQueue(prev => prev.map(i => i.qid === next.qid ? { ...i, status: 'error', errorMsg: errMsg } : i))
        if (result.error === 'cancelled') shouldContinue = false
      } else if (isDefaultName(result.name)) {
        updateQueue(prev => prev.map(i => i.qid === next.qid
          ? { ...i, status: 'naming', result, editName: result.name }
          : i))
        processingRef.current = false
        setIsDownloading(false)
        return
      } else {
        await saveBuild(result)
        setActive(result.id)
        updateQueue(prev => prev.map(i => i.qid === next.qid ? { ...i, status: 'done' } : i))
      }
    } else {
      if (!next.sourceUrl) {
        updateQueue(prev => prev.map(i => i.qid === next.qid
          ? { ...i, status: 'error', errorMsg: t('builds.queue.noSourceUrl') }
          : i))
      } else {
        const result = await importFromUrlPython(next.sourceUrl)
        if (importGenRef.current !== gen) { processingRef.current = false; return }
        if ('error' in result) {
          const errMsg = result.error === 'cancelled' ? t('builds.status.cancelled') : result.error
          updateQueue(prev => prev.map(i => i.qid === next.qid ? { ...i, status: 'error', errorMsg: errMsg } : i))
          if (result.error === 'cancelled') shouldContinue = false
        } else {
          const build = useBuilds.getState().builds[next.buildId!]
          if (build) {
            await saveBuild({
              ...build,
              stats:         result.stats,
              rawStats:      result.rawStats,
              rawAttributes: result.rawAttributes,
              importedAt:    new Date().toISOString(),
              sourceUrl:     next.sourceUrl,
            })
          }
          updateQueue(prev => prev.map(i => i.qid === next.qid ? { ...i, status: 'done' } : i))
        }
      }
    }

    setIsDownloading(false)
    setLastLog(null)
    processingRef.current = false
    if (shouldContinue) kick()
  }

  async function confirmNaming(qid: string) {
    const item = queueRef.current.find(i => i.qid === qid)
    if (!item?.result) return
    const name = item.editName.trim() || DEFAULT_BUILD_NAME
    await saveBuild({ ...item.result, name })
    setActive(item.result.id)
    updateQueue(prev => prev.map(i => i.qid === qid ? { ...i, status: 'done' } : i))
    kick()
  }

  function cancelQueue() {
    importGenRef.current++
    processingRef.current = false
    setIsDownloading(false)
    setLastLog(null)
    window.dataAPI.questlogCancel?.().catch(() => {})
    updateQueue(prev => prev.map(i => i.status === 'running' ? { ...i, status: 'pending' } : i))
  }

  function clearQueue() {
    updateQueue(prev => prev.filter(i => i.status === 'running' || i.status === 'naming' || i.status === 'pending'))
  }

  function removeFromQueue(qid: string) {
    updateQueue(prev => prev.filter(i => !(i.qid === qid && i.status === 'pending')))
  }

  async function handleDelete(id: string) {
    if (!confirm(t('builds.delete.confirm'))) return
    await deleteBuild(id)
    showStatus(t('builds.status.deleted'), false)
  }

  async function handleExport(id: string) {
    await exportBuild(id)
    showStatus(t('builds.status.exported'), false)
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const build = createEmpty(name, newCombo.trim())
    await saveBuild(build)
    setActive(build.id)
    setNewName('')
    setNewCombo('')
    showStatus(`Build "${name}" ${t('builds.status.created')}`, false)
    startEdit(build)
    setEditTab('calc')
  }

  function showStatus(msg: string, isError: boolean, duration = 5000) {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    setStatus(msg)
    setStatusErr(isError)
    if (duration !== Infinity) {
      statusTimerRef.current = setTimeout(() => setStatus(null), duration)
    }
  }

  function isValidQuestlogUrl(raw: string): boolean {
    try {
      const url = new URL(raw)
      return url.hostname === 'questlog.gg' && url.pathname.includes('character-builder')
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (!window.dataAPI?.onProgress) return
    window.dataAPI.onProgress(({ stage }) => {
      setIsDownloading(stage === 'downloading-browser')
    })
    return () => window.dataAPI.offProgress?.()
  }, [])

  useEffect(() => {
    if (!window.dataAPI?.onLog) return
    window.dataAPI.onLog(({ line }) => setLastLog(line))
    return () => window.dataAPI.offLog?.()
  }, [])

  function updateCalcField(key: StatKey, value: number) {
    if (!editData) return
    setEditData({ ...editData, stats: { ...editData.stats, [key]: value } })
  }

  function replicateFromQuestlog() {
    if (!editData?.rawStats) return
    const raw = editData.rawStats

    const n = (k: string, fallback = 0): number => {
      const v = raw[k]
      if (v == null) return fallback
      let s = String(v).replace('%', '').split('~')[0].trim()
      s = s.replace(/[,.](\d{3})(?!\d)/g, '$1').replace(',', '.')
      return parseFloat(s) || fallback
    }
    const maxOf = (...keys: string[]) => Math.max(0, ...keys.map((k) => n(k)))

    // Max Damage range → min/max weapon
    const maxDmgStr = raw['Max Damage'] ?? ''
    const dmgParts  = String(maxDmgStr).split('~').map((p) => parseFloat(p.trim().replace(',', '.')) || 0)
    const minWeaponDmg = dmgParts[0] ?? editData.stats.minWeaponDmg
    const maxWeaponDmg = dmgParts[1] ?? dmgParts[0] ?? editData.stats.maxWeaponDmg

    const heavyEntry = raw['Heavy Attack Damage']
    const heavyAttackDmgComp = heavyEntry != null
      ? Math.max(0, n('Heavy Attack Damage'))
      : Math.max(0, n('Heavy Damage', 100) - 100)

    const speciesDmgBoost = maxOf(
      'Species Damage Boost', 'Demon Damage Boost', 'Wildkin Damage Boost',
      'Undead Damage Boost', 'Humanoid Damage Boost', 'Construct Damage Boost', 'Magic Damage Boost',
    )

    // Boss Crit/Heavy do quest log já somam o valor base → extrair só o delta extra
    const critHitChance      = n('Magic Critical Hit Chance') || n('Melee Critical Hit Chance') || editData.stats.critHitChance
    const heavyAttackChance  = n('Magic Heavy Attack Chance') || n('Melee Heavy Attack Chance') || editData.stats.heavyAttackChance
    const rawBossCrit        = maxOf('Boss Melee Critical Hit Chance', 'Boss Ranged Critical Hit Chance', 'Boss Magic Critical Hit Chance')
    const rawBossHeavy       = maxOf('Boss Melee Heavy Attack Chance', 'Boss Ranged Heavy Attack Chance', 'Boss Magic Heavy Attack Chance')
    const bossCritChance     = Math.max(0, rawBossCrit  - critHitChance)
    const bossHeavyChance    = Math.max(0, rawBossHeavy - heavyAttackChance)

    const updated: BuildStats = {
      ...editData.stats,
      minWeaponDmg:       minWeaponDmg || editData.stats.minWeaponDmg,
      maxWeaponDmg:       maxWeaponDmg || editData.stats.maxWeaponDmg,
      critHitChance,
      bossCritChance,
      heavyAttackChance,
      bossHeavyChance,
      heavyAttackDmgComp,
      skillDmgBoost:      n('Skill Damage Boost') || editData.stats.skillDmgBoost,
      bonusDmg:           n('Bonus Damage') || editData.stats.bonusDmg,
      critDmgPct:         n('Critical Damage') || editData.stats.critDmgPct,
      speciesDmgBoost:    speciesDmgBoost || editData.stats.speciesDmgBoost,
      cdrPct:             n('Cooldown Speed')  || editData.stats.cdrPct,
      attackSpeedPct:     n('Attack Speed')    || editData.stats.attackSpeedPct,
    }
    setEditData({ ...editData, stats: updated })
  }

  function updateRawStat(key: string, value: string) {
    if (!editData) return
    setEditData({ ...editData, rawStats: { ...(editData.rawStats ?? {}), [key]: value } })
  }

  function updateRawAttr(key: string, value: string) {
    if (!editData) return
    const total = parseFloat(value) || 0
    setEditData({
      ...editData,
      rawAttributes: {
        ...(editData.rawAttributes ?? {}),
        [key]: { total, display: value },
      },
    })
  }

  // Filtered stats for the editor
  const filteredGroups = useMemo(() => {
    const q = statsFilter.toLowerCase()
    if (!q) return RAW_STAT_GROUPS
    return RAW_STAT_GROUPS
      .map(([group, keys]) => [group, keys.filter((k) => k.toLowerCase().includes(q))] as [string, string[]])
      .filter(([, keys]) => keys.length > 0)
  }, [statsFilter])

  // Stats that exist in rawStats but aren't in any predefined group
  const extraStats = useMemo(() => {
    if (!editData?.rawStats) return []
    const known = new Set(RAW_STAT_GROUPS.flatMap(([, keys]) => keys))
    return Object.keys(editData.rawStats).filter((k) => !known.has(k))
  }, [editData])

  const calcGroups = [...new Set(CALC_FIELDS.map((f) => f.group))]

  const queuedBuildIds = useMemo(
    () => new Set(queue.filter(i => i.status === 'pending' || i.status === 'running').map(i => i.buildId).filter(Boolean) as string[]),
    [queue],
  )
  const isQueueRunning = queue.some(i => i.status === 'running')

  const statusColor  = statusErr ? '#f25f5c' : '#3dd68c'
  const statusBg     = statusErr ? 'rgba(242,95,92,0.1)' : 'rgba(61,214,140,0.1)'
  const statusBorder = statusErr ? 'rgba(242,95,92,0.3)' : 'rgba(61,214,140,0.3)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>{t('builds.title')}</h1>
        <p>{t('builds.subtitle')}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* ── Status bar (notificações gerais) ─────────────────────────── */}
        {status && (
          <div style={{ padding: '0.6rem 1rem', background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 6, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: statusColor, fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>
                {status}
              </span>
              {statusErr && (
                <button
                  onClick={() => window.dataAPI.scraperOpenLog?.()}
                  style={{ padding: '0.2rem 0.65rem', fontSize: '0.75rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4, color: '#d4af37', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {t('builds.status.viewLog')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Fila unificada de importação ──────────────────────────────── */}
        {queue.length > 0 && (
          <div className="tl-panel" style={{ marginBottom: '1.25rem', borderColor: 'var(--border-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: 'var(--gold-l)', fontSize: '0.85rem' }}>
                {t('builds.queue.title')}{queue.length} {queue.length !== 1 ? t('builds.queue.buildPlural') : t('builds.queue.buildSingular')}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                {isQueueRunning && (
                  <button className="tl-btn-ghost" style={{ fontSize: '0.72rem' }} onClick={cancelQueue}>{t('builds.queue.pause')}</button>
                )}
                <button className="tl-btn-ghost" style={{ fontSize: '0.72rem' }} onClick={clearQueue}>{t('builds.queue.clear')}</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {queue.map(item => {
                const build = item.buildId ? builds[item.buildId] : null
                const label = build?.name ?? (item.url ? item.url.replace('https://questlog.gg/', 'questlog.gg/') : item.qid)
                const icon = item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : item.status === 'running' ? '⏳' : item.status === 'naming' ? '✏' : '◦'
                const labelColor = item.status === 'done' ? 'var(--green)' : item.status === 'error' ? 'var(--red)' : item.status === 'running' ? 'var(--gold-l)' : item.status === 'naming' ? '#d4af37' : 'var(--text-soft)'

                return (
                  <div key={item.qid} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      <span style={{ color: labelColor, minWidth: 16, flexShrink: 0 }}>{icon}</span>

                      {item.status === 'naming' ? (
                        <>
                          <input
                            className="tl-input"
                            value={item.editName}
                            placeholder={t('builds.queue.namePlaceholder')}
                            onChange={(e) => updateQueue(prev => prev.map(i => i.qid === item.qid ? { ...i, editName: e.target.value } : i))}
                            onKeyDown={(e) => e.key === 'Enter' && confirmNaming(item.qid)}
                            autoFocus
                            style={{ flex: 1, fontFamily: 'Inter,sans-serif', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                          />
                          <button
                            className="tl-btn"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.7rem', background: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.5)', color: '#f0cc55', flexShrink: 0 }}
                            onClick={() => confirmNaming(item.qid)}
                          >
                            {t('builds.queue.nameSave')}
                          </button>
                        </>
                      ) : (
                        <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                      )}

                      {item.status === 'running' && isDownloading && (
                        <div style={{ width: 48, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ height: '100%', width: '40%', borderRadius: 2, background: '#d4af37', animation: 'tl-indeterminate 1.4s ease-in-out infinite' }} />
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <button className="tl-btn-ghost" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', flexShrink: 0 }} onClick={() => removeFromQueue(item.qid)}>✕</button>
                      )}
                    </div>

                    {item.status === 'naming' && (
                      <div style={{ marginLeft: 24, fontSize: '0.7rem', color: '#d4af37', fontFamily: 'JetBrains Mono, monospace' }}>
                        {t('builds.queue.naming')}
                      </div>
                    )}

                    {item.status === 'error' && item.errorMsg && (
                      <div style={{ marginLeft: 24, fontSize: '0.7rem', color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {t('builds.queue.errorPrefix')}{item.errorMsg}
                      </div>
                    )}

                    {item.status === 'running' && lastLog && (
                      <div style={{ marginLeft: 24, fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastLog}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Questlog URL import */}
        <div className="tl-panel" style={{ marginBottom: '1.25rem' }}>
          <div className="tl-eyebrow" style={{ marginBottom: 8 }}>{t('builds.questlog.title')}</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="tl-input"
              style={{ flex: 1, fontFamily: 'Inter,sans-serif' }}
              placeholder={t('builds.questlog.placeholder')}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
            />
            <button
              className="tl-btn"
              onClick={handleUrlImport}
              disabled={!urlInput.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {t('builds.questlog.button')}
            </button>
          </div>
        </div>

        {/* Other actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
          <button className="tl-btn-ghost" onClick={handleImport}>{t('builds.import.button')}</button>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{t('builds.create.name')}</div>
              <input className="tl-input" style={{ width: 180, fontFamily: 'Inter,sans-serif' }} placeholder={t('builds.create.placeholder')} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{t('builds.create.weapons')}</div>
              <input className="tl-input" style={{ width: 150, fontFamily: 'Inter,sans-serif' }} placeholder={t('builds.create.weaponsPlaceholder')} value={newCombo} onChange={(e) => setNewCombo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <button className="tl-btn-ghost" onClick={handleCreate}>{t('builds.create.button')}</button>
          </div>
        </div>

        {buildList.length === 0 ? (
          <div className="tl-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-soft)' }}>
            {t('builds.empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {buildList.map((b) => {
              const isActive  = b.id === activeBuildId
              const dps       = calcAverageDPS(b.stats)
              const crit      = critChanceFromStat(b.stats.critHitChance) * 100
              const heavy     = heavyChanceFromStat(b.stats.heavyAttackChance) * 100
              const isEditing = editId === b.id
              const statCount = Object.keys(b.rawStats ?? {}).length
              const attrCount = Object.keys(b.rawAttributes ?? {}).length

              return (
                <div key={b.id}>
                  {/* ── Build card ─────────────────────────────────────────── */}
                  <div className="tl-card" style={{ borderColor: isActive ? 'var(--border-gold)' : undefined, cursor: 'default' }} onDoubleClick={() => { if (!isEditing) startEdit(b) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontWeight: 700, fontSize: '0.95rem' }}>{b.name}</span>
                          {b.weaponCombo && <span className="tl-tag tl-tag-violet">{b.weaponCombo}</span>}
                          {isActive && <span className="tl-tag tl-tag-gold">{t('builds.card.active')}</span>}
                          {b.editedAt && <span className="tl-tag tl-tag-cyan">{t('builds.card.edited')}</span>}
                          {statCount > 0 && (
                            <span className="tl-tag" style={{ background: 'rgba(61,214,140,0.08)', color: '#3dd68c', border: '1px solid rgba(61,214,140,0.2)' }}>
                              {statCount} {t('builds.card.stats')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-soft)', fontFamily: 'JetBrains Mono, monospace' }}>
                          <span>DPS <b style={{ color: '#f0cc55' }}>{dps > 0 ? fmt(dps) : '—'}</b></span>
                          <span>Crit <b style={{ color: '#d4af37' }}>{fmtPct(crit)}</b></span>
                          <span>Heavy <b style={{ color: '#7c5cfc' }}>{fmtPct(heavy)}</b></span>
                          {attrCount > 0 && <span style={{ color: 'var(--text-muted)' }}>{attrCount} {t('builds.card.attributes')}</span>}
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(b.importedAt).toLocaleDateString('pt-BR')}</span>
                          {b.sourceUrl && (
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); window.open(b.sourceUrl, '_blank') }}
                              style={{ color: 'var(--text-muted)', textDecoration: 'none', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}
                              title={`Abrir no navegador: ${b.sourceUrl}`}
                            >
                              🔗 {b.sourceUrl.replace('https://questlog.gg/', 'questlog.gg/')}
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        {!isActive && <button className="tl-btn-ghost" onClick={() => { setActive(b.id); showStatus(`✅ Build "${b.name}" ${t('builds.card.activate')}.`, false) }}>{t('builds.card.activate')}</button>}
                        <button className="tl-btn-ghost" onClick={() => isEditing ? cancelEdit() : startEdit(b)}>{isEditing ? t('builds.card.close') : t('builds.card.edit')}</button>
                        {b.sourceUrl && (
                          <button
                            className="tl-btn-ghost"
                            onClick={() => addToQueue({ type: 'reimport', buildId: b.id })}
                            title={queuedBuildIds.has(b.id) ? undefined : b.sourceUrl}
                            style={{ borderColor: queuedBuildIds.has(b.id) ? 'var(--border-gold)' : undefined, color: queuedBuildIds.has(b.id) ? 'var(--gold-l)' : undefined }}
                          >
                            {queuedBuildIds.has(b.id) ? t('builds.card.inQueue') : t('builds.card.reimport')}
                          </button>
                        )}
                        <button className="tl-btn-ghost" onClick={() => handleExport(b.id)}>{t('builds.card.export')}</button>
                        <button className="tl-btn-ghost" style={{ borderColor: 'rgba(242,95,92,0.3)', color: '#f25f5c' }} onClick={() => handleDelete(b.id)}>🗑</button>
                      </div>
                    </div>

                    {/* Attribute badges (inline preview) */}
                    {b.rawAttributes && Object.keys(b.rawAttributes).length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: 8, flexWrap: 'wrap' }}>
                        {ATTRIBUTE_NAMES.filter((a) => b.rawAttributes![a]).map((a) => (
                          <span key={a} style={{ fontSize: '0.67rem', fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 4, color: '#a992f8' }}>
                            {a.slice(0, 3).toUpperCase()} <b style={{ color: '#c4b5fd' }}>{b.rawAttributes[a].display}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Inline editor ──────────────────────────────────────── */}
                  {isEditing && editData && (
                    <div className="tl-panel" style={{ borderTop: 'none', borderRadius: '0 0 8px 8px', marginTop: -1 }}>

                      {/* Save / cancel — TOPO */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
                        <button className="tl-btn" onClick={saveEdit}>{t('builds.editor.save')}</button>
                        <button className="tl-btn-ghost" onClick={cancelEdit}>{t('builds.card.close')}</button>
                      </div>

                      {/* Name / combo */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{t('builds.create.name')}</div>
                          <input className="tl-input" style={{ fontFamily: 'Inter,sans-serif' }} value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        </div>
                        <div>
                          <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{t('builds.create.weapons')}</div>
                          <input className="tl-input" style={{ fontFamily: 'Inter,sans-serif' }} value={editData.weaponCombo} onChange={(e) => setEditData({ ...editData, weaponCombo: e.target.value })} />
                        </div>
                      </div>

                      {/* Tabs */}
                      <div style={{ display: 'flex', gap: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        {(['stats', 'calc'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setEditTab(tab)}
                            style={{
                              background: 'none',
                              border: 'none',
                              borderBottom: editTab === tab ? '2px solid #7c5cfc' : '2px solid transparent',
                              color: editTab === tab ? '#c4b5fd' : 'var(--text-muted)',
                              padding: '0.4rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: editTab === tab ? 700 : 400,
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                            }}
                          >
                            {tab === 'stats' ? `${t('builds.editor.statsTab')} ${Object.keys(editData.rawStats ?? {}).length})` : t('builds.editor.calcTab')}
                          </button>
                        ))}
                      </div>

                      {/* ── TAB: Stats completos ──────────────────────────── */}
                      {editTab === 'stats' && (
                        <div>
                          {/* Attributes */}
                          {editData.rawAttributes && Object.keys(editData.rawAttributes).length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a992f8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{t('builds.editor.attributes')}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem' }}>
                                {ATTRIBUTE_NAMES.map((a) => (
                                  <div key={a}>
                                    <div className="tl-eyebrow" style={{ marginBottom: 2 }}>{a}</div>
                                    <NumericInput integer
                                      className="tl-input"
                                      value={editData.rawAttributes?.[a]?.total ?? 0}
                                      onChange={(v) => updateRawAttr(a, String(v))}
                                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Filter */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <input
                              className="tl-input"
                              placeholder={t('builds.editor.filterStats')}
                              value={statsFilter}
                              onChange={(e) => setStatsFilter(e.target.value)}
                              style={{ width: '100%', fontFamily: 'Inter,sans-serif' }}
                            />
                          </div>

                          {/* Grouped stats */}
                          {filteredGroups.map(([group, keys]) => {
                            // Only show fields present in rawStats OR matching filter
                            const visible = statsFilter
                              ? keys
                              : keys.filter((k) => editData.rawStats?.[k] !== undefined)
                            if (visible.length === 0 && !statsFilter) return null
                            const displayKeys = statsFilter ? keys : visible

                            return (
                              <div key={group}>
                                <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.6rem 0 0.35rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                  {group}
                                  <span style={{ marginLeft: 6, fontWeight: 400, opacity: 0.6 }}>({displayKeys.length})</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '0.4rem' }}>
                                  {displayKeys.map((key) => (
                                    <div key={key}>
                                      <div className="tl-eyebrow" style={{ marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={key}>{key}</div>
                                      <input
                                        className="tl-input"
                                        value={editData.rawStats?.[key] ?? ''}
                                        placeholder="—"
                                        onChange={(e) => updateRawStat(key, e.target.value)}
                                        style={{ fontFamily: 'JetBrains Mono, monospace', color: editData.rawStats?.[key] ? 'inherit' : 'var(--text-muted)' }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}

                          {/* Extra stats not in any predefined group */}
                          {extraStats.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.6rem 0 0.35rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                {t('builds.editor.other')} ({extraStats.length})
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '0.4rem' }}>
                                {extraStats.map((key) => (
                                  <div key={key}>
                                    <div className="tl-eyebrow" style={{ marginBottom: 2 }} title={key}>{key}</div>
                                    <input
                                      className="tl-input"
                                      value={editData.rawStats?.[key] ?? ''}
                                      onChange={(e) => updateRawStat(key, e.target.value)}
                                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          <div style={{ marginTop: '0.75rem' }}>
                            <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{t('builds.editor.notes')}</div>
                            <textarea className="tl-input" style={{ fontFamily: 'Inter,sans-serif', resize: 'vertical', minHeight: 60 }} value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                          </div>
                        </div>
                      )}

                      {/* ── TAB: Calculadora DPS ──────────────────────────── */}
                      {editTab === 'calc' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flex: 1 }}>
                              {t('builds.editor.calc.hint')}
                            </span>
                            {editData.rawStats && (
                              <button
                                className="tl-btn-ghost"
                                onClick={replicateFromQuestlog}
                                style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', background: '#ca8a04', color: '#000', borderColor: '#ca8a04' }}
                                title={t('builds.editor.calc.replicateTitle')}
                              >
                                {t('builds.editor.calc.replicate')}
                              </button>
                            )}
                          </div>
                          {calcGroups.map((group) => (
                            <div key={group}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.75rem 0 0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>{group}</div>
                              {group === 'Ofensivos' && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', fontStyle: 'italic', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                                  {t('builds.weaponHint')}
                                </div>
                              )}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                                {CALC_FIELDS.filter((f) => f.group === group).map((field) => (
                                  <div key={field.key}>
                                    <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{field.label}{field.max !== undefined && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>/ {field.max}</span>}</div>
                                    <NumericInput
                                      className="tl-input"
                                      value={editData.stats[field.key] as number}
                                      max={field.max}
                                      onChange={(v) => updateCalcField(field.key, v)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
