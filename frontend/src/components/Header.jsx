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

const FAQ = [
  { q: 'Como cadastrar um cliente?', r: 'Vá em Clientes → clique em "+ Novo Cliente" → preencha nome, telefone e email → Salvar.' },
  { q: 'Como criar um processo?', r: 'Vá em Processos → "+ Novo Processo" → informe o número, cliente e área do direito.' },
  { q: 'Como controlar prazos?', r: 'Vá em Agenda → "+ Novo Evento" → escolha o tipo "Prazo" → defina a data. O sistema alerta automaticamente.' },
  { q: 'Como registrar um andamento?', r: 'Em Processos, clique no número do processo ou no ícone 🔍 → role até "Histórico de Andamentos" → adicione a descrição.' },
  { q: 'Como criar uma tarefa?', r: 'Vá em Tarefas → "+ Nova Tarefa" → defina título, prioridade e prazo. Tarefas urgentes aparecem no Painel.' },
  { q: 'Como registrar honorários?', r: 'Vá em Financeiro → "+ Novo Registro" → informe valor, cliente e status do pagamento.' },
]

function ModalAjuda({ onClose }) {
  const [aba, setAba] = useState('contato')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B4B', margin: 0 }}>⚖️ Ajuda — JurisFlow</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Suporte e guia rápido</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af', padding: 4 }}>✕</button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 0, padding: '16px 24px 0', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { id: 'contato', label: '💬 Contato' },
            { id: 'guia', label: '📖 Guia Rápido' },
            { id: 'faq', label: '❓ FAQ' },
          ].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: aba === a.id ? '#1B2B4B' : '#9ca3af',
              borderBottom: aba === a.id ? '2px solid #C9A84C' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{a.label}</button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Aba Contato */}
          {aba === 'contato' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>Falar com Suporte</h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Precisa de ajuda? Fale diretamente pelo WhatsApp.</p>
                <a
                  href="https://wa.me/5531996031369?text=Olá%2C%20preciso%20de%20ajuda%20com%20o%20sistema%20JurisFlow"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#22c55e', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                >
                  💬 Abrir WhatsApp
                </a>
              </div>
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>⏰ Horário de atendimento</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Segunda a Sexta — 8h às 18h</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Sábado — 8h às 12h</div>
              </div>
            </div>
          )}

          {/* Aba Guia Rápido */}
          {aba === 'guia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '👥', titulo: 'Cadastrar Cliente', passos: ['Clique em "Clientes" no menu', 'Clique em "+ Novo Cliente"', 'Preencha nome e telefone', 'Clique em "Cadastrar Cliente"'] },
                { icon: '⚖️', titulo: 'Criar Processo', passos: ['Clique em "Processos" no menu', 'Clique em "+ Novo Processo"', 'Informe o número e selecione o cliente', 'Defina a área do direito e salve'] },
                { icon: '📅', titulo: 'Controlar Prazos', passos: ['Clique em "Agenda" no menu', 'Clique em "+ Novo Evento"', 'Selecione o tipo "Prazo"', 'Defina a data — o sistema alerta automaticamente'] },
                { icon: '✅', titulo: 'Gerenciar Tarefas', passos: ['Clique em "Tarefas" no menu', 'Clique em "+ Nova Tarefa"', 'Defina título, prioridade e prazo', 'Marque como concluída com o checkbox'] },
              ].map(item => (
                <div key={item.titulo} style={{ padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B4B', marginBottom: 10 }}>{item.icon} {item.titulo}</div>
                  <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.passos.map((p, i) => <li key={i} style={{ fontSize: 13, color: '#374151' }}>{p}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {/* Aba FAQ */}
          {aba === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQ.map((item, i) => (
                <details key={i} style={{ background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', padding: '12px 16px' }}>
                  <summary style={{ fontSize: 14, fontWeight: 600, color: '#1B2B4B', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.q}
                    <span style={{ color: '#C9A84C', fontSize: 18, fontWeight: 300 }}>+</span>
                  </summary>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10, lineHeight: 1.6 }}>{item.r}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Header({ onMenuToggle, isMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const title = pageTitles[location.pathname] || 'JurisFlow'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [ajudaOpen, setAjudaOpen] = useState(false)

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

  useEffect(() => {
    function handleClick(e) {
      if (buscaRef.current && !buscaRef.current.contains(e.target)) {
        setMostrarBusca(false); setBusca(''); setResultados([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setMostrarBusca(false); setBusca(''); setResultados([])
  }, [location.pathname])

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

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {ajudaOpen && <ModalAjuda onClose={() => setAjudaOpen(false)} />}

      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '0 12px' : '0 24px',
        height: isMobile ? 60 : 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40, flexShrink: 0, gap: 8,
      }}>

        {/* Esquerda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, minWidth: 0, flex: 1 }}>
          {isMobile && (
            <button onClick={onMenuToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', minWidth: 44, minHeight: 44 }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {!(isMobile && mostrarBusca) && (
            <div style={{ minWidth: 0, flexShrink: 0 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
              {!isMobile && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1, textTransform: 'capitalize' }}>{today}</p>}
            </div>
          )}

          {/* Busca */}
          <div ref={buscaRef} style={{ position: 'relative', flex: isMobile && mostrarBusca ? 1 : 'none', maxWidth: mostrarBusca ? 420 : 'none' }}>
            {mostrarBusca ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '2px solid #1B2B4B', borderRadius: 10, padding: '6px 12px', width: isMobile ? '100%' : 320 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
                <input ref={inputRef} autoFocus value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar clientes, processos, tarefas..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#1A1A2E' }} />
                {buscando && <span style={{ fontSize: 13, color: '#9ca3af' }}>...</span>}
                <button onClick={() => { setMostrarBusca(false); setBusca(''); setResultados([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
              </div>
            ) : (
              <button onClick={() => { setMostrarBusca(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: isMobile ? '8px 12px' : '7px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13, minHeight: isMobile ? 44 : 'auto', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 15 }}>🔍</span>
                {!isMobile && 'Buscar...'}
              </button>
            )}

            {mostrarBusca && busca.length >= 2 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: isMobile ? '90vw' : 380, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', zIndex: 999, overflow: 'hidden' }}>
                {resultados.length === 0 && !buscando ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhum resultado para "{busca}"</div>
                ) : (
                  resultados.map(grupo => (
                    <div key={grupo.grupo}>
                      <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>{grupo.icon} {grupo.grupo}</div>
                      {grupo.items.map(item => (
                        <button key={item.id} onClick={() => { navigate(item.to); setMostrarBusca(false); setBusca(''); setResultados([]) }}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
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

        {/* Direita */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>

          {/* Botão Ajuda */}
          <button onClick={() => setAjudaOpen(true)} title="Ajuda e suporte"
            style={{ background: 'none', border: '1px solid #e5e7eb', cursor: 'pointer', borderRadius: 8, color: '#1B2B4B', width: isMobile ? 44 : 38, height: isMobile ? 44 : 38, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ?
          </button>

          {/* Modo escuro */}
          <button onClick={() => setDarkMode(v => !v)} title={darkMode ? 'Modo claro' : 'Modo escuro'}
            style={{ background: 'none', border: '1px solid #e5e7eb', cursor: 'pointer', borderRadius: 8, color: '#374151', width: isMobile ? 44 : 38, height: isMobile ? 44 : 38, fontSize: isMobile ? 20 : 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Perfil */}
          <div onClick={() => navigate('/perfil')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '6px 10px' : '6px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.15s', minHeight: isMobile ? 44 : 'auto' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}>
            <div style={{ width: isMobile ? 32 : 28, height: isMobile ? 32 : 28, borderRadius: '50%', background: '#1B2B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontWeight: 700, fontSize: isMobile ? 14 : 12, flexShrink: 0 }}>
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isMobile && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>{profile?.full_name || 'Usuário'}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{profile?.oab ? `OAB: ${profile.oab}` : profile?.role === 'admin' ? 'Admin' : 'Advogado'}</div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
