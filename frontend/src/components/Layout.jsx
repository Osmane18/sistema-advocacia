import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [speedDial, setSpeedDial] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const navigate = useNavigate()
  const location = useLocation()

  // Detecta mobile/desktop — puro JS, sem media query CSS
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fecha sidebar ao navegar no mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  const actions = [
    { icon: '👥', label: 'Novo Cliente', to: '/clientes' },
    { icon: '⚖️', label: 'Novo Processo', to: '/processos' },
    { icon: '✅', label: 'Nova Tarefa', to: '/tarefas' },
    { icon: '📅', label: 'Novo Evento', to: '/agenda' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F6F9' }}>

      {/* Sidebar — se posiciona sozinho via isMobile */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Área principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          isMobile={isMobile}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '16px' : '24px',
            paddingBottom: isMobile ? '90px' : '24px', /* espaço para o botão flutuante */
            background: '#F4F6F9',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Botão flutuante + (Speed-dial) */}
      {speedDial && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => setSpeedDial(false)}
        />
      )}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 20 : 24,
        right: isMobile ? 20 : 24,
        zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      }}>
        {speedDial && actions.map(op => (
          <div key={op.label} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.15s ease' }}>
            <span style={{
              background: 'white', color: '#374151',
              fontSize: isMobile ? 14 : 12,
              fontWeight: 700, padding: '6px 14px',
              borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
            }}>
              {op.label}
            </span>
            <button
              onClick={() => { setSpeedDial(false); navigate(op.to) }}
              style={{
                width: isMobile ? 52 : 46,
                height: isMobile ? 52 : 46,
                borderRadius: '50%', background: '#1B2B4B', color: 'white',
                border: 'none', cursor: 'pointer', fontSize: isMobile ? 22 : 18,
                boxShadow: '0 3px 10px rgba(27,43,75,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {op.icon}
            </button>
          </div>
        ))}
        <button
          onClick={() => setSpeedDial(v => !v)}
          style={{
            width: isMobile ? 62 : 56,
            height: isMobile ? 62 : 56,
            borderRadius: '50%',
            background: speedDial ? '#374151' : '#C9A84C',
            color: 'white', border: 'none', cursor: 'pointer',
            fontSize: isMobile ? 30 : 26,
            fontWeight: 300,
            boxShadow: '0 4px 16px rgba(201,168,76,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            transform: speedDial ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
