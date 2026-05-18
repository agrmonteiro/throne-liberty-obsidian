import React, { useEffect, useState } from 'react'
import { useSettings, Theme } from '../store/useSettings'
import { useLocale } from '../store/useLocale'
import { useT } from '../i18n/useT'
import type { Lang } from '../i18n/translations'
import { detectTier, type UiScalePref } from '../hooks/useAutoScale'

interface ScraperStatus {
  scraperFound: boolean
  scraperPath: string | null
  pythonOk: boolean
  pythonVersion: string
}

interface ThemeOption {
  id:       Theme
  label:    string
  desc:     string
  swatches: string[]
}

const THEMES: ThemeOption[] = [
  { id: 'dark',         label: 'Obsidian',     desc: 'Dark padrão — fundo preto, ouro e violeta',   swatches: ['#0b0c0e','#d4af37','#7c5cfc','#00d4ff'] },
  { id: 'light',        label: 'Light',         desc: 'Claro — fundos brancos, ouro escuro',         swatches: ['#f0f2f6','#a07a00','#5040bb','#0080a8'] },
  { id: 'blood-dragon', label: 'Blood Dragon',  desc: 'Crimson — tema da guilda Tier2',              swatches: ['#0d0405','#e8a020','#c0392b','#ff6b35'] },
  { id: 'arcane',       label: 'Arcane',        desc: 'Violeta profundo + ciano elétrico',           swatches: ['#06040f','#a06aff','#00c8f0','#ff70d0'] },
  { id: 'emerald',      label: 'Emerald',       desc: 'Verde floresta — ranger/druid',               swatches: ['#020d06','#2ecc71','#f0cc55','#00c8a0'] },
  { id: 'abyssal',      label: 'Abyssal',       desc: 'Azul marinho + ciano — mago aquático',        swatches: ['#02080f','#00c8ff','#7b68ee','#00ffcc'] },
  { id: 'ember',        label: 'Ember',         desc: 'Laranja quente — guerreiro corpo a corpo',    swatches: ['#0e0800','#ff8c42','#e74c3c','#f5a623'] },
  { id: 'frost',        label: 'Frost',         desc: 'Azul gelo — mago de gelo',                   swatches: ['#030810','#60b8ff','#0870cc','#c0e8ff'] },
  { id: 'shadow',       label: 'Shadow',        desc: 'Monocromático — assassino furtivo',           swatches: ['#080808','#b8b8b8','#888888','#4caf50'] },
  { id: 'royal',        label: 'Royal',         desc: 'Índigo + ouro — paladino/comandante',         swatches: ['#060412','#d4af37','#9040c0','#4090e0'] },
]

