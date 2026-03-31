import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useError } from '../context/ErrorContext'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ icon, label, value, color, loading }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px' }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: color + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</div>
        {loading ? (
          <div className="skeleton" style={{ width: 70, height: 24 }} />
        ) : (
          <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
        )}
      </div>
    </div>
  )
}

const eventTypeColors = {
  audiencia: '#3b82f6',
  prazo: '#ef4444',
  reuniao: '#22c55e',
  compromisso: '#f59e0b'
}

const eventTypeLabels = {
  audiencia: 'Audiencia',
  prazo: 'Prazo',
  reuniao: 'Reuniao',
  compromisso: 'Compromisso'
}

const statusColors = {
  ativo: 'badge-success',
  encerrado: 'badge-gray',
  suspenso: 'badge-warning'
}

export default function Dashboard() {
  const showError = useError()
  const [stats, setStats] = useState({
    clients: 0, processes: 0, events: 0, revenue: 0,
    processesEncerrados: 0, prazoVencido: 0, pendente: 0, documentos: 0
  })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentProcesses, setRecentProcesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      const today = new Date()
      const weekStart = format(today, 'yyyy-MM-dd')
      const weekEnd = format(addDays(today, 7), 'yyyy-MM-dd')
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')

      const [
        { count: clientCount },
        { count: processCount },
        { count: processEncerradoCount },
        { count: eventCount },
        { count: prazoVencidoCount },
        { data: revenueData },
        { data: pendingData },
        { count: docCount },
        { data: eventsData },
        { data: processesData }
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('processes').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('processes').select('*', { count: 'exact', head: true }).eq('status', 'encerrado'),
        supabase.from('events').select('*', { count: 'exact', head: true })
          .gte('date', weekStart).lte('date', weekEnd).eq('completed', false),
        supabase.from('events').select('*', { count: 'exact', head: true })
          .eq('type', 'prazo').lt('date', weekStart).eq('completed', false),
        supabase.from('financial_records').select('amount')
          .eq('status', 'pago').gte('paid_date', monthStart).lte('paid_date', monthEnd),
        supabase.from('financial_records').select('amount')
          .in('status', ['pendente', 'atrasado']),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('id, title, type, date, time, clients(name)')
          .gte('date', weekStart).eq('completed', false)
          .order('date', { ascending: true }).limit(5),
        supabase.from('processes').select('id, number, area, status, clients(name), updated_at')
          .order('updated_at', { ascending: false }).limit(5)
      ])

      const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
      const totalPendente = pendingData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0

      setStats({
        clients: clientCount || 0,
        processes: processCount || 0,
        processesEncerrados: processEncerradoCount || 0,
        events: eventCount || 0,
        prazoVencido: prazoVencidoCount || 0,
        revenue: totalRevenue,
        pendente: totalPendente,
        documentos: docCount || 0
      })
      setUpcomingEvents(eventsData || [])
      setRecentProcesses(processesData || [])
    } catch (err) {
      showError('Erro ao carregar o painel: ' + err.message, 'Erro ao Carregar')
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    try {
      const [y, m, d] = dateStr.split('-')
      return `${d}/${m}/${y}`
    } catch { return dateStr }
  }

  return (
    <div className="fade-in">
      {/* Cards de estatisticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard icon="👥" label="Total de Clientes" value={stats.clients} color="#1B2B4B" loading={loading} />
        <StatCard icon="⚖️" label="Processos Ativos" value={stats.processes} color="#C9A84C" loading={loading} />
        <StatCard icon="✅" label="Processos Encerrados" value={stats.processesEncerrados} color="#6b7280" loading={loading} />
        <StatCard icon="📅" label="Eventos Esta Semana" value={stats.events} color="#3b82f6" loading={loading} />
        <StatCard icon="⏰" label="Prazos Vencidos" value={stats.prazoVencido} color="#ef4444" loading={loading} />
        <StatCard icon="💰" label="Receita do Mês" value={formatCurrency(stats.revenue)} color="#22c55e" loading={loading} />
        <StatCard icon="⚠️" label="Financeiro Pendente" value={formatCurrency(stats.pendente)} color="#f59e0b" loading={loading} />
        <StatCard icon="📄" label="Total de Documentos" value={stats.documentos} color="#8b5cf6" loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Proximos eventos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 Proximos Eventos</h3>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">Nenhum evento nos proximos dias</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.map(ev => {
                const isUrgent = ev.date <= format(addDays(new Date(), 3), 'yyyy-MM-dd')
                return (
                  <div key={ev.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isUrgent ? '#fef2f2' : '#f9fafb',
                    border: `1px solid ${isUrgent ? '#fecaca' : '#e5e7eb'}`
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: eventTypeColors[ev.type] || '#6b7280',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {formatDate(ev.date)}{ev.time ? ` - ${ev.time.slice(0,5)}` : ''} • {ev.clients?.name || 'Sem cliente'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: eventTypeColors[ev.type] + '20',
                      color: eventTypeColors[ev.type],
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      {eventTypeLabels[ev.type]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Processos recentes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚖️ Processos Recentes</h3>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : recentProcesses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚖️</div>
              <div className="empty-state-text">Nenhum processo cadastrado</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentProcesses.map(proc => (
                <div key={proc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  gap: 8
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proc.number}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {proc.clients?.name || 'Sem cliente'} • {proc.area}
                    </div>
                  </div>
                  <span className={`badge ${statusColors[proc.status] || 'badge-gray'}`}>
                    {proc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
