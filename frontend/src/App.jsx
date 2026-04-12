import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Processes from './pages/Processes'
import Agenda from './pages/Agenda'
import Financial from './pages/Financial'
import Documents from './pages/Documents'
import Perfil from './pages/Perfil'
import Admin from './pages/Admin'

function Carregando() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F4F6F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#1B2B4B', fontWeight: 500 }}>Carregando...</p>
      </div>
    </div>
  )
}

function BloqueadoPendente() {
  const { signOut, profile } = useAuth()
  const expirado = profile?.data_expiracao && new Date(profile.data_expiracao) < new Date()
  const recusado = profile?.status === 'recusado'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1B2B4B 0%, #2a3f6f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {recusado ? '🚫' : expirado ? '⏰' : '⏳'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1B2B4B', marginBottom: 12 }}>
          {recusado ? 'Acesso negado' : expirado ? 'Acesso expirado' : 'Aguardando aprovação'}
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
          {recusado
            ? 'Seu acesso foi recusado. Entre em contato conosco para mais informações.'
            : expirado
            ? 'Seu período de acesso expirou. Entre em contato para renovar.'
            : 'Seu cadastro está sendo analisado. Entraremos em contato pelo WhatsApp em breve!'
          }
        </p>
        <a href="https://wa.me/5531996031369" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', background: '#22c55e', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, marginBottom: 16, textDecoration: 'none' }}>
          💬 Falar no WhatsApp
        </a>
        <br />
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, marginTop: 8 }}>
          Sair
        </button>
      </div>
    </div>
  )
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, profile, loading, acessoLiberado } = useAuth()

  if (loading) return <Carregando />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Carregando />

  // Verifica admin para rotas admin
  if (adminOnly && !profile.is_admin) return <Navigate to="/" replace />

  // Bloqueia se pendente, recusado ou expirado (exceto admin)
  if (!acessoLiberado()) return <BloqueadoPendente />

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="processos" element={<Processes />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="financeiro" element={<Financial />} />
        <Route path="documentos" element={<Documents />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="admin" element={
          <PrivateRoute adminOnly>
            <Admin />
          </PrivateRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
