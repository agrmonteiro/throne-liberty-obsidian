import React, { useState, useMemo, useEffect } from 'react'
import { useBuilds } from '../store/useBuilds'
import { calcAverageDPS, critChanceFromStat, heavyChanceFromStat } from '../engine/calculator'
import { DEFAULT_STATS } from '../engine/types'
import type { Build, BuildStats } from '../engine/types'

import { fmt, fmtP } from '../engine/fmt'
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
const CALC_FIELDS: Array<{ key: StatKey; label: string; group: string }> = [
  { key: 'minWeaponDmg',       label: 'Min Weapon Dmg',      group: 'Arma'      },
  { key: 'maxWeaponDmg',       label: 'Max Weapon Dmg',      group: 'Arma'      },
  { key: 'critHitChance',      label: 'Crit Hit Chance',     group: 'Ofensivos' },
  { key: 'heavyAttackChance',  label: 'Heavy Attack Chance', group: 'Ofensivos' },
  { key: 'heavyAttackDmgComp', label: 'Heavy Dmg Compl.',    group: 'Ofensivos' },
  { key: 'critDmgPct',         label: 'Crit Damage %',       group: 'Ofensivos' },
  { key: 'skillDmgBoost',      label: 'Skill Dmg Boost',     group: 'Ofensivos' },
  { key: 'bonusDmg',           label: 'Bonus Damage',        group: 'Ofensivos' },
  { key: 'speciesDmgBoost',    label: 'Species Boost',       group: 'Ofensivos' },
  { key: 'monsterDmgBoostPct', label: 'Monster Dmg Boost %', group: 'Buffs'     },
  { key: 'dmgBuffPct',         label: 'Damage Buff %',       group: 'Buffs'     },
  { key: 'skillBaseDamagePct', label: 'Skill Base Dmg %',    group: 'Skill'     },
  { key: 'skillBonusBaseDmg',  label: 'Skill Bonus Dmg',     group: 'Skill'     },
  { key: 'targetDefense',      label: "Target's Defense",    group: 'Alvo'      },
  { key: 'targetEvasion',      label: "Target's Evasion",    group: 'Alvo'      },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function Builds(): React.ReactElement {
  const { builds, saveBuild, deleteBuild, setActive, activeBuildId,
          importFromFile, importFromUrlPython, exportBuild, createEmpty } = useBuilds()
  const buildList = useMemo(() => Object.values(builds), [builds])

  const statusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const [editId,        setEditId]        = useState<string | null>(null)
  const [editData,      setEditData]      = useState<Build | null>(null)
  const [editTab,       setEditTab]       = useState<'stats' | 'calc'>('stats')
  const [statsFilter,   setStatsFilter]   = useState('')
  const [newName,       setNewName]       = useState('')
  const [newCombo,      setNewCombo]      = useState('')
  const [urlInput,      setUrlInput]      = useState('')
  const [urlLoading,    setUrlLoading]    = useState(false)
  const [status,        setStatus]        = useState<string | null>(null)
  const [statusErr,     setStatusErr]     = useState(false)
  const [pendingImport, setPendingImport] = useState<Build | null>(null)

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
    showStatus('Build salva!', false)
  }

  async function handleImport() {
    showStatus('Importando...', false)
    const build = await importFromFile()
    if (build) showStatus(`Importado: ${build.name}`, false)
    else showStatus('Importação cancelada ou inválida.', true)
  }

  async function handleUrlImport() {
    const url = urlInput.trim()
    if (!url) return

    if (!isValidQuestlogUrl(url)) {
      showStatus('URL inválida — cole o link completo do Questlog (questlog.gg/...character-builder/...)', true)
      return
    }

    setUrlLoading(true)
    const result = await importFromUrlPython(url)
    setUrlLoading(false)

    if ('error' in result) {
      showStatus(result.error, true)
    } else {
      setUrlInput('')
      // Não salva automaticamente — abre painel de confirmação para renomear
      setPendingImport({ ...result })
    }
  }

  async function savePendingImport() {
    if (!pendingImport) return
    await saveBuild(pendingImport)
    setActive(pendingImport.id)
    showStatus(`✅ "${pendingImport.name}" salva!`, false)
    setPendingImport(null)
  }

  function discardPendingImport() {
    setPendingImport(null)
    showStatus('Importação descartada.', false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta build?')) return
    await deleteBuild(id)
    showStatus('Build removida.', false)
  }

  async function handleExport(id: string) {
    await exportBuild(id)
    showStatus('Arquivo exportado!', false)
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const build = createEmpty(name, newCombo.trim())
    await saveBuild(build)
    setActive(build.id)
    setNewName('')
    setNewCombo('')
    showStatus(`Build "${name}" criada.`, false)
  }

  function showStatus(msg: string, isError: boolean) {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    setStatus(msg)
    setStatusErr(isError)
    statusTimerRef.current = setTimeout(() => setStatus(null), 5000)
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
      if (stage === 'starting')   showStatus('⏳ Iniciando scraper...', false)
      if (stage === 'extracting') showStatus('🔍 Extraindo stats...', false)
    })
    return () => window.dataAPI.offProgress?.()
  }, [])

  function updateCalcField(key: StatKey, value: number) {
    if (!editData) return
    setEditData({ ...editData, stats: { ...editData.stats, [key]: value } })
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

  const statusColor  = statusErr ? '#f25f5c' : '#3dd68c'
  const statusBg     = statusErr ? 'rgba(242,95,92,0.1)' : 'rgba(61,214,140,0.1)'
  const statusBorder = statusErr ? 'rgba(242,95,92,0.3)' : 'rgba(61,214,140,0.3)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="tl-hero" style={{ flexShrink: 0 }}>
        <h1>Gerenciar Builds</h1>
        <p>Importe do Questlog via URL, importe JSON, crie e edite builds locais.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.75rem 2rem' }}>
        {/* Status bar */}
        {status && (
          <div style={{ padding: '0.5rem 1rem', background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 6, color: statusColor, fontSize: '0.82rem', marginBottom: '1rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {status}
          </div>
        )}

        {/* ── Pending import confirmation ───────────────────────────── */}
        {pendingImport && (
          <div className="tl-panel" style={{ marginBottom: '1.25rem', border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.05)' }}>
            <div className="tl-eyebrow" style={{ marginBottom: '0.75rem', color: '#d4af37' }}>
              ✅ Build importada — confirme o nome antes de salvar
            </div>

            {/* Save / discard — TOPO */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
              <button
                className="tl-btn"
                onClick={savePendingImport}
                style={{ background: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.5)', color: '#f0cc55' }}
              >
                💾 Salvar build
              </button>
              <button className="tl-btn-ghost" onClick={discardPendingImport}>Descartar</button>
            </div>

            {/* Nome + armas editáveis */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Nome</div>
                <input
                  className="tl-input"
                  style={{ fontFamily: 'Inter,sans-serif' }}
                  value={pendingImport.name}
                  onChange={(e) => setPendingImport({ ...pendingImport, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && savePendingImport()}
                  autoFocus
                />
              </div>
              <div>
                <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Armas (ex: sword+wand)</div>
                <input
                  className="tl-input"
                  style={{ fontFamily: 'Inter,sans-serif' }}
                  placeholder="sword+wand"
                  value={pendingImport.weaponCombo}
                  onChange={(e) => setPendingImport({ ...pendingImport, weaponCombo: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && savePendingImport()}
                />
              </div>
            </div>

            {/* Stats preview */}
            {pendingImport.rawStats && Object.keys(pendingImport.rawStats).length > 0 && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {Object.keys(pendingImport.rawStats).length} stats extraídos
                {pendingImport.sourceUrl && (
                  <span style={{ marginLeft: 8, opacity: 0.6 }}>· {pendingImport.sourceUrl.slice(0, 60)}…</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Questlog URL import */}
        <div className="tl-panel" style={{ marginBottom: '1.25rem' }}>
          <div className="tl-eyebrow" style={{ marginBottom: 8 }}>Importar do Questlog</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="tl-input"
              style={{ flex: 1, fontFamily: 'Inter,sans-serif' }}
              placeholder="https://questlog.gg/throne-and-liberty/en/character-builder/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !urlLoading && handleUrlImport()}
              disabled={urlLoading}
            />
            <button
              className="tl-btn"
              onClick={handleUrlImport}
              disabled={urlLoading || !urlInput.trim()}
              style={{ whiteSpace: 'nowrap', opacity: urlLoading ? 0.6 : 1 }}
            >
              {urlLoading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>

        {/* Other actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
          <button className="tl-btn-ghost" onClick={handleImport}>📂 Importar JSON</button>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Nome</div>
              <input className="tl-input" style={{ width: 180, fontFamily: 'Inter,sans-serif' }} placeholder="Nova build..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div>
              <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Armas (ex: sword+wand)</div>
              <input className="tl-input" style={{ width: 150, fontFamily: 'Inter,sans-serif' }} placeholder="sword+wand" value={newCombo} onChange={(e) => setNewCombo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <button className="tl-btn-ghost" onClick={handleCreate}>+ Criar</button>
          </div>
        </div>

        {buildList.length === 0 ? (
          <div className="tl-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-soft)' }}>
            Nenhuma build salva. Cole uma URL do Questlog acima para começar.
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
                  <div className="tl-card" style={{ borderColor: isActive ? 'var(--border-gold)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Noto Serif, serif', color: '#f0cc55', fontWeight: 700, fontSize: '0.95rem' }}>{b.name}</span>
                          {b.weaponCombo && <span className="tl-tag tl-tag-violet">{b.weaponCombo}</span>}
                          {isActive && <span className="tl-tag tl-tag-gold">ATIVA</span>}
                          {b.editedAt && <span className="tl-tag tl-tag-cyan">editada</span>}
                          {statCount > 0 && (
                            <span className="tl-tag" style={{ background: 'rgba(61,214,140,0.08)', color: '#3dd68c', border: '1px solid rgba(61,214,140,0.2)' }}>
                              {statCount} stats
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-soft)', fontFamily: 'JetBrains Mono, monospace' }}>
                          <span>DPS <b style={{ color: '#f0cc55' }}>{dps > 0 ? fmt(dps) : '—'}</b></span>
                          <span>Crit <b style={{ color: '#d4af37' }}>{fmtP(crit)}</b></span>
                          <span>Heavy <b style={{ color: '#7c5cfc' }}>{fmtP(heavy)}</b></span>
                          {attrCount > 0 && <span style={{ color: 'var(--text-muted)' }}>{attrCount} atributos</span>}
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(b.importedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        {!isActive && <button className="tl-btn-ghost" onClick={() => { setActive(b.id); showStatus(`✅ Build "${b.name}" ativa.`, false) }}>Ativar</button>}
                        <button className="tl-btn-ghost" onClick={() => isEditing ? cancelEdit() : startEdit(b)}>{isEditing ? 'Fechar' : '✏ Editar'}</button>
                        <button className="tl-btn-ghost" onClick={() => handleExport(b.id)}>⬇ Export</button>
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
                        <button className="tl-btn" onClick={saveEdit}>💾 Salvar alterações</button>
                        <button className="tl-btn-ghost" onClick={cancelEdit}>Cancelar</button>
                      </div>

                      {/* Name / combo */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Nome</div>
                          <input className="tl-input" style={{ fontFamily: 'Inter,sans-serif' }} value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        </div>
                        <div>
                          <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Armas</div>
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
                            {tab === 'stats' ? `Stats completos (${Object.keys(editData.rawStats ?? {}).length})` : 'Calculadora DPS'}
                          </button>
                        ))}
                      </div>

                      {/* ── TAB: Stats completos ──────────────────────────── */}
                      {editTab === 'stats' && (
                        <div>
                          {/* Attributes */}
                          {editData.rawAttributes && Object.keys(editData.rawAttributes).length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a992f8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Atributos</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.4rem' }}>
                                {ATTRIBUTE_NAMES.map((a) => (
                                  <div key={a}>
                                    <div className="tl-eyebrow" style={{ marginBottom: 2 }}>{a}</div>
                                    <input
                                      type="number"
                                      className="tl-input"
                                      value={editData.rawAttributes?.[a]?.total ?? ''}
                                      step={1}
                                      onChange={(e) => updateRawAttr(a, e.target.value)}
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
                              placeholder="Filtrar stats..."
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
                                Outros ({extraStats.length})
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
                            <div className="tl-eyebrow" style={{ marginBottom: 3 }}>Notas</div>
                            <textarea className="tl-input" style={{ fontFamily: 'Inter,sans-serif', resize: 'vertical', minHeight: 60 }} value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                          </div>
                        </div>
                      )}

                      {/* ── TAB: Calculadora DPS ──────────────────────────── */}
                      {editTab === 'calc' && (
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            Campos usados pelo motor de cálculo de DPS. Preenchidos automaticamente ao importar.
                          </div>
                          {calcGroups.map((group) => (
                            <div key={group}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.75rem 0 0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>{group}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                                {CALC_FIELDS.filter((f) => f.group === group).map((field) => (
                                  <div key={field.key}>
                                    <div className="tl-eyebrow" style={{ marginBottom: 3 }}>{field.label}</div>
                                    <input type="number" className="tl-input" value={editData.stats[field.key] as number} step={1} onChange={(e) => updateCalcField(field.key, parseFloat(e.target.value) || 0)} />
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