export function Settings(): React.ReactElement {
  const { theme, fontSize, uiScale, setTheme, setFontSize, setUiScale } = useSettings()
  const { lang, setLang } = useLocale()
  const t = useT()
  const detected = detectTier()

  const [scraper,       setScraper]       = useState<ScraperStatus | null>(null)
  const [detecting,     setDetecting]     = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [reinstalling,  setReinstalling]  = useState(false)
  const [reinstallMsg,  setReinstallMsg]  = useState<{ ok: boolean; text: string } | null>(null)
  const [reportNote,    setReportNote]    = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [reportResult,  setReportResult]  = useState<{ ok: boolean } | null>(null)

  useEffect(() => { runDetect() }, [])

  async function runDetect() {
    setDetecting(true)
    try {
      const result = await window.dataAPI.scraperDetect()
      setScraper(result as ScraperStatus)
    } finally {
      setDetecting(false)
    }
  }

  async function reinstallPlaywright() {
    setReinstalling(true); setReinstallMsg(null)
    try {
      const res = await (window.dataAPI as any).scraperReinstallPlaywright() as { ok: boolean; error?: string }
      setReinstallMsg({ ok: res.ok, text: res.ok ? t('settings.scraper.playwright.success') : (res.error ?? 'Erro desconhecido') })
      if (res.ok) await runDetect()
    } finally { setReinstalling(false) }
  }

  async function pickFile() {
    const picked = await window.dataAPI.scraperPickFile()
    if (picked) { setSaved(true); setTimeout(() => setSaved(false), 2000); await runDetect() }
  }

  async function handleSendReport() {
    setReportSending(true); setReportResult(null)
    try {
      const res = await (window.dataAPI as any).sendReport(reportNote.trim()) as { ok: boolean; error?: string }
      setReportResult({ ok: res.ok })
      if (res.ok) setReportNote('')
    } catch { setReportResult({ ok: false }) }
    finally {
      setReportSending(false)
      setTimeout(() => setReportResult(null), 6000)
    }
  }

  const ok = scraper?.scraperFound

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '2rem' }}>
      <div className="tl-hero" style={{ padding: 0, borderBottom: 'none', marginBottom: '2rem' }}>
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 1040 }}>

        {/* ── Scraper ─────────────────────────────────────────────────── */}
        <section className="tl-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>{t('settings.scraper.title')}</h2>
            {detecting
              ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{t('settings.scraper.checking')}</span>
              : ok
              ? <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>{t('settings.scraper.configured')}</span>
              : <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{t('settings.scraper.notConfigured')}</span>
            }
          </div>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: '1.25rem' }}>{t('settings.scraper.description')}</p>

          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '1rem', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
            <div className="tl-eyebrow" style={{ marginBottom: 6 }}>{t('settings.scraper.script.label')}</div>
            {scraper?.scraperFound ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 'var(--fs-base)' }}>{t('settings.scraper.script.found')}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all', fontFamily: 'monospace' }}>{scraper.scraperPath}</div>
                </div>
                <div>
                  <button onClick={reinstallPlaywright} disabled={reinstalling} className="tl-btn-ghost" style={{ fontSize: 'var(--fs-xs)', whiteSpace: 'nowrap' }}>
                    {reinstalling ? t('settings.scraper.playwright.reinstalling') : t('settings.scraper.playwright.reinstall')}
                  </button>
                  {reinstallMsg && <div style={{ marginTop: 6, fontSize: 'var(--fs-xs)', color: reinstallMsg.ok ? '#4ade80' : '#f87171' }}>{reinstallMsg.text}</div>}
                </div>
              </div>
            ) : (
              <>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: 'var(--fs-base)' }}>{t('settings.scraper.script.notFound')}</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 2 }}>{t('settings.scraper.script.hint')}</div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={runDetect} disabled={detecting} className="tl-btn-ghost" style={{ opacity: detecting ? 0.5 : 1 }}>
              {detecting ? t('settings.scraper.autoDetecting') : t('settings.scraper.autoDetect')}
            </button>
            <button onClick={pickFile} style={{ padding: '0.55rem 1.2rem', borderRadius: 6, border: '1px solid var(--gold)', background: 'rgba(212,175,55,0.08)', color: 'var(--gold)', cursor: 'pointer', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
              {t('settings.scraper.selectFile')}
            </button>
            {saved && <span style={{ color: '#4ade80', fontSize: 'var(--fs-sm)', alignSelf: 'center' }}>{t('settings.scraper.saved')}</span>}
          </div>

          {!ok && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 8, background: 'rgba(212,175,55,0.05)', border: '1px dashed rgba(212,175,55,0.3)' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>{t('settings.scraper.howToSetup')}</div>
              <ol style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                <li>{t('settings.scraper.setup.step1')}</li>
                <li>{t('settings.scraper.setup.step2')}</li>
                <li>{t('settings.scraper.setup.step3')}</li>
              </ol>
            </div>
          )}
        </section>

        {/* ── Tema Visual — 10 opções ──────────────────────────────────── */}
        <section className="tl-panel" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: '0.4rem' }}>{t('settings.themeSection.title')}</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: '1.25rem' }}>
            Escolha entre os 10 temas do sistema Obsidian Command. Aplicado imediatamente.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
            {THEMES.map((opt) => {
              const isActive = theme === opt.id
              return (
                <button key={opt.id} onClick={() => setTheme(opt.id)} style={{
                  padding: '0.85rem 0.75rem', borderRadius: 8, border: '2px solid',
                  borderColor: isActive ? 'var(--gold)' : 'var(--border)',
                  background: isActive ? 'rgba(212,175,55,0.07)' : 'rgba(0,0,0,0.15)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                }}>
                  {/* Palette strip */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                    {opt.swatches.map((c) => (
                      <div key={c} style={{ flex: 1, height: 10, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: isActive ? 'var(--gold-l)' : 'var(--text)', marginBottom: 3 }}>
                    {opt.label}{isActive && <span style={{ marginLeft: 6, fontSize: 'var(--fs-xs)', opacity: 0.8 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Language ─────────────────────────────────────────────────── */}
        <section className="tl-panel">
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: '0.4rem' }}>{t('settings.languageLabel')}</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: '1.25rem' }}>{t('settings.language')}</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['pt-BR', 'en'] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                flex: 1, padding: '1.25rem', borderRadius: 8, border: '2px solid',
                borderColor: lang === l ? 'var(--gold)' : 'var(--border)',
                background: lang === l ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{l === 'pt-BR' ? '🇧🇷' : '🇺🇸'}</div>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: lang === l ? 'var(--gold)' : 'var(--text-soft)' }}>
                  {l === 'pt-BR' ? 'Português (pt-BR)' : 'English (en)'}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── UI Scale ─────────────────────────────────────────────────── */}
        <section className="tl-panel">
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: '0.4rem' }}>{t('settings.uiScale.title')}</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: '1.25rem' }}>{t('settings.uiScale.description')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {([
              { key: 'auto', label: t('settings.uiScale.auto'),    sub: `${t('settings.uiScale.detected')} ${detected.toUpperCase()}`, icon: '🎯' },
              { key: 'fhd',  label: t('settings.uiScale.fullHd'),  sub: '1920 × 1080',  icon: '💻' },
              { key: 'qhd',  label: t('settings.uiScale.qhd'),     sub: '~2240–2559',   icon: '🖥️' },
              { key: 'qhd+', label: t('settings.uiScale.qhdPlus'), sub: '2560 × 1440',  icon: '🖥️' },
              { key: '4k',   label: t('settings.uiScale.fourK'),   sub: '3840 × 2160',  icon: '🖼️' },
            ] as Array<{ key: UiScalePref; label: string; sub: string; icon: string }>).map((opt) => {
              const active = uiScale === opt.key
              return (
                <button key={opt.key} onClick={() => setUiScale(opt.key)} style={{
                  padding: '0.75rem 0.4rem', borderRadius: 8, border: '2px solid',
                  borderColor: active ? 'var(--gold)' : 'var(--border)',
                  background: active ? 'rgba(212,175,55,0.07)' : 'rgba(0,0,0,0.2)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.3rem' }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-xs)', color: active ? 'var(--gold)' : 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Font Size ─────────────────────────────────────────────────── */}
        <section className="tl-panel">
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: '0.4rem' }}>{t('settings.accessibility.title')}</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: '1.25rem' }}>{t('settings.accessibility.description')}</p>
          <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="tl-eyebrow">{t('settings.accessibility.fontSize')}</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>{fontSize}px</span>
            </div>
            <input type="range" min="12" max="20" step="1" value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{ width: '100%', height: 6, cursor: 'pointer', accentColor: 'var(--gold)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              <span>12px</span><span>20px</span>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: 6 }}>
            <div className="tl-eyebrow" style={{ marginBottom: 4 }}>{t('settings.accessibility.preview')}</div>
            <span style={{ fontSize: 'var(--fs-base)' }}>{t('settings.accessibility.previewText')}</span>
          </div>
        </section>

        {/* ── Report ────────────────────────────────────────────────────── */}
        <section className="tl-panel" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: '0.4rem' }}>{t('settings.report.title')}</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: '1rem' }}>{t('settings.report.description')}</p>
          <textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)}
            placeholder={t('settings.report.placeholder')} rows={4}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: 'var(--fs-sm)', fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem', fontStyle: 'italic' }}>ℹ {t('settings.report.note')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={handleSendReport} disabled={reportSending}
              style={{ padding: '0.55rem 1.4rem', borderRadius: 6, border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.08)', color: 'var(--gold)', cursor: reportSending ? 'default' : 'pointer', fontSize: 'var(--fs-sm)', fontWeight: 700, opacity: reportSending ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              {reportSending ? t('settings.report.sending') : t('settings.report.send')}
            </button>
            {reportResult !== null && (
              <span style={{ fontSize: 'var(--fs-sm)', color: reportResult.ok ? '#4ade80' : '#f87171' }}>
                {reportResult.ok ? t('settings.report.success') : t('settings.report.error')}
              </span>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
