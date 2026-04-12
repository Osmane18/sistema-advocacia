import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [speedDial, setSpeedDial] = useState(false)
  const navigate = useNavigate()

  const actions = [
    { icon: '👥', label: 'Novo Cliente', to: '/clientes' },
    { icon: '⚖️', label: 'Novo Processo', to: '/processos' },
    { icon: '📅', label: 'Novo Evento', to: '/agenda' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F6F9' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#F4F6F9' }}>
          <Outlet />
        </main>
      </div>

      {/* Speed-dial flutuante */}
      {speedDial && <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setSpeedDial(false)} />}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        {speedDial && actions.map(op => (
          <div key={op.label} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.15s ease' }}>
            <span style={{ background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
              {op.label}
            </span>
            <button onClick={() => { setSpeedDial(false); navigate(op.to) }} style={{
              width: 46, height: 46, borderRadius: '50%', background: '#1B2B4B', color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 18,
              boxShadow: '0 3px 10px rgba(27,43,75,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {op.icon}
            </button>
          </div>
        ))}
        <button
          onClick={() => setSpeedDial(v => !v)}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: speedDial ? '#374151' : '#C9A84C', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 26, fontWeight: 300,
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
