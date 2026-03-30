import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/processos': 'Processos',
  '/agenda': 'Agenda',
  '/financeiro': 'Financeiro',
  '/documentos': 'Documentos'
}

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const { profile } = useAuth()
  const title = pageTitles[location.pathname] || 'Sistema de Advocacia'

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      flexShrink: 0
    }}>
      {/* Esquerda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Botao menu mobile */}
        <button
          onClick={onMenuToggle}
          className="btn-icon menu-toggle"
          style={{ display: 'none' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E' }}>{title}</h1>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1, textTransform: 'capitalize' }}>{today}</p>
        </div>
      </div>

      {/* Direita */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Badge do usuario */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#1B2B4B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C9A84C',
            fontWeight: 700,
            fontSize: 12
          }}>
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>
              {profile?.full_name || 'Usuario'}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {profile?.oab ? `OAB: ${profile.oab}` : profile?.role === 'admin' ? 'Admin' : 'Advogado'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .menu-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  )
}
