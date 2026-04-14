import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', label: 'Painel', icon: '🏠', end: true },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/processos', label: 'Processos', icon: '⚖️' },
  { to: '/tarefas', label: 'Tarefas', icon: '✅' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/financeiro', label: 'Financeiro', icon: '💰' },
  { to: '/documentos', label: 'Documentos', icon: '📄' },
  { to: '/perfil', label: 'Meu Perfil', icon: '👤' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
]

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { profile, signOut, diasRestantes } = useAuth()
  const navigate = useNavigate()
  const dias = diasRestantes()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login')
      toast.success('Sessao encerrada')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  // Estilos do sidebar baseados em JS — sem depender de CSS media query
  const sidebarStyle = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 280,
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-280px)',
        transition: 'transform 0.3s ease',
      }
    : {
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: 240,
        minWidth: 240,
        flexShrink: 0,
        zIndex: 10,
      }

  const navItemStyle = {
    padding: isMobile ? '13px 14px' : '10px 12px',
    fontSize: isMobile ? 16 : 14,
    marginBottom: isMobile ? 6 : 4,
  }

  const iconSize = isMobile ? 22 : 18

  return (
    <>
      {/* Overlay escuro — só no mobile quando aberto */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
          }}
        />
      )}

      <aside
        style={{
          background: '#1B2B4B',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...sidebarStyle,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: isMobile ? 32 : 28 }}>⚖️</span>
            <div>
              <div style={{ color: '#C9A84C', fontWeight: 700, fontSize: isMobile ? 17 : 15, lineHeight: 1.2 }}>
                JurisFlow
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 12 : 11, marginTop: 2 }}>
                Gestão Jurídica Inteligente
              </div>
            </div>
          </div>
          {/* Botão fechar no mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                width: 36,
                height: 36,
                cursor: 'pointer',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Navegacao */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: navItemStyle.padding,
                borderRadius: 8,
                marginBottom: navItemStyle.marginBottom,
                textDecoration: 'none',
                color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: navItemStyle.fontSize,
                transition: 'all 0.2s',
                borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent',
              })}
            >
              <span style={{ fontSize: iconSize, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Link admin */}
          {profile?.is_admin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: navItemStyle.padding,
                borderRadius: 8, marginBottom: navItemStyle.marginBottom,
                textDecoration: 'none',
                color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: navItemStyle.fontSize,
                borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent',
              })}
            >
              <span style={{ fontSize: iconSize }}>👑</span>
              <span>Painel Admin</span>
            </NavLink>
          )}

          {/* Dias restantes */}
          {!profile?.is_admin && dias !== null && dias <= 7 && (
            <div style={{
              margin: '8px 4px', padding: '8px 12px',
              background: dias <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              borderRadius: 8, fontSize: isMobile ? 13 : 12,
              color: dias <= 3 ? '#fca5a5' : '#fcd34d', fontWeight: 600,
            }}>
              ⏰ {dias > 0 ? `${dias} dia(s) restante(s)` : 'Acesso expirado'}
            </div>
          )}
        </nav>

        {/* Footer com usuario */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: isMobile ? 42 : 36, height: isMobile ? 42 : 36,
              borderRadius: '50%', background: '#C9A84C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: isMobile ? 16 : 14, flexShrink: 0,
            }}>
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                color: '#fff', fontSize: isMobile ? 15 : 13, fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {profile?.full_name || 'Usuario'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 12 : 11 }}>
                {profile?.role === 'admin' ? 'Administrador' : 'Advogado'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              padding: isMobile ? '12px' : '8px 12px',
              borderRadius: 8, cursor: 'pointer',
              fontSize: isMobile ? 15 : 13,
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
              minHeight: isMobile ? 48 : 'auto',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
              e.currentTarget.style.color = '#fca5a5'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            <span>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
