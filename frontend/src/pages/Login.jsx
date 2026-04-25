import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [esqueciSenha, setEsqueciSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const { signIn } = useAuth()

  async function handleEsqueciSenha(e) {
    e.preventDefault()
    if (!email) return toast.error('Digite seu e-mail primeiro')
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`
    })
    setEnviando(false)
    if (error) return toast.error('Erro ao enviar e-mail: ' + error.message)
    toast.success('E-mail enviado! Verifique sua caixa de entrada.')
    setEsqueciSenha(false)
  }
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha email e senha')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Bem-vindo!')
      navigate('/')
    } catch (err) {
      const msg = err.message?.includes('Invalid login credentials')
        ? 'Email ou senha incorretos'
        : err.message || 'Erro ao fazer login'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B2B4B 0%, #2a3f6f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 48,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⚖️</div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1B2B4B',
            marginBottom: 6
          }}>
            Sistema de Advocacia
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Gestao completa para seu escritorio
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -8 }}>
            <button type="button" onClick={() => setEsqueciSenha(true)}
              style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '13px',
              fontSize: 15
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7280' }}>
          Não tem conta?{' '}
          <Link to="/cadastro" style={{ color: '#C9A84C', fontWeight: 600 }}>Criar conta grátis</Link>
        </div>

        {/* Modal esqueci senha */}
        {esqueciSenha && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B4B', marginBottom: 8 }}>Redefinir senha</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
              <form onSubmit={handleEsqueciSenha}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setEsqueciSenha(false)}
                    style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={enviando}
                    style={{ flex: 2, background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>
                    {enviando ? 'Enviando...' : 'Enviar link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mensagem de segurança */}
        <div style={{ marginTop: 24, padding: '10px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🔒</span>
          <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Seus dados estão protegidos e seguros</span>
        </div>
      </div>
    </div>
  )
}
