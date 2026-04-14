import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

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
  const title = pageTitles[location.pathname] || 'JurisFlow'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarBusca, setMostrarBusca] = useState(false)
  const buscaRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarBusca(false)
        setBusca('')
        setResultados([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fecha ao navegar
  useEffect(() => {
    setMostrarBusca(false)
    setBusca('')
    setResultados([])
  }, [location.pathname])

  // Busca com debounce
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (busca.trim().length < 2) { setResultados([]); return }
    timerRef.current = setTimeout(() => executarBusca(busca.trim()), 350)
    return () => clearTimeout(timerRef.current)
  }, [busca])

  async function executarBusca(q) {
    setBuscando(true)
    const termo = `%${q}%`
    const [{ data: clientes }, { data: processos }, { data: tarefas }] = await Promise.all([
      supabase.from('clients').select('id, name, phone, email').ilike('name', termo).limit(4),
      supabase.from('processes').select('id, number, area, clients(name)').or(`number.ilike.${termo}`).limit(4),
      supabase.from('tasks').select('id, title, status, priority').ilike('title', termo).limit(4),
    ])

    const res = []
    if (clientes?.length) res.push({ grupo: 'Clientes', icon: '👥', items: clientes.map(c => ({ id: c.id, label: c.name, sub: c.phone || c.email || '', to: '/clientes' })) })
    if (processos?.length) res.push({ grupo: 'Processos', icon: '⚖️', items: processos.map(p => ({ id: p.id, label: p.number, sub: `${p.area}${p.clients?.name ? ' · ' + p.clients.name : ''}`, to: '/processos' })) })
    if (tarefas?.length) res.push({ grupo: 'Tarefas', icon: '✅', items: tarefas.map(t => ({ id: t.id, label: t.title, sub: t.status, to: '/tarefas' })) })

    setResultados(res)
    setBuscando(false)
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: isMobile ? '0 12px' : '0 24px',
      height: isMobile ? 60 : 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
      gap: 8,
    }}>

      {/* Esquerda: hambúrguer + título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, minWidth: 0, flex: 1 }}>
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

        {/* Título — esconde no mobile quando busca está aberta */}
        {!(isMobile && mostrarBusca) && (
          <div style={{ minWidth: 0, flexShrink: 0 }}>
            <h1 style={{
              fontSize: isMobile ? 18 : 18,
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
        )}

        {/* Busca global */}
        <div ref={buscaRef} style={{ position: 'relative', flex: isMobile && mostrarBusca ? 1 : 'none', maxWidth: mostrarBusca ? 420 : 'none' }}>
          {mostrarBusca ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '2px solid #1B2B4B', borderRadius: 10, padding: '6px 12px', width: isMobile ? '100%' : 320 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
              <input
                ref={inputRef}
                autoFocus
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar clientes, processos, tarefas..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#1A1A2E' }}
              />
              {buscando && <span style={{ fontSize: 13, color: '#9ca3af' }}>...</span>}
              <button onClick={() => { setMostrarBusca(false); setBusca(''); setResultados([]) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setMostrarBusca(true); setTimeout(() => inputRef.current?.focus(), 50) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 10, padding: isMobile ? '8px 12px' : '7px 14px',
                cursor: 'pointer', color: '#6b7280', fontSize: 13,
                minHeight: isMobile ? 44 : 'auto', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 15 }}>🔍</span>
              {!isMobile && 'Buscar...'}
            </button>
          )}

          {/* Dropdown de resultados */}
          {mostrarBusca && busca.length >= 2 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0,
              width: isMobile ? '90vw' : 380,
              background: '#fff', borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
              zIndex: 999, overflow: 'hidden',
            }}>
              {resultados.length === 0 && !buscando ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  Nenhum resultado para "{busca}"
                </div>
              ) : (
                resultados.map(grupo => (
                  <div key={grupo.grupo}>
                    <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>
                      {grupo.icon} {grupo.grupo}
                    </div>
                    {grupo.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { navigate(item.to); setMostrarBusca(false); setBusca(''); setResultados([]) }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 16px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', gap: 2,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{item.label}</span>
                        {item.sub && <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.sub}</span>}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Direita: modo escuro + perfil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
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
