import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Cadastro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', senha: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome || !form.email || !form.whatsapp || !form.senha) {
      toast.error('Preencha todos os campos'); return
    }
    if (form.senha.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return }
    if (form.senha !== form.confirmar) { toast.error('Senhas não conferem'); return }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          data: { full_name: form.nome, whatsapp: form.whatsapp }
        }
      })
      if (error) throw error

      // Atualiza perfil com email, nome e whatsapp
      if (data.user) {
        await supabase.from('user_profiles')
          .update({ whatsapp: form.whatsapp, full_name: form.nome, email: form.email })
          .eq('id', data.user.id)
      }

      setSucesso(true)
    } catch (err) {
      const msg = err.message?.includes('already registered')
        ? 'Este email já está cadastrado.'
        : err.message || 'Erro ao cadastrar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1B2B4B 0%, #2a3f6f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B4B', marginBottom: 12 }}>Cadastro realizado!</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            Seu cadastro foi recebido com sucesso.<br />
            Nossa equipe irá analisar e entrar em contato pelo WhatsApp em breve para liberar seu acesso.
          </p>
          <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fcd34d', fontSize: 13, color: '#92400e', marginBottom: 24 }}>
            ⏳ Prazo de análise: até 24 horas úteis
          </div>
          <Link to="/login" style={{ color: '#C9A84C', fontWeight: 600, fontSize: 14 }}>
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B2B4B 0%, #2a3f6f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>⚖️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B4B', marginBottom: 4 }}>Criar conta</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Teste grátis por 30 dias após aprovação</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-input" value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Dr. João Silva" required />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp *</label>
            <input className="form-input" value={form.whatsapp}
              onChange={e => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="(31) 99999-9999" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input type="password" className="form-input" value={form.senha}
                onChange={e => setForm({ ...form, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar senha *</label>
              <input type="password" className="form-input" value={form.confirmar}
                onChange={e => setForm({ ...form, confirmar: e.target.value })}
                placeholder="Repita a senha" required />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
            {loading ? 'Cadastrando...' : '✅ Criar minha conta'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: '#C9A84C', fontWeight: 600 }}>Fazer login</Link>
        </div>
      </div>
    </div>
  )
}
