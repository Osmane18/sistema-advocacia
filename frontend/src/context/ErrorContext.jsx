import { createContext, useContext, useState, useCallback } from 'react'

const ErrorContext = createContext(null)

export function useError() {
  return useContext(ErrorContext)
}

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null) // { title, message }

  const showError = useCallback((message, title = 'Ocorreu um erro') => {
    setError({ title, message: String(message) })
  }, [])

  const closeError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <ErrorContext.Provider value={showError}>
      {children}
      {error && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => e.target === e.currentTarget && closeError()}
        >
          {/* Overlay escuro */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={closeError}
          />

          {/* Janela de erro */}
          <div
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              width: '100%',
              maxWidth: 460,
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Faixa vermelha no topo */}
            <div style={{ background: '#dc2626', height: 5 }} />

            {/* Conteúdo */}
            <div style={{ padding: '28px 28px 24px' }}>
              {/* Ícone + título */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#1A1A2E',
                  fontFamily: 'Inter, sans-serif',
                  margin: 0
                }}>
                  {error.title}
                </h2>
              </div>

              {/* Mensagem */}
              <p style={{
                fontSize: 14,
                color: '#4b5563',
                lineHeight: 1.6,
                fontFamily: 'Inter, sans-serif',
                margin: '0 0 24px 0',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '12px 14px',
                wordBreak: 'break-word'
              }}>
                {error.message}
              </p>

              {/* Botão fechar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeError}
                  style={{
                    background: '#1B2B4B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#243d6b'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1B2B4B'}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  )
}
