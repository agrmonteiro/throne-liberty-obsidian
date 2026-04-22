import React, { useEffect, useState } from 'react'

export function MigrationNotifier(): React.ReactElement | null {
  const [files, setFiles] = useState<string[] | null>(null)

  useEffect(() => {
    if (!window.dataAPI?.onMigration) return
    window.dataAPI.onMigration(({ files: f }) => setFiles(f))
  }, [])

  if (!files) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(5, 7, 16, 0.85)', backdropFilter: 'blur(6px)',
      }} />

      {/* card */}
      <div className="tl-panel" style={{
        position: 'relative', width: 480, maxWidth: '90%',
        border: '1px solid var(--border-gold)',
        padding: '2rem 2rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{ fontSize: '2rem', textAlign: 'center' }}>📦</div>

        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gold)', textAlign: 'center' }}>
          Dados migrados para o Tier2 Command Lab
        </h2>

        <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-soft)', lineHeight: 1.6 }}>
          Seus dados da versão anterior foram copiados automaticamente para o novo diretório do app.
          Nenhuma informação foi perdida.
        </p>

        {files.length > 0 && (
          <ul style={{
            margin: 0, padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.04)', borderRadius: 6,
            listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem',
          }}>
            {files.map(f => (
              <li key={f} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                ✓ {f}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setFiles(null)}
          style={{
            marginTop: '0.5rem', padding: '0.55rem 1.5rem', alignSelf: 'center',
            borderRadius: 6, border: '1px solid var(--border-gold)',
            background: 'rgba(212,175,55,0.15)', color: 'var(--gold)',
            cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700,
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
