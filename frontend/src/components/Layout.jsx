import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#F4F6F9'
    }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0
      }}>
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: '#F4F6F9'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
