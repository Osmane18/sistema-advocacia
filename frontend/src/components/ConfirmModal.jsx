export default function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)'
        }}
        onClick={onCancel}
      />

      {/* Janela */}
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Faixa laranja no topo */}
        <div style={{ background: '#f59e0b', height: 5 }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Ícone + título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#1A1A2E',
              fontFamily: 'Inter, sans-serif',
              margin: 0
            }}>
              {title || 'Confirmar ação'}
            </h2>
          </div>

          {/* Mensagem */}
          <p style={{
            fontSize: 14,
            color: '#4b5563',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
            margin: '0 0 24px 0'
          }}>
            {message}
          </p>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
