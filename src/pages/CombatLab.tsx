import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useBuilds } from '../store/useBuilds'
import type { Build, RotationCharacter } from '../engine/types'
import type { LabBuff, LabEffect, LabEvidence, LabOptimization, LabProfile, LabSkill } from '../engine/combatLab'
import { createGauntletDaggerProfile, simulatePriority, optimizePriority, comparePlanWithPull, measureTwoMinuteRun } from '../engine/combatLab'
import { parseAndEnrichLog } from '../engine/logParser'
import { parseBuildOcrText } from '../engine/buildOcr'

type SavedLog = { name: string; content: string }
type Capture = Awaited<ReturnType<typeof window.dataAPI.combatLabCapture>>
const panel: React.CSSProperties = { background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }
const input: React.CSSProperties = { background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 8px', minWidth: 0 }
const button: React.CSSProperties = { background: 'rgba(124,92,252,0.15)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 10px', cursor: 'pointer' }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid var(--border)', fontSize: 12 }
const td: React.CSSProperties = { padding: '7px 6px', borderBottom: '1px solid var(--border)', fontSize: 12 }
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n)

function profileFromBuild(build?: Build): LabProfile {
  const profile = createGauntletDaggerProfile(build?.id ?? 'manual')
  if (!build) return profile
  profile.name = `${build.name} · Manopla + Adaga`
  profile.character = {
    ...profile.character,
    weaponMainDmgMin: build.stats.minWeaponDmg,
    weaponMainDmgMax: build.stats.maxWeaponDmg,
    cdrPct: build.stats.cdrPct,
    attackSpeedPct: build.stats.attackSpeedPct,
    critChanceBase: build.stats.critHitChance,
    heavyChanceBase: build.stats.heavyAttackChance,
    critDmgPct: build.stats.critDmgPct,
    skillDmgBoost: build.stats.skillDmgBoost,
    speciesDmgBoost: build.stats.speciesDmgBoost,
    bonusDamage: build.stats.bonusDmg,
    targetDefense: build.stats.targetDefense,
    targetEndurance: build.stats.targetEndurance,
  }
  return profile
}

function NumberField({ value, onChange, step = 1, min, width = 76 }: { value: number; onChange: (value: number) => void; step?: number; min?: number; width?: number }): React.ReactElement {
  return <input type="number" value={value} min={min} step={step} onChange={e => onChange(Number(e.target.value) || 0)} style={{ ...input, width }} />
}

