import React, { useEffect, useState } from 'react'
import { useSettings, Theme } from '../store/useSettings'
import { useLocale } from '../store/useLocale'
import { useT } from '../i18n/useT'
import type { Lang } from '../i18n/translations'

interface ScraperStatus {
  scraperFound: boolean
  scraperPath: string | null
  pythonOk: boolean
  pythonVersion: string
}

export function Settings(): React.ReactElement {
  const { theme, fontSize, setTheme, setFontSize } = useSettings()
  const { lang, setLang } = useLocale()
  const t = useT()

  const [scraper, setScraper]     = useState<ScraperStatus | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [saved, setSaved]         = useState(false)

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

  async function pickFile() {
    const picked = await window.dataAPI.scraperPickFile()
    if (picked) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await runDetect()
    }
  }

  const ok = scraper?.scraperFound && scraper?.pythonOk

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '2rem' }}>
      <div className="tl-hero" style={{ padding: 0, borderBottom: 'none', marginBottom: '2.5rem' }}>
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 1000 }}>

        {/* ── Scraper Setup ─────────────────────────────────────────── */}
        <section className="tl-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Importador de Builds</h2>
            {detecting ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>verificando…</span>
            ) : ok ? (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'
              }}>✓ Configurado</span>
            ) : (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'
              }}>⚠ Não configurado</span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginBottom: '1.5rem' }}>
            O importador usa um script Python para extrair sua build do Questlog.
            Configure o caminho uma vez e o app cuida do resto.
          </p>

          {/* Status grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Python */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Python</div>
              {scraper?.pythonOk ? (
                <>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.9rem' }}>✓ Encontrado</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: 2 }}>{scraper.pythonVersion}</div>
                </>
              ) : (
                <>
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>✗ Não encontrado</div>
                  <a
                    onClick={() => window.open?.('https://www.python.org/downloads/')}
                    style={{ fontSize: '0.75rem', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline', marginTop: 4, display: 'block' }}
                  >
                    Baixar Python →
                  </a>
                </>
              )}
            </div>

            {/* Scraper */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Script do Scraper</div>
              {scraper?.scraperFound ? (
                <>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.9rem' }}>✓ Encontrado</div>
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4,
                    wordBreak: 'break-all', fontFamily: 'monospace'
                  }}>
                    {scraper.scraperPath}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>✗ Não encontrado</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: 2 }}>
                    Clique em "Detectar" ou selecione manualmente
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={runDetect}
              disabled={detecting}
              style={{
                padding: '0.55rem 1.2rem', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer',
                fontSize: '0.82rem', opacity: detecting ? 0.5 : 1
              }}
            >
              {detecting ? '⏳ Detectando…' : '🔍 Detectar automaticamente'}
            </button>

            <button
              onClick={pickFile}
              style={{
                padding: '0.55rem 1.2rem', borderRadius: 6, border: '1px solid var(--gold)',
                background: 'rgba(212,175,55,0.08)', color: 'var(--gold)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
              }}
            >
              📂 Selecionar arquivo…
            </button>

            {saved && (
              <span style={{ color: '#4ade80', fontSize: '0.82rem', alignSelf: 'center' }}>✓ Salvo!</span>
            )}
          </div>

          {/* Help text */}
          {!ok && (
            <div style={{
              marginTop: '1.25rem', padding: '1rem', borderRadius: 8,
              background: 'rgba(212,175,55,0.05)', border: '1px dashed rgba(212,175,55,0.3)'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>
                Como configurar
              </div>
              <ol style={{ fontSize: '0.78rem', color: 'var(--text-soft)', margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                <li>Instale o Python em <span style={{ color: 'var(--gold)' }}>python.org/downloads</span> (se necessário)</li>
                <li>Baixe o scraper em <span style={{ color: 'var(--gold)' }}>github.com/agrmonteiro/throne_and_liberty_agent</span></li>
                <li>No terminal, rode: <code style={{ background: 'var(--bg)', padding: '1px 4px', borderRadius: 3 }}>pip install playwright &amp;&amp; playwright install chromium</code></li>
                <li>Clique em <strong>Detectar automaticamente</strong> — ou <strong>Selecionar arquivo</strong> para localizar o <code>questlog_scraper_standalone.py</code></li>
              </ol>
            </div>
          )}
        </section>

        {/* ── Language ──────────────────────────────────────────────── */}
        <section className="tl-panel">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('settings.languageLabel')}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1.5rem' }}>
            {t('settings.language')}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['pt-BR', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  flex: 1, padding: '1.25rem', borderRadius: 8, border: '2px solid',
                  borderColor: lang === l ? 'var(--gold)' : 'var(--border)',
                  background: lang === l ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{l === 'pt-BR' ? '🇧🇷' : '🇺🇸'}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: lang === l ? 'var(--gold)' : 'var(--text-soft)' }}>
                  {l === 'pt-BR' ? 'Português (pt-BR)' : 'English (en)'}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Theme ─────────────────────────────────────────────────── */}
        <section className="tl-panel">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tema Visual</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1.5rem' }}>
            Escolha entre o Modo Escuro clássico ou o Modo Claro.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['dark', 'light'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  flex: 1, padding: '1.5rem', borderRadius: 8, border: '2px solid',
                  borderColor: theme === t ? 'var(--gold)' : 'var(--border)',
                  background: theme === t ? 'rgba(212,175,55,0.05)' : (t === 'light' ? '#fff' : 'rgba(0,0,0,0.2)'),
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t === 'dark' ? '🌙' : '☀️'}</div>
                <div style={{ fontWeight: 700, color: theme === t ? 'var(--gold)' : (t === 'light' ? '#555' : 'var(--text-soft)') }}>
                  {t === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Font Size ─────────────────────────────────────────────── */}
        <section className="tl-panel">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Acessibilidade</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1.5rem' }}>
            Ajuste o tamanho global das fontes.
          </p>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tamanho da Fonte</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{fontSize}px</span>
            </div>
            <input
              type="range" min="12" max="20" step="1"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{ width: '100%', height: 6, cursor: 'pointer', accentColor: 'var(--gold)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>12px</span><span>20px</span>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed var(--border)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>Visualização:</div>
            <span style={{ fontSize: '1rem' }}>Texto de exemplo para validação do tamanho de fonte.</span>
          </div>
        </section>

      </div>
    </div>
  )
}
