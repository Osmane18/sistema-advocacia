import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

const pageTitles = {
  '/': 'Painel',
  '/clientes': 'Clientes',
  '/processos': 'Processos',
  '/tarefas': 'Tarefas',
  '/agenda': 'Agenda',
  '/financeiro': 'Financeiro',
  '/documentos': 'Documentos',
  '/perfil': 'Meu Perfil',
  '/admin': 'Painel Admin',
}

export default function Header({ onMenuToggle, isMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const title = pageTitles[location.pathname] || 'Sistema de Advocacia'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: isMobile ? '0 16px' : '0 24px',
      height: isMobile ? 60 : 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
      gap: 8,
    }}>

      {/* Esquerda: hambúrguer + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, minWidth: 0 }}>
        {/* Botão hambúrguer — só no mobile, via JS */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#374151', minWidth: 44, minHeight: 44,
            }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: isMobile ? 20 : 18,
            fontWeight: 700, color: '#1A1A2E',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {!isMobile && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1, textTransform: 'capitalize' }}>
              {today}
            </p>
          )}
        </div>
      </div>

      {/* Direita: modo escuro + perfil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
        {/* Botão modo escuro */}
        <button
          onClick={() => setDarkMode(v => !v)}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
          style={{
            background: 'none', border: '1px solid #e5e7eb',
            cursor: 'pointer', borderRadius: 8, color: '#374151',
            width: isMobile ? 44 : 38, height: isMobile ? 44 : 38,
            fontSize: isMobile ? 20 : 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Avatar → perfil */}
        <div
          onClick={() => navigate('/perfil')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: isMobile ? '6px 10px' : '6px 12px',
            background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb',
            cursor: 'pointer', transition: 'all 0.15s',
            minHeight: isMobile ? 44 : 'auto',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
        >
          <div style={{
            width: isMobile ? 32 : 28, height: isMobile ? 32 : 28,
            borderRadius: '50%', background: '#1B2B4B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#C9A84C', fontWeight: 700, fontSize: isMobile ? 14 : 12, flexShrink: 0,
          }}>
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Nome só aparece no desktop */}
          {!isMobile && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>
                {profile?.full_name || 'Usuário'}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {profile?.oab ? `OAB: ${profile.oab}` : profile?.role === 'admin' ? 'Admin' : 'Advogado'}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