export function CombatLab(): React.ReactElement {
  const builds = useBuilds(s => s.builds)
  const loadBuilds = useBuilds(s => s.loadFromDisk)
  const [profiles, setProfiles] = useState<Record<string, LabProfile>>({})
  const [ready, setReady] = useState(false)
  const [buildId, setBuildId] = useState('manual')
  const [logs, setLogs] = useState<SavedLog[]>([])
  const [logName, setLogName] = useState('')
  const [pullId, setPullId] = useState(1)
  const [sourceName, setSourceName] = useState('')
  const [gameWindows, setGameWindows] = useState<Array<{ sourceId: string; title: string }>>([])
  const [sourceId, setSourceId] = useState('')
  const [capture, setCapture] = useState<Capture | null>(null)
  const [ocrStart, setOcrStart] = useState<{ x: number; y: number } | null>(null)
  const [ocrArea, setOcrArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null)
  const [evidenceName, setEvidenceName] = useState('')
  const [evidenceKind, setEvidenceKind] = useState<LabEvidence['kind']>('skill')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [optimization, setOptimization] = useState<LabOptimization | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoFile, setVideoFile] = useState<{ name: string; url: string; size: number } | null>(null)
  const [videoFrames, setVideoFrames] = useState<Array<{ atSec: number; thumbnail: string }>>([])
  const [frameInterval, setFrameInterval] = useState(2)
  const [scanProgress, setScanProgress] = useState(0)

  useEffect(() => {
    loadBuilds()
    Promise.all([window.dataAPI.read('combat-lab.json'), window.dataAPI.read('rankingLogs.json')])
      .then(([savedProfiles, savedLogs]) => {
        if (savedProfiles && typeof savedProfiles === 'object' && !Array.isArray(savedProfiles)) setProfiles(savedProfiles as Record<string, LabProfile>)
        if (Array.isArray(savedLogs)) setLogs(savedLogs as SavedLog[])
      }).catch(error => setStatus(`Falha ao carregar dados: ${String(error)}`))
      .finally(() => setReady(true))
  }, [loadBuilds])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => window.dataAPI.write('combat-lab.json', profiles).then(result => {
      if (!result.ok) setStatus(result.error ?? 'Falha ao salvar o laboratório.')
    }), 500)
    return () => clearTimeout(timer)
  }, [profiles, ready])

  const profile = profiles[buildId]
  const currentLog = logs.find(log => log.name === logName)
  const pulls = useMemo(() => currentLog ? parseAndEnrichLog(currentLog.content, currentLog.name) : [], [currentLog])
  const pull = pulls.find(p => p.id === pullId)
  const selectedSource = sourceName || pull?.character || ''
  const pullSources = pull ? [...new Set(pull.events.map(event => event.source))].filter(Boolean).sort() : []
  const plan = useMemo(() => profile ? simulatePriority(profile) : null, [profile])
  const comparison = useMemo(() => plan && profile && pull ? comparePlanWithPull(plan, profile, pull, selectedSource) : null, [plan, profile, pull, selectedSource])
  const currentRun = pull && profile ? measureTwoMinuteRun(pull, buildId, logName, selectedSource) : null
  const allRuns = Object.values(profiles).flatMap(p => p.runs ?? []).filter(run => run.complete)
  const buildRanks = Object.entries(allRuns.reduce<Record<string, { name: string; target: string; count: number; total: number; best: number; first: number; second: number }>>((acc, run) => {
    const key = `${run.buildId}|${run.mainTarget}`
    const entry = acc[key] ?? { name: profiles[run.buildId]?.name ?? run.buildId, target: run.mainTarget, count: 0, total: 0, best: 0, first: 0, second: 0 }
    entry.count++
    entry.total += run.totalDamage
    entry.best = Math.max(entry.best, run.totalDamage)
    entry.first += run.firstMinuteDps
    entry.second += run.secondMinuteDps
    acc[key] = entry
    return acc
  }, {})).map(([id, row]) => ({ id, ...row, average: row.total / row.count })).sort((a, b) => b.average - a.average)

  function ensureProfile(id: string): void {
    setBuildId(id)
    setProfiles(current => current[id] ? current : { ...current, [id]: profileFromBuild(builds[id]) })
  }
  function editProfile(patch: Partial<LabProfile>): void {
    if (!profile) return
    setOptimization(null)
    setProfiles(current => ({ ...current, [buildId]: { ...current[buildId], ...patch, editedAt: new Date().toISOString() } }))
  }
  function editCharacter(key: keyof RotationCharacter, value: number): void {
    if (profile) editProfile({ character: { ...profile.character, [key]: value } })
  }
  function editSkill(id: string, patch: Partial<LabSkill>): void {
    if (profile) editProfile({ skills: profile.skills.map(skill => skill.id === id ? { ...skill, ...patch } : skill) })
  }
  function editBuff(id: string, patch: Partial<LabBuff>): void {
    if (profile) editProfile({ buffs: profile.buffs.map(buff => buff.id === id ? { ...buff, ...patch } : buff) })
  }
  function editEffect(id: string, patch: Partial<LabEffect>): void {
    if (profile) editProfile({ effects: profile.effects.map(effect => effect.id === id ? { ...effect, ...patch } : effect) })
  }
  function proposePriorities(): void {
    if (!profile) return
    const result = optimizePriority(profile)
    setOptimization(result)
    setStatus(result ? 'Prioridades calculadas para 120 s. Compare a projeção e aplique se fizer sentido.' : 'Revise ao menos uma skill de dano e informe o dano máximo das duas armas para otimizar.')
  }
  function applyPriorities(): void {
    if (!profile || !optimization) return
    editProfile({ skills: profile.skills.map(skill => ({ ...skill, priority: optimization.priorities[skill.id] ?? skill.priority })) })
    setStatus('Prioridades propostas aplicadas ao perfil. Valide com um novo log de 2 minutos.')
  }
  async function importLogs(): Promise<void> {
    setBusy(true)
    try {
      const imported = await window.dataAPI.pickLogFiles()
      if (!imported?.length) return
      const next = [...logs]
      for (const log of imported) {
        const index = next.findIndex(item => item.name === log.name)
        if (index >= 0) next[index] = log
        else next.push(log)
      }
      setLogs(next)
      setLogName(imported[0].name)
      setPullId(1); setSourceName('')
      const saved = await window.dataAPI.write('rankingLogs.json', next)
      setStatus(saved.ok ? `${imported.length} log(s) importado(s).` : 'Logs carregados, mas não foi possível salvá-los.')
    } catch (error) { setStatus(`Falha ao importar log: ${String(error)}`) } finally { setBusy(false) }
  }
  function saveRun(): void {
    if (!profile || !currentRun) return
    if (!currentRun.complete) { setStatus('Pull incompleto: para comparar builds, registre ao menos 119 s de luta contínua.'); return }
    const runs = [...(profile.runs ?? []).filter(run => run.id !== currentRun.id), currentRun]
    editProfile({ runs })
    setStatus(`Teste de 2 min salvo para ${profile.name}: ${fmt(currentRun.totalDamage)} de dano.`)
  }
  async function scanWindows(): Promise<void> {
    setBusy(true)
    try {
      const found = await window.dataAPI.combatLabListWindows()
      setGameWindows(found)
      setSourceId(found[0]?.sourceId ?? '')
      setStatus(found.length ? 'Janela do jogo localizada. Abra o painel desejado no jogo e capture o print.' : 'Jogo não encontrado; deixe Throne and Liberty aberto em janela ou sem bordas.')
    } catch (error) { setStatus(`Falha ao localizar o jogo: ${String(error)}`) } finally { setBusy(false) }
  }
  async function takeCapture(): Promise<void> {
    if (!sourceId) return
    setBusy(true)
    try {
      const next = await window.dataAPI.combatLabCapture(sourceId)
      setCapture(next); setOcrStart(null); setOcrArea(null); setOcrText(''); setOcrConfidence(null)
      setStatus(`Captura ${next.width} × ${next.height} salva. Delimite o tooltip para OCR.`)
    } catch (error) { setStatus(`Falha na captura: ${String(error)}`) } finally { setBusy(false) }
  }
  async function readCapture(): Promise<void> {
    if (!capture) return
    setBusy(true)
    try {
      const result = await window.dataAPI.combatLabOcr(capture.imagePath, ocrArea ?? undefined)
      setOcrText(result.text); setOcrConfidence(result.confidence)
      setStatus('OCR concluído. Corrija o texto e associe ao item/skill antes de validar.')
    } catch (error) { setStatus(`Falha no OCR: ${String(error)}`) } finally { setBusy(false) }
  }
  async function pickVideo(): Promise<void> {
    try {
      const picked = await window.dataAPI.combatLabPickVideo()
      if (!picked) return
      setVideoFile(picked); setVideoFrames([]); setScanProgress(0)
      setStatus(`Vídeo ${picked.name} selecionado. Abra cada painel por pelo menos 2 segundos para facilitar a extração.`)
    } catch (error) { setStatus(`Falha ao abrir vídeo: ${String(error)}`) }
  }
  async function seekVideo(video: HTMLVideoElement, atSec: number): Promise<void> {
    if (Math.abs(video.currentTime - atSec) < 0.04 && video.readyState >= 2) return
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); reject(new Error('Tempo esgotado ao ler quadro.')) }, 10000)
      const cleanup = () => { clearTimeout(timer); video.removeEventListener('seeked', done); video.removeEventListener('error', fail) }
      const done = () => { cleanup(); resolve() }
      const fail = () => { cleanup(); reject(new Error('Não foi possível decodificar o vídeo.')) }
      video.addEventListener('seeked', done, { once: true })
      video.addEventListener('error', fail, { once: true })
      video.currentTime = atSec
    })
  }
  async function scanVideo(): Promise<void> {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) { setStatus('Aguarde o carregamento do vídeo.'); return }
    setBusy(true); setVideoFrames([]); setScanProgress(0)
    try {
      video.pause()
      const interval = Math.max(1, Math.min(10, frameInterval || 2))
      const count = Math.min(180, Math.ceil(video.duration / interval))
      const canvas = document.createElement('canvas')
      canvas.width = 320; canvas.height = Math.max(1, Math.round(320 * video.videoHeight / video.videoWidth))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas indisponível.')
      const found: Array<{ atSec: number; thumbnail: string }> = []
      for (let i = 0; i < count; i++) {
        const atSec = Math.min(video.duration - 0.05, i * interval + 0.25)
        await seekVideo(video, atSec)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        found.push({ atSec, thumbnail: canvas.toDataURL('image/jpeg', 0.7) })
        setScanProgress(Math.round((i + 1) / count * 100))
      }
      setVideoFrames(found)
      setStatus(`${found.length} quadros amostrados. Escolha os que mostram cada item, skill ou maestria e salve o quadro para OCR.`)
    } catch (error) { setStatus(`Falha ao extrair quadros: ${String(error)}`) } finally { setBusy(false) }
  }
  async function useVideoFrame(): Promise<void> {
    const video = videoRef.current
    if (!video || !videoFile || !video.videoWidth) return
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth; canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas indisponível.')
      ctx.drawImage(video, 0, 0)
      const next = await window.dataAPI.combatLabSaveFrame(canvas.toDataURL('image/png'), videoFile.name, video.currentTime)
      setCapture(next); setOcrStart(null); setOcrArea(null); setOcrText(''); setOcrConfidence(null)
      setStatus(`Quadro de ${video.currentTime.toFixed(1)} s salvo. Delimite o tooltip para OCR e associe a evidência.`)
    } catch (error) { setStatus(`Falha ao guardar quadro: ${String(error)}`) } finally { setBusy(false) }
  }
  function saveEvidence(): void {
    if (!profile || !capture || !evidenceName.trim() || !ocrText.trim()) { setStatus('Informe nome e texto OCR antes de guardar a evidência.'); return }
    const evidence: LabEvidence = {
      id: `ev_${Date.now()}`, kind: evidenceKind, name: evidenceName.trim(), source: capture.sourceId === 'video' ? 'video' : 'screenshot',
      status: 'pending', text: ocrText.trim(), imagePath: capture.imagePath, videoName: capture.videoName, videoAtSec: capture.videoAtSec, capturedAt: new Date().toISOString(),
    }
    editProfile({ evidence: [...profile.evidence, evidence] })
    setStatus('Evidência anexada como pendente. Revise os valores antes de aplicá-los ao cálculo.')
  }
  function applyOcrStats(): void {
    if (!profile || !ocrText) return
    if (!capture || !profile.evidence.some(item => item.imagePath === capture.imagePath && (item.kind === 'stats' || item.kind === 'substats') && item.status === 'reviewed')) {
      setStatus('Anexe este quadro como stats ou substats e marque a evidência como revisada antes de aplicar números.')
      return
    }
    const result = parseBuildOcrText(ocrText, capture?.imagePath ?? 'captura.png')
    const patch = result.statsPatch
    if (!result.recognizedFields) { setStatus('O OCR não identificou atributos da build neste print.'); return }
    editProfile({ character: {
      ...profile.character,
      ...(patch.minWeaponDmg ? { weaponMainDmgMin: patch.minWeaponDmg } : {}),
      ...(patch.maxWeaponDmg ? { weaponMainDmgMax: patch.maxWeaponDmg } : {}),
      ...(patch.cdrPct ? { cdrPct: patch.cdrPct } : {}),
      ...(patch.attackSpeedPct ? { attackSpeedPct: patch.attackSpeedPct } : {}),
      ...(patch.critHitChance ? { critChanceBase: patch.critHitChance } : {}),
      ...(patch.heavyAttackChance ? { heavyChanceBase: patch.heavyAttackChance } : {}),
    } })
    setStatus(`${result.recognizedFields} campo(s) encontrados; confira todos os números aplicados.`)
  }

  return <div style={{ overflowY: 'auto', height: '100%', padding: '28px 30px', color: 'var(--text)' }}>
    <div style={{ maxWidth: 1460, margin: '0 auto' }}>
      <div style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Análise · Manopla + Adaga</div>
      <h1 style={{ margin: '6px 0 5px', fontFamily: 'Noto Serif, serif', fontSize: 27 }}>Laboratório de combate</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0, maxWidth: 940 }}>Compare dano acumulado em 2 minutos, DPS de cada minuto e a prioridade planejada. Dados de prints e buffs só entram na previsão depois de revisados.</p>
      {status && <div role="status" style={{ ...panel, borderColor: 'var(--gold)', color: 'var(--gold-l)' }}>{status}</div>}

      <section style={panel}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>1. Build e parâmetros</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <label>Build<br /><select value={buildId} onChange={e => ensureProfile(e.target.value)} style={input}><option value="manual">Perfil manual</option>{Object.values(builds).map(build => <option key={build.id} value={build.id}>{build.name}</option>)}</select></label>
          {!profile && <button style={button} onClick={() => ensureProfile(buildId)}>Criar catálogo desta build</button>}
          {profile && <><label>Latência (ms)<br /><NumberField value={profile.latencyMs} min={50} onChange={latencyMs => editProfile({ latencyMs })} /></label>
            <label>Falha de pressão (%)<br /><NumberField value={profile.pressFailurePct} min={0} onChange={pressFailurePct => editProfile({ pressFailurePct })} /></label>
            <label>Repetições prioridade alta<br /><NumberField value={profile.highPriorityRepeats} min={1} onChange={highPriorityRepeats => editProfile({ highPriorityRepeats })} /></label>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Critério fixo: primeiros 120 s de combate · relação inicial 5:1</span></>}
        </div>
        {profile && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {([['weaponMainDmgMin', 'Manopla mín.'], ['weaponMainDmgMax', 'Manopla máx.'], ['weaponOffDmgMin', 'Adaga mín.'], ['weaponOffDmgMax', 'Adaga máx.'], ['cdrPct', 'Recarga %'], ['attackSpeedPct', 'Veloc. ataque %'], ['advDurPct', 'Duração vantagem %'], ['critChanceBase', 'Crítico'], ['critChanceBoss', 'Crítico chefe'], ['critDmgPct', 'Dano crítico %'], ['heavyChanceBase', 'Pesado'], ['heavyChanceBoss', 'Pesado chefe'], ['heavyDmgPct', 'Dano pesado %'], ['skillDmgBoost', 'Bônus skill'], ['speciesDmgBoost', 'Bônus monstro'], ['bonusDamage', 'Dano bônus'], ['targetDefense', 'Defesa alvo'], ['targetEndurance', 'Tolerância alvo']] as Array<[keyof RotationCharacter, string]>).map(([key, label]) => <label key={key} style={{ fontSize: 11 }}>{label}<br /><NumberField value={profile.character[key] as number} onChange={value => editCharacter(key, value)} /></label>)}
        </div>}
      </section>

      {profile && <><section style={panel}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>2. Catálogo de skills e buffs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Os valores iniciais vieram de prints anteriores e ficam pendentes. Marque “revisto” apenas após conferir a skill atual no jogo.</p>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1120 }}><thead><tr>{['Usar','Tecla','Skill','Especialização / evolução','Arma','CD s','Ação ms','Dano %','Flat','Hits','Prioridade','Revisto','Plano 120 s'].map(x => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>
          {profile.skills.map(skill => <tr key={skill.id}><td style={td}><input type="checkbox" checked={skill.enabled} onChange={e => editSkill(skill.id, { enabled: e.target.checked })} /></td><td style={td}>{skill.key}</td><td style={td}>{skill.name}</td><td style={td}><input value={skill.specialization ?? ''} onChange={e => editSkill(skill.id, { specialization: e.target.value })} placeholder="Ex.: dano em área" style={{ ...input, width: 170 }} /></td><td style={td}>{skill.weapon === 'main' ? 'Manopla' : 'Adaga'}</td>
            <td style={td}><NumberField value={skill.cooldownSec} step={0.1} min={0} width={65} onChange={cooldownSec => editSkill(skill.id, { cooldownSec })} /></td>
            <td style={td}><NumberField value={skill.actionMs} min={100} width={70} onChange={actionMs => editSkill(skill.id, { actionMs })} /></td>
            <td style={td}><NumberField value={skill.damagePct} min={0} width={70} onChange={damagePct => editSkill(skill.id, { damagePct })} /></td>
            <td style={td}><NumberField value={skill.flatDamage} min={0} width={65} onChange={flatDamage => editSkill(skill.id, { flatDamage })} /></td>
            <td style={td}><NumberField value={skill.hits} min={1} width={55} onChange={hits => editSkill(skill.id, { hits })} /></td>
            <td style={td}><select value={skill.priority} onChange={e => editSkill(skill.id, { priority: Number(e.target.value) as LabSkill['priority'] })} style={input}>{[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}</select></td>
            <td style={td}><input type="checkbox" checked={skill.reviewed} onChange={e => editSkill(skill.id, { reviewed: e.target.checked })} /></td>
            <td style={td}>{fmt(plan?.skills.find(row => row.id === skill.id)?.damage ?? 0)}</td></tr>)}
        </tbody></table></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}><button style={button} onClick={proposePriorities}>Buscar prioridades para 120 s</button>{optimization && <><span style={{ fontSize: 12 }}>Atual: {fmt(optimization.baseline.totalDamage)} · proposta: {fmt(optimization.proposed.totalDamage)} (+{fmt(optimization.proposed.totalDamage - optimization.baseline.totalDamage)})</span><button style={button} onClick={applyPriorities}>Aplicar proposta</button></>}</div>
        {optimization && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Proposta: {profile.skills.filter(skill => skill.enabled).map(skill => `${skill.name} ${skill.priority}→${optimization.priorities[skill.id]}`).join(' · ')}. Resultado é estimado; confirme com o log.</p>}
        <h3 style={{ fontSize: 14, marginBottom: 6 }}>Buffs ativos</h3>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 910 }}><thead><tr>{['Usar','Tecla','Buff','CD s','Duração s','Dano %','Base +','Veloc. ataque %','Recarga %','Prioridade','Revisto','Uptime plano'].map(x => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{profile.buffs.map(buff => <tr key={buff.id}>
          <td style={td}><input type="checkbox" checked={buff.enabled} onChange={e => editBuff(buff.id, { enabled: e.target.checked })} /></td><td style={td}>{buff.key}</td><td style={td}>{buff.name}</td>
          <td style={td}><NumberField value={buff.cooldownSec} step={0.1} width={65} onChange={cooldownSec => editBuff(buff.id, { cooldownSec })} /></td>
          <td style={td}><NumberField value={buff.durationSec} step={0.1} width={65} onChange={durationSec => editBuff(buff.id, { durationSec })} /></td>
          <td style={td}><NumberField value={buff.damagePct} step={0.1} width={65} onChange={damagePct => editBuff(buff.id, { damagePct })} /></td>
          <td style={td}><NumberField value={buff.baseDamageFlat ?? 0} step={1} width={65} onChange={baseDamageFlat => editBuff(buff.id, { baseDamageFlat })} /></td>
          <td style={td}><NumberField value={buff.attackSpeedPct} step={0.1} width={65} onChange={attackSpeedPct => editBuff(buff.id, { attackSpeedPct })} /></td>
          <td style={td}><NumberField value={buff.cooldownSpeedPct} step={0.1} width={65} onChange={cooldownSpeedPct => editBuff(buff.id, { cooldownSpeedPct })} /></td>
          <td style={td}><select value={buff.priority} onChange={e => editBuff(buff.id, { priority: Number(e.target.value) as LabBuff['priority'] })} style={input}>{[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}</select></td>
          <td style={td}><input type="checkbox" checked={buff.reviewed} onChange={e => editBuff(buff.id, { reviewed: e.target.checked })} /></td>
          <td style={td}>{(plan?.buffUptimePct[buff.id] ?? 0).toFixed(1)}%</td>
        </tr>)}</tbody></table></div>
      </section>

      <section style={panel}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>3. Armas, itens, passivas e maestrias</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Registre o efeito item a item. Só um bônus percentual confirmado entra na simulação; procs condicionais permanecem anotados até termos a regra e as ativações.</p>
        {profile.effects.map(effect => <div key={effect.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'end', marginBottom: 8 }}>
          <select value={effect.kind} onChange={e => editEffect(effect.id, { kind: e.target.value as LabEffect['kind'] })} style={input}>{['weapon','core','item','passive','mastery'].map(kind => <option key={kind}>{kind}</option>)}</select>
          <input value={effect.slot ?? ''} onChange={e => editEffect(effect.id, { slot: e.target.value })} placeholder="Slot / peça" style={{ ...input, width: 115 }} />
          <input value={effect.name} onChange={e => editEffect(effect.id, { name: e.target.value })} style={input} />
          <input value={effect.description} onChange={e => editEffect(effect.id, { description: e.target.value })} style={{ ...input, flex: '1 1 250px' }} />
          <label style={{ fontSize: 11 }}>Dano %<NumberField value={effect.damagePct} step={0.1} onChange={damagePct => editEffect(effect.id, { damagePct })} /></label>
          <label style={{ fontSize: 11 }}>Recarga %<NumberField value={effect.cooldownSpeedPct} step={0.1} onChange={cooldownSpeedPct => editEffect(effect.id, { cooldownSpeedPct })} /></label>
          <label style={{ fontSize: 11 }}>Vantagem %<NumberField value={effect.advantageDurationPct} step={0.1} onChange={advantageDurationPct => editEffect(effect.id, { advantageDurationPct })} /></label>
          <label style={{ fontSize: 11 }}><input type="checkbox" checked={effect.reviewed} onChange={e => editEffect(effect.id, { reviewed: e.target.checked })} /> Revisto</label>
        </div>)}
        <button style={button} onClick={() => editProfile({ effects: [...profile.effects, { id: `effect_${Date.now()}`, name: 'Novo efeito', kind: 'item', description: '', damagePct: 0, cooldownSpeedPct: 0, advantageDurationPct: 0, reviewed: false, source: 'manual' }] })}>+ Item, passiva ou maestria</button>
      </section>

      <section style={panel}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>4. Captura guiada do jogo ou vídeo</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Importe um vídeo ou capture uma tela do jogo. Delimite o tooltip com dois cliques no print; OCR e valores ficam pendentes até revisão.</p>
        <details style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 6, padding: 10 }} open>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Roteiro do vídeo de coleta</summary>
          <ol style={{ fontSize: 12, lineHeight: 1.7, marginBottom: 0 }}>
            <li>Mostre o nome da build e as duas armas. Abra o tooltip de cada arma e de cada núcleo equipado.</li>
            <li>Passe pelos demais itens equipados, um por vez, exibindo atributos, traços e efeitos.</li>
            <li>Abra cada skill da barra, depois sua evolução e especializações ativas.</li>
            <li>Abra as passivas e as árvores de maestria, incluindo pontos alocados e efeitos.</li>
            <li>Mostre atributos totais, status de combate, substatus, bônus e duração de vantagem.</li>
            <li>Mantenha cada tooltip inteiro parado por 3 s. Grave na resolução nativa e evite mover o mouse sobre texto.</li>
          </ol>
        </details>
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><button style={button} disabled={busy} onClick={pickVideo}>Abrir vídeo da build</button>
            {videoFile && <><span style={{ fontSize: 12 }}>{videoFile.name} · {(videoFile.size / 1048576).toFixed(0)} MB</span><label style={{ fontSize: 12 }}>Intervalo entre quadros (s) <NumberField value={frameInterval} min={1} width={58} onChange={setFrameInterval} /></label><button style={button} disabled={busy} onClick={scanVideo}>Extrair quadros</button><button style={button} disabled={busy} onClick={useVideoFrame}>Usar quadro atual</button>{busy && scanProgress > 0 && <span>{scanProgress}%</span>}</>}
          </div>
          {videoFile && <video key={videoFile.url} ref={videoRef} src={videoFile.url} controls preload="metadata" style={{ display: 'block', width: '100%', maxWidth: 720, marginTop: 10 }} />}
          {videoFrames.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7, maxHeight: 300, overflowY: 'auto', marginTop: 10 }}>{videoFrames.map(frame => <button key={frame.atSec} onClick={async () => { if (videoRef.current) await seekVideo(videoRef.current, frame.atSec) }} style={{ ...button, padding: 3, textAlign: 'left' }}><img src={frame.thumbnail} alt={`Quadro ${frame.atSec.toFixed(1)} s`} style={{ width: '100%', display: 'block' }} /><span style={{ fontSize: 11 }}>{frame.atSec.toFixed(1)} s</span></button>)}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <button style={button} disabled={busy} onClick={scanWindows}>Detectar janela</button>
          <select style={input} value={sourceId} onChange={e => setSourceId(e.target.value)}>{!sourceId && <option value="">Selecione o jogo</option>}{gameWindows.map(win => <option key={win.sourceId} value={win.sourceId}>{win.title}</option>)}</select>
          <button style={button} disabled={busy || !sourceId} onClick={takeCapture}>Capturar print</button>
          <button style={button} disabled={busy || !capture} onClick={readCapture}>Ler OCR</button>
          <span style={{ fontSize: 12 }}>{ocrArea ? 'Área OCR pronta' : ocrStart ? 'Clique no canto inferior direito' : 'Clique no canto superior esquerdo'}</span>
        </div>
        {capture && <div style={{ position: 'relative', maxWidth: 900, border: '1px solid var(--border)' }}>
          <img src={capture.imageDataUrl} alt="Captura da janela do jogo" onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const selected = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
            if (!ocrStart) { setOcrStart(selected); setOcrArea(null) }
            else {
              setOcrArea({ x: Math.min(ocrStart.x, selected.x), y: Math.min(ocrStart.y, selected.y), width: Math.abs(ocrStart.x - selected.x), height: Math.abs(ocrStart.y - selected.y) })
              setOcrStart(null)
            }
          }} style={{ width: '100%', display: 'block', cursor: 'crosshair' }} />
          {ocrArea && <div style={{ position: 'absolute', left: `${ocrArea.x * 100}%`, top: `${ocrArea.y * 100}%`, width: `${ocrArea.width * 100}%`, height: `${ocrArea.height * 100}%`, border: '2px solid #55d5ff', background: 'rgba(85,213,255,.12)', pointerEvents: 'none' }} />}
        </div>}
        {capture && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Print: {capture.width} × {capture.height} · janela: {capture.bounds.right - capture.bounds.left} × {capture.bounds.bottom - capture.bounds.top}</p>}
        {capture && <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) minmax(220px, 1fr)', gap: 12 }}>
          <textarea value={ocrText} onChange={e => setOcrText(e.target.value)} placeholder="Texto OCR revisável" rows={9} style={{ ...input, width: '100%', resize: 'vertical' }} />
          <div><div style={{ marginBottom: 8 }}>Confiança OCR: {ocrConfidence == null ? '—' : `${ocrConfidence.toFixed(0)}%`}</div>
            <select value={evidenceKind} onChange={e => setEvidenceKind(e.target.value as LabEvidence['kind'])} style={{ ...input, width: '100%', marginBottom: 8 }}>{['weapon','core','item','skill','specialization','buff','passive','mastery','stats','substats'].map(kind => <option key={kind}>{kind}</option>)}</select>
            <input value={evidenceName} onChange={e => setEvidenceName(e.target.value)} placeholder="Nome do item ou habilidade" style={{ ...input, width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button style={button} onClick={saveEvidence}>Anexar evidência</button><button style={button} onClick={applyOcrStats}>Aplicar atributos identificados</button></div>
          </div>
        </div>}
        {profile.evidence.length > 0 && <div style={{ marginTop: 12 }}>{profile.evidence.map(evidence => <div key={evidence.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 5, borderBottom: '1px solid var(--border)', fontSize: 12 }}><span>{evidence.kind} · {evidence.name}</span><span style={{ color: 'var(--text-muted)' }}>{evidence.videoName ? `${evidence.videoName} · ${evidence.videoAtSec?.toFixed(1)} s` : evidence.source}</span><label style={{ marginLeft: 'auto' }}><input type="checkbox" checked={evidence.status === 'reviewed'} onChange={event => editProfile({ evidence: profile.evidence.map(item => item.id === evidence.id ? { ...item, status: event.target.checked ? 'reviewed' : 'pending' } : item) })} /> Revisado</label></div>)}</div>}
      </section>

      <section style={panel}>
        <h2 style={{ marginTop: 0, fontSize: 17 }}>5. Plano × log observado</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><button style={button} disabled={busy} onClick={importLogs}>Importar log</button>
          <select value={logName} onChange={e => { setLogName(e.target.value); setPullId(1); setSourceName('') }} style={input}><option value="">Escolha um log</option>{logs.map(log => <option key={log.name} value={log.name}>{log.name}</option>)}</select>
          <select value={pullId} onChange={e => { setPullId(Number(e.target.value)); setSourceName('') }} style={input}>{pulls.map(p => <option key={p.id} value={p.id}>Pull {p.id} · {p.character} → {p.mainTarget} · {(p.durationMs / 1000).toFixed(1)} s</option>)}</select>
          {pull && <label style={{ fontSize: 12 }}>Personagem<br /><select value={selectedSource} onChange={e => setSourceName(e.target.value)} style={input}>{pullSources.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
          <button style={button} disabled={!currentRun?.complete} onClick={saveRun}>Salvar teste de 2 min</button>
        </div>
        {plan && <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14, fontSize: 14 }}><span>Planejado: <b>{fmt(plan.totalDamage)}</b> dano / {fmt(plan.dps)} DPS</span>{currentRun && <><span>Log 0–60 s: <b>{fmt(currentRun.firstMinuteDamage)}</b> · {fmt(currentRun.firstMinuteDps)} DPS</span><span>Log 60–120 s: <b>{fmt(currentRun.secondMinuteDamage)}</b> · {fmt(currentRun.secondMinuteDps)} DPS</span><span>Total: <b>{fmt(currentRun.totalDamage)}</b>{!currentRun.complete && ' · incompleto'}</span></>}</div>}
        {plan && plan.pendingEvidence.length > 0 && <p style={{ color: 'var(--gold-l)', fontSize: 12 }}>Previsão provisória: {plan.pendingEvidence.length} dados pendentes ({plan.pendingEvidence.slice(0, 5).join(', ')}{plan.pendingEvidence.length > 5 ? '…' : ''}). Dano de skills sem parâmetros revisados permanece zero no plano.</p>}
        {comparison && <div style={{ overflowX: 'auto', marginTop: 12 }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Skill','Tentativas','Casts plano','Falhas input','Em CD/animação','DPS plano','Hits log','DPS log','Diferença'].map(x => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{comparison.rows.map(row => <tr key={row.id}><td style={td}>{row.name}</td><td style={td}>{row.attempts}</td><td style={td}>{row.casts}</td><td style={td}>{row.failedInput}</td><td style={td}>{row.cooldownMisses}</td><td style={td}>{fmt(row.dps)}</td><td style={td}>{row.observedHits}</td><td style={td}>{fmt(row.observedDps)}</td><td style={td}>{fmt(row.deltaDps)}</td></tr>)}</tbody></table><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Dano do log sem correspondência com skills do perfil: {fmt(comparison.unassignedDamage)}. Inclui ataques básicos, itens, maestrias e DoTs; não é automaticamente “perda” da rotação.</p></div>}
      </section></>}

      <section style={panel}><h2 style={{ marginTop: 0, fontSize: 17 }}>Evolução entre builds · mesmo alvo, 120 s</h2>
        {buildRanks.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{['Build','Alvo','Testes','DPS médio 1º min','DPS médio 2º min','Dano médio 120 s','Melhor dano 120 s'].map(x => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{buildRanks.map(row => <tr key={row.id}><td style={td}>{row.name}</td><td style={td}>{row.target}</td><td style={td}>{row.count}</td><td style={td}>{fmt(row.first / row.count)}</td><td style={td}>{fmt(row.second / row.count)}</td><td style={td}><b>{fmt(row.average)}</b></td><td style={td}>{fmt(row.best)}</td></tr>)}</tbody></table></div> : <p style={{ color: 'var(--text-muted)' }}>Salve um pull contínuo de 2 minutos por build para iniciar a comparação.</p>}
      </section>
    </div>
  </div>
}
