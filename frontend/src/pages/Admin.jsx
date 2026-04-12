import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'

const WHATSAPP_ADMIN = '31996031369' // WhatsApp do admin para receber avisos

function StatusBadge({ status, expiracao }) {
  const expirado = expiracao && new Date(expiracao) < new Date()
  if (expirado && status === 'aprovado') return <span className="badge badge-red">Expirado</span>
  if (status === 'aprovado') return <span className="badge badge-success">Aprovado</span>
  if (status === 'pendente') return <span className="badge badge-yellow">Pendente</span>
  if (status === 'recusado') return <span className="badge badge-gray">Recusado</span>
  return <span className="badge badge-gray">{status}</span>
}

export default function Admin() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pendentes: 0, aprovados: 0, expirados: 0 })

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, users:id(email:id)')
      .order('created_at', { ascending: false })

    // Buscar emails separadamente
    const { data: authData } = await supabase.auth.admin?.listUsers?.() || { data: null }

    // Buscar via RPC alternativa
    const { data: perfis } = await supabase
      .from('user_profiles')
      .select('id, full_name, whatsapp, status, is_admin, data_aprovacao, data_expiracao, created_at')
      .order('created_at', { ascending: false })

    if (perfis) {
      const agora = new Date()
      const total = perfis.length
      const pendentes = perfis.filter(u => u.status === 'pendente').length
      const aprovados = perfis.filter(u => u.status === 'aprovado' && new Date(u.data_expiracao) >= agora).length
      const expirados = perfis.filter(u => u.status === 'aprovado' && u.data_expiracao && new Date(u.data_expiracao) < agora).length
      setStats({ total, pendentes, aprovados, expirados })
      setUsuarios(perfis)
    }
    setLoading(false)
  }

  async function aprovar(usuario, dias = 30) {
    const expiracao = new Date()
    expiracao.setDate(expiracao.getDate() + dias)

    const { error } = await supabase.from('user_profiles').update({
      status: 'aprovado',
      data_aprovacao: new Date().toISOString(),
      data_expiracao: expiracao.toISOString()
    }).eq('id', usuario.id)

    if (error) { toast.error('Erro ao aprovar'); return }

    toast.success(`${usuario.full_name} aprovado por ${dias} dias!`)

    // Abre WhatsApp com mensagem para o usuário
    if (usuario.whatsapp) {
      const num = usuario.whatsapp.replace(/\D/g, '')
      const msg = encodeURIComponent(
        `Olá ${usuario.full_name}! 👋\n\nSeu acesso ao *Sistema de Advocacia* foi aprovado! ✅\n\nVocê tem *${dias} dias* de acesso a partir de hoje.\n\n🔗 Acesse: https://sistema-advocacia-eosin.vercel.app\n\nQualquer dúvida estou à disposição!`
      )
      window.open(`https://wa.me/55${num}?text=${msg}`, '_blank')
    }
    carregar()
  }

  async function recusar(usuario) {
    if (!confirm(`Recusar acesso de ${usuario.full_name}?`)) return
    const { error } = await supabase.from('user_profiles')
      .update({ status: 'recusado' }).eq('id', usuario.id)
    if (error) { toast.error('Erro ao recusar'); return }
    toast.success('Acesso recusado.')
    carregar()
  }

  async function estender(usuario) {
    const expiracao = new Date(usuario.data_expiracao || new Date())
    if (expiracao < new Date()) expiracao.setTime(new Date().getTime())
    expiracao.setDate(expiracao.getDate() + 30)

    const { error } = await supabase.from('user_profiles')
      .update({ data_expiracao: expiracao.toISOString(), status: 'aprovado' })
      .eq('id', usuario.id)
    if (error) { toast.error('Erro ao estender'); return }
    toast.success('Acesso estendido por +30 dias!')
    carregar()
  }

  async function excluir(usuario) {
    if (!confirm(`Excluir permanentemente "${usuario.full_name}"? Esta ação não pode ser desfeita.`)) return
    try {
      // Exclui o perfil primeiro
      await supabase.from('user_profiles').delete().eq('id', usuario.id)
      toast.success('Usuário excluído!')
      carregar()
    } catch (err) {
      toast.error('Erro ao excluir: ' + err.message)
    }
  }

  function diasRestantes(expiracao) {
    if (!expiracao) return null
    const diff = differenceInDays(new Date(expiracao), new Date())
    return diff
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">👥 Painel Admin</h2>
          <p className="page-subtitle">Gerencie os clientes do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total de usuários', value: stats.total, color: '#1B2B4B', icon: '👥' },
          { label: 'Aguardando aprovação', value: stats.pendentes, color: '#f59e0b', icon: '⏳' },
          { label: 'Ativos', value: stats.aprovados, color: '#22c55e', icon: '✅' },
          { label: 'Expirados', value: stats.expirados, color: '#ef4444', icon: '⏰' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 15 }}>
          Usuários cadastrados
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Expira em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">Nenhum usuário cadastrado</div></div></td></tr>
              ) : usuarios.map(u => {
                const dias = diasRestantes(u.data_expiracao)
                const expirado = u.data_expiracao && new Date(u.data_expiracao) < new Date()
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                      {u.is_admin && <span className="badge badge-blue" style={{ fontSize: 10, marginTop: 2 }}>Admin</span>}
                    </td>
                    <td>
                      {u.whatsapp ? (
                        <a href={`https://wa.me/55${u.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>
                          💬 {u.whatsapp}
                        </a>
                      ) : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td><StatusBadge status={u.status} expiracao={u.data_expiracao} /></td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td>
                      {u.data_expiracao ? (
                        <span style={{ fontSize: 13, fontWeight: 600, color: expirado ? '#ef4444' : dias <= 5 ? '#f59e0b' : '#22c55e' }}>
                          {expirado ? `Expirou há ${Math.abs(dias)}d` : `${dias} dia(s)`}
                        </span>
                      ) : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td>
                      <div className="table-actions">
                        {(u.status === 'pendente') && (
                          <button onClick={() => aprovar(u, 30)} className="btn-icon" title="Aprovar 30 dias"
                            style={{ color: '#22c55e', fontWeight: 700, fontSize: 12, padding: '4px 8px', border: '1px solid #22c55e', borderRadius: 6 }}>
                            ✅ Aprovar
                          </button>
                        )}
                        {(u.status === 'aprovado' || expirado) && !u.is_admin && (
                          <button onClick={() => estender(u)} className="btn-icon" title="Estender +30 dias"
                            style={{ color: '#3b82f6', fontWeight: 700, fontSize: 12, padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: 6 }}>
                            +30d
                          </button>
                        )}
                        {u.status !== 'recusado' && !u.is_admin && (
                          <button onClick={() => recusar(u)} className="btn-icon" title="Recusar acesso"
                            style={{ color: '#ef4444' }}>
                            🚫
                          </button>
                        )}
                        {!u.is_admin && (
                          <button onClick={() => excluir(u)} className="btn-icon" title="Excluir usuário"
                            style={{ color: '#ef4444' }}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
