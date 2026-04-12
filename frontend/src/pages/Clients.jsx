import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'
import { useError } from '../context/ErrorContext'
import { format } from 'date-fns'

const emptyForm = {
  name: '', cpf_cnpj: '', phone: '', email: '', address: '', notes: ''
}

export default function Clients() {
  const { user } = useAuth()
  const showError = useError()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // cliente a excluir

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      showError('Erro ao carregar clientes: ' + err.message, 'Erro ao Carregar')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(client) {
    setForm({
      name: client.name || '',
      cpf_cnpj: client.cpf_cnpj || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || ''
    })
    setEditingId(client.id)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { showError('O nome do cliente é obrigatório.', 'Campo Obrigatório'); return }
    if (!user) { showError('Sessão expirada. Recarregue a página e faça login novamente.', 'Sessão Expirada'); return }
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (error) throw error
        toast.success('Cliente atualizado!')
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ ...form, created_by: user.id })
        if (error) throw error
        toast.success('Cliente cadastrado!')
      }
      setModalOpen(false)
      loadClients()
    } catch (err) {
      showError('Erro ao salvar: ' + (err.message || JSON.stringify(err)), 'Erro ao Salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(client) {
    setConfirmDelete(client)
  }

  async function confirmDeleteClient() {
    const client = confirmDelete
    setConfirmDelete(null)
    try {
      const { error } = await supabase.from('clients').delete().eq('id', client.id)
      if (error) throw error
      toast.success('Cliente excluído!')
      loadClients()
    } catch (err) {
      showError('Erro ao excluir: ' + err.message, 'Erro ao Excluir')
    }
  }

  function formatDate(d) {
    if (!d) return '-'
    try { return format(new Date(d), 'dd/MM/yyyy') } catch { return d }
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf_cnpj?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Clientes</h2>
          <p className="page-subtitle">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo Cliente</button>
      </div>

      <div className="filters-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Cadastro</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-text">
                        {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </div>
                      {!search && <div className="empty-state-sub">Clique em "Novo Cliente" para comecar</div>}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(client => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                    <td>{client.cpf_cnpj || '-'}</td>
                    <td>{client.phone || '-'}</td>
                    <td>{client.email || '-'}</td>
                    <td>{formatDate(client.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        {client.phone && (
                          <a
                            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon"
                            title="Abrir WhatsApp"
                            style={{ color: '#22c55e' }}
                          >
                            💬
                          </a>
                        )}
                        <button
                          className="btn-icon"
                          title="Editar"
                          onClick={() => openEdit(client)}
                          style={{ color: '#1B2B4B' }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          title="Excluir"
                          onClick={() => handleDelete(client)}
                          style={{ color: '#ef4444' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir o cliente "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDeleteClient}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Modal novo/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CPF / CNPJ</label>
              <input
                className="form-input"
                value={form.cpf_cnpj}
                onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
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
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereco</label>
            <input
              className="form-input"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Rua, numero, bairro, cidade"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observacoes</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Informacoes adicionais..."
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar Alteracoes' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
