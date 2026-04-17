import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', width: '100vw', 
          background: '#0b0c0e', color: '#f25f5c',
          display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sinal de Alerta detectado</h1>
          <p style={{ maxWidth: '600px', color: '#7a8099', marginBottom: '2rem' }}>
            Ocorreu um erro crítico no sistema de visualização. Por favor, tente reiniciar o aplicativo ou verifique os dados importados.
          </p>
          <div style={{ 
            background: 'rgba(242,95,92,0.1)', border: '1px solid rgba(242,95,92,0.3)',
            padding: '1rem', borderRadius: 8, textAlign: 'left',
            maxWidth: '100%', overflow: 'auto'
          }}>
            <code style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem', padding: '0.6rem 1.5rem', background: '#d4af37',
              border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Reiniciar Interface
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
