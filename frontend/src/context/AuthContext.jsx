import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Erro ao buscar perfil:', err.message)
      setProfile(null)
    }
  }

  // Quando a aba volta ao foco, renova o token silenciosamente (sem spinner)
  useEffect(() => {
    let lastVisible = Date.now()

    async function handleVisibility() {
      if (document.visibilityState === 'visible') {
        const ausente = Date.now() - lastVisible
        // Só renova se ficou mais de 5 minutos fora
        if (ausente > 5 * 60 * 1000) {
          try {
            const { data: { session } } = await supabase.auth.refreshSession()
            if (session?.user) setUser(session.user)
          } catch { /* token ainda válido, ignora */ }
        }
      } else {
        lastVisible = Date.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    // Timeout de segurança: nunca fica travado mais de 8 segundos
    const timeout = setTimeout(() => setLoading(false), 8000)

    // onAuthStateChange dispara INITIAL_SESSION imediatamente no Supabase v2
    // e trata todos os eventos subsequentes (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(timeout)
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else setProfile(null)
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  // Verifica se o acesso está liberado
  function acessoLiberado() {
    if (!profile) return false
    if (profile.is_admin) return true
    if (profile.status !== 'aprovado') return false
    if (profile.data_expiracao && new Date(profile.data_expiracao) < new Date()) return false
    return true
  }

  // Dias restantes de acesso
  function diasRestantes() {
    if (!profile?.data_expiracao) return null
    const diff = Math.ceil((new Date(profile.data_expiracao) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  const value = { user, profile, loading, signIn, signOut, acessoLiberado, diasRestantes, refreshProfile }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
