import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Perfil() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    oab: profile?.oab || '',
    phone: profile?.phone || '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        oab: profile.oab || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])
  const [senhas, setSenhas] = useState({ nova: '', confirmar: '' })
  const [salvando, setSalvando] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  async function salvarPerfil(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Nome é obrigatório'); return }
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: form.full_name, oab: form.oab, phone: form.phone })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Perfil atualizado!')
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarSenha(e) {
    e.preventDefault()
    if (senhas.nova.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return }
    if (senhas.nova !== senhas.confirmar) { toast.error('Senhas não conferem'); return }
    setSalvandoSenha(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Faça login novamente.')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ password: senhas.nova }),
        signal: AbortSignal.timeout(10000)
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result?.msg || result?.message || 'Erro ao alterar senha')

      toast.success('Senha alterada com sucesso!')
      setSenhas({ nova: '', confirmar: '' })
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        toast.error('Tempo esgotado. Tente novamente.')
      } else {
        toast.error(err.message || 'Erro ao alterar senha')
      }
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Meu Perfil</h2>
          <p className="page-subtitle">Gerencie seus dados e senha de acesso</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#1B2B4B', color: '#C9A84C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, flexShrink: 0
        }}>
          {form.full_name ? form.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E' }}>{form.full_name || 'Usuário'}</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</div>
          <div style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600, marginTop: 4 }}>
            {profile?.role === 'admin' ? '👑 Administrador' : '⚖️ Advogado'}
          </div>
        </div>
      </div>

      {/* Dados do perfil */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#1A1A2E' }}>👤 Dados Pessoais</h3>
        <form onSubmit={salvarPerfil}>
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input
              className="form-input"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">OAB</label>
              <input
                className="form-input"
                value={form.oab}
                onChange={e => setForm({ ...form, oab: e.target.value })}
                placeholder="Ex: MG 123456"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone / WhatsApp</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>O email não pode ser alterado.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : '💾 Salvar Dados'}
            </button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#1A1A2E' }}>🔒 Alterar Senha</h3>
        <form onSubmit={salvarSenha}>
          <div className="form-group">
            <label className="form-label">Nova senha</label>
            <input
              type="password"
              className="form-input"
              value={senhas.nova}
              onChange={e => setSenhas({ ...senhas, nova: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar nova senha</label>
            <input
              type="password"
              className="form-input"
              value={senhas.confirmar}
              onChange={e => setSenhas({ ...senhas, confirmar: e.target.value })}
              placeholder="Repita a nova senha"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={salvandoSenha}>
              {salvandoSenha ? 'Alterando...' : '🔑 Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
