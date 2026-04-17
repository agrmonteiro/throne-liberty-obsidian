import React from 'react'
import { useSettings, Theme } from '../store/useSettings'

export function Settings(): React.ReactElement {
  const { theme, fontSize, setTheme, setFontSize } = useSettings()

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '2rem' }}>
      <div className="tl-hero" style={{ padding: 0, borderBottom: 'none', marginBottom: '2.5rem' }}>
        <h1>Configurações</h1>
        <p>Personalize sua experiência visual e preferências do sistema.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 1000 }}>
        
        {/* Theme Selection */}
        <section className="tl-panel">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tema Visual</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1.5rem' }}>
            Escolha entre o Modo Escuro clássico ou o novo Modo Claro.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setTheme('dark')}
              style={{
                flex: 1, padding: '1.5rem', borderRadius: 8, border: '2px solid',
                borderColor: theme === 'dark' ? 'var(--gold)' : 'var(--border)',
                background: theme === 'dark' ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌙</div>
              <div style={{ fontWeight: 700, color: theme === 'dark' ? 'var(--gold)' : 'var(--text-soft)' }}>Dark Mode</div>
            </button>

            <button 
              onClick={() => setTheme('light')}
              style={{
                flex: 1, padding: '1.5rem', borderRadius: 8, border: '2px solid',
                borderColor: theme === 'light' ? 'var(--gold)' : 'var(--border)',
                background: theme === 'light' ? 'rgba(212,175,55,0.05)' : '#fff',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☀️</div>
              <div style={{ fontWeight: 700, color: theme === 'light' ? 'var(--gold)' : '#555' }}>Light Mode</div>
            </button>
          </div>
        </section>

        {/* Font Size Selector */}
        <section className="tl-panel">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Acessibilidade</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1.5rem' }}>
            Ajuste o tamanho global das fontes para melhor conforto visual.
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
              <span>12px</span>
              <span>20px</span>
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
