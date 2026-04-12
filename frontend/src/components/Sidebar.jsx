import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/processos', label: 'Processos', icon: '⚖️' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/financeiro', label: 'Financeiro', icon: '💰' },
  { to: '/documentos', label: 'Documentos', icon: '📄' },
  { to: '/perfil', label: 'Meu Perfil', icon: '👤' },
]

export default function Sidebar({ isOpen, onClose }) {
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

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49
          }}
          className="sidebar-overlay"
        />
      )}

      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: '#1B2B4B',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          overflow: 'hidden',
          transition: 'transform 0.3s ease',
          zIndex: 50
        }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚖️</span>
            <div>
              <div style={{ color: '#C9A84C', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                Advocacia
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
                Sistema de Gestao
              </div>
            </div>
          </div>
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
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 4,
                textDecoration: 'none',
                color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.2s',
                borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent'
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.borderLeft.includes('C9A84C')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                }
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Link admin */}
          {profile?.is_admin && (
            <NavLink to="/admin" onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                textDecoration: 'none',
                color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)',
                background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400, fontSize: 14,
                borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent'
              })}>
              <span style={{ fontSize: 18 }}>👑</span>
              <span>Painel Admin</span>
            </NavLink>
          )}

          {/* Dias restantes */}
          {!profile?.is_admin && dias !== null && dias <= 7 && (
            <div style={{ margin: '8px 4px', padding: '8px 12px', background: dias <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', borderRadius: 8, fontSize: 12, color: dias <= 3 ? '#fca5a5' : '#fcd34d', fontWeight: 600 }}>
              ⏰ {dias > 0 ? `${dias} dia(s) restante(s)` : 'Acesso expirado'}
            </div>
          )}
        </nav>

        {/* Footer com usuario */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#C9A84C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0
            }}>
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {profile?.full_name || 'Usuario'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
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
              padding: '8px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
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

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
          }
          .sidebar.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
