import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '',
  cnpj: '',
  phone: '',
  email: '',
  address: '',
}

function maskCNPJ(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export default function Configuracoes() {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [officeId, setOfficeId] = useState(null)
  const [fazendoBackup, setFazendoBackup] = useState(false)
  const [ultimoBackup, setUltimoBackup] = useState(() => localStorage.getItem('ultimo_backup') || null)

  useEffect(() => { loadOffice() }, [])

  async function loadOffice() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('offices')
        .select('*')
        .single()
      if (error) throw error
      setOfficeId(data.id)
      setForm({
        name: data.name || '',
        cnpj: data.cnpj || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      })
    } catch (err) {
      toast.error('Erro ao carregar dados do escritório')
    } finally {
      setLoading(false)
    }
  }

  async function fazerBackup() {
    setFazendoBackup(true)
    try {
      const [
        { data: clientes },
        { data: processos },
        { data: tarefas },
        { data: financeiro },
        { data: eventos },
        { data: documentos },
      ] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('processes').select('*, clients(name)').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*, clients(name)').order('created_at', { ascending: false }),
        supabase.from('financial_records').select('*, clients(name)').order('created_at', { ascending: false }),
        supabase.from('events').select('*, clients(name)').order('date', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
      ])

      const backup = {
        sistema: 'JurisFlow — Gestão Jurídica Inteligente',
        data_backup: new Date().toLocaleString('pt-BR'),
        totais: {
          clientes: clientes?.length || 0,
          processos: processos?.length || 0,
          tarefas: tarefas?.length || 0,
          financeiro: financeiro?.length || 0,
          eventos: eventos?.length || 0,
          documentos: documentos?.length || 0,
        },
        dados: { clientes, processos, tarefas, financeiro, eventos, documentos },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dataHoje = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `jurisflow-backup-${dataHoje}.json`
      a.click()
      URL.revokeObjectURL(url)

      const agora = new Date().toLocaleString('pt-BR')
      setUltimoBackup(agora)
      localStorage.setItem('ultimo_backup', agora)
      toast.success('Backup realizado com sucesso!')
    } catch (err) {
      toast.error('Erro ao fazer backup: ' + err.message)
    } finally {
      setFazendoBackup(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome do escritório é obrigatório'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('offices')
        .update({
          name: form.name.trim(),
          cnpj: form.cnpj.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
        })
        .eq('id', officeId)
      if (error) throw error
      toast.success('Dados do escritório salvos!')
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Configurações do Escritório</h2>
          <p className="page-subtitle">Dados usados nos recibos e documentos gerados</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: '#1A1A2E' }}>🏛️ Dados do Escritório</h3>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 42 }} />)}
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Nome do escritório *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Silva & Marques Advocacia"
              />
            </div>

            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input
                className="form-input"
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })}
                placeholder="00.000.000/0001-00"
                maxLength={18}
              />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Aparece nos recibos gerados para NF. Sem CNPJ cadastrado, o recibo exibirá um aviso.
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@escritorio.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input
                className="form-input"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Backup */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#1A1A2E' }}>🔒 Backup dos Dados</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          Exporta todos os seus dados (clientes, processos, tarefas, financeiro, agenda) em um arquivo que você salva no computador.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>O que é salvo no backup?</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Clientes · Processos · Tarefas · Financeiro · Agenda · Documentos</div>
            </div>
          </div>

          {ultimoBackup && (
            <div style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280' }}>
              ✅ Último backup: <strong style={{ color: '#374151' }}>{ultimoBackup}</strong>
            </div>
          )}

          <button
            onClick={fazerBackup}
            disabled={fazendoBackup}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: fazendoBackup ? '#e5e7eb' : '#1B2B4B',
              color: fazendoBackup ? '#9ca3af' : '#fff',
              border: 'none', borderRadius: 10, padding: '13px 24px',
              fontSize: 14, fontWeight: 700, cursor: fazendoBackup ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {fazendoBackup ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid #9ca3af', borderTop: '2px solid #374151', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Gerando backup...
              </>
            ) : (
              <>⬇️ Fazer Backup Agora</>
            )}
          </button>

          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
            O arquivo será salvo na pasta de Downloads do seu computador
          </p>
        </div>
      </div>

      {/* Preview do recibo */}
      {!loading && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>👁️ Prévia — Como aparece nos recibos</h3>
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: 20,
            borderLeft: '4px solid #1B2B4B'
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1B2B4B', marginBottom: 6 }}>
              {form.name || 'Nome do Escritório'}
            </div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
              {form.cnpj ? (
                <span>CNPJ: {form.cnpj}<br /></span>
              ) : (
                <span style={{ color: '#e67e22' }}>⚠ CNPJ não cadastrado<br /></span>
              )}
              {form.address && <span>{form.address}<br /></span>}
              {form.phone && <span>Tel: {form.phone}<br /></span>}
              {form.email && <span>{form.email}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
