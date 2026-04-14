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
