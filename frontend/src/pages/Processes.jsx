import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'
import { useError } from '../context/ErrorContext'
import { format } from 'date-fns'
import { useIsMobile } from '../hooks/useIsMobile'

const AREAS = ['Trabalhista', 'Civil', 'Criminal', 'Família', 'Tributário', 'Empresarial', 'Previdenciário', 'Outros']

const statusBadge = {
  ativo: 'badge-success',
  encerrado: 'badge-gray',
  suspenso: 'badge-warning'
}

const emptyForm = {
  number: '', client_id: '', area: 'Civil', phase: '',
  lawyer_id: '', status: 'ativo', description: ''
}

const emptyUpdate = { description: '', date: format(new Date(), 'yyyy-MM-dd') }

export default function Processes() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const showError = useError()
  const [processes, setProcesses] = useState([])
  const [clients, setClients] = useState([])
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [updates, setUpdates] = useState([])
  const [updateForm, setUpdateForm] = useState(emptyUpdate)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteUpdate, setConfirmDeleteUpdate] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setLoadError(null)
    try {
      const [
        { data: procs },
        { data: cls },
        { data: lwrs }
      ] = await Promise.all([
        supabase.from('processes').select('*, clients(name)').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('user_profiles').select('id, full_name').order('full_name')
      ])
      setProcesses(procs || [])
      setClients(cls || [])
      setLawyers(lwrs || [])
    } catch (err) {
      setLoadError(err.message)
      showError('Erro ao carregar processos: ' + err.message, 'Erro ao Carregar')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setForm({ ...emptyForm, lawyer_id: user.id })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(proc) {
    setForm({
      number: proc.number || '',
      client_id: proc.client_id || '',
      area: proc.area || 'Civil',
      phase: proc.phase || '',
      lawyer_id: proc.lawyer_id || '',
      status: proc.status || 'ativo',
      description: proc.description || ''
    })
    setEditingId(proc.id)
    setModalOpen(true)
  }

  async function openDetail(proc) {
    setSelected(proc)
    setDetailOpen(true)
    setUpdateForm(emptyUpdate)
    const { data } = await supabase
      .from('process_updates')
      .select('*')
      .eq('process_id', proc.id)
      .order('date', { ascending: false })
    setUpdates(data || [])
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.number.trim()) { showError('O número do processo é obrigatório.', 'Campo Obrigatório'); return }
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase.from('processes').update({
          ...form,
          client_id: form.client_id || null,
          lawyer_id: form.lawyer_id || null,
          phase: form.phase || null,
          description: form.description || null,
          updated_at: new Date().toISOString()
        }).eq('id', editingId)
        if (error) throw error
        toast.success('Processo atualizado!')
      } else {
        const { error } = await supabase.from('processes').insert({
          ...form,
          client_id: form.client_id || null,
          lawyer_id: form.lawyer_id || null,
          phase: form.phase || null,
          description: form.description || null
        })
        if (error) throw error
        toast.success('Processo cadastrado!')
      }
      setModalOpen(false)
      loadAll()
    } catch (err) {
      showError('Erro ao salvar: ' + err.message, 'Erro ao Salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(proc) {
    setConfirmDelete(proc)
  }

  async function confirmDeleteProcess() {
    const proc = confirmDelete
    setConfirmDelete(null)
    try {
      const { error } = await supabase.from('processes').delete().eq('id', proc.id)
      if (error) throw error
      toast.success('Processo excluído!')
      loadAll()
    } catch (err) {
      showError('Erro ao excluir: ' + err.message, 'Erro ao Excluir')
    }
  }

  async function handleAddUpdate(e) {
    e.preventDefault()
    if (!updateForm.description.trim()) { showError('A descrição do andamento é obrigatória.', 'Campo Obrigatório'); return }
    setSavingUpdate(true)
    try {
      const { error } = await supabase.from('process_updates').insert({
        process_id: selected.id,
        description: updateForm.description,
        date: updateForm.date,
        created_by: user.id
      })
      if (error) throw error
      toast.success('Andamento adicionado!')
      setUpdateForm(emptyUpdate)
      const { data } = await supabase
        .from('process_updates')
        .select('*')
        .eq('process_id', selected.id)
        .order('date', { ascending: false })
      setUpdates(data || [])
      await supabase.from('processes').update({ updated_at: new Date().toISOString() }).eq('id', selected.id)
    } catch (err) {
      showError('Erro ao adicionar andamento: ' + err.message, 'Erro ao Salvar')
    } finally {
      setSavingUpdate(false)
    }
  }

  async function handleDeleteUpdate(id) {
    setConfirmDeleteUpdate(id)
  }

  async function confirmDeleteUpdateFn() {
    const id = confirmDeleteUpdate
    setConfirmDeleteUpdate(null)
    try {
      const { error } = await supabase.from('process_updates').delete().eq('id', id)
      if (error) throw error
      setUpdates(prev => prev.filter(u => u.id !== id))
      toast.success('Andamento excluído!')
    } catch (err) {
      showError('Erro ao excluir andamento: ' + err.message, 'Erro ao Excluir')
    }
  }

  function formatDate(d) {
    if (!d) return '-'
    try { const [y,m,day] = d.split('T')[0].split('-'); return `${day}/${m}/${y}` } catch { return d }
  }

  const filtered = processes.filter(p => {
    const matchSearch = !search ||
      p.number?.toLowerCase().includes(search.toLowerCase()) ||
      p.clients?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchArea = !filterArea || p.area === filterArea
    return matchSearch && matchStatus && matchArea
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Processos</h2>
          <p className="page-subtitle">{processes.length} processo(s)</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo Processo</button>
      </div>

      <div className="filters-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por numero ou cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="encerrado">Encerrado</option>
          <option value="suspenso">Suspenso</option>
        </select>
        <select className="filter-select" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
          <option value="">Todas as areas</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Cliente</th>
                <th>Area</th>
                <th>Fase</th>
                <th>Advogado</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
                ))
              ) : loadError ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⚠️</div>
                      <div className="empty-state-text">Erro ao carregar dados</div>
                      <div className="empty-state-sub">{loadError}</div>
                      <button className="btn-primary" onClick={loadAll} style={{ marginTop: 12 }}>Tentar novamente</button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⚖️</div>
                      <div className="empty-state-text">Nenhum processo encontrado</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(proc => (
                  <tr key={proc.id}>
                    <td>
                      <button
                        onClick={() => openDetail(proc)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#1B2B4B', fontWeight: 600, fontSize: 14,
                          textDecoration: 'underline', padding: 0, fontFamily: 'inherit'
                        }}
                      >
                        {proc.number}
                      </button>
                    </td>
                    <td>{proc.clients?.name || '-'}</td>
                    <td>{proc.area}</td>
                    <td>{proc.phase || '-'}</td>
                    <td>{proc.user_profiles?.full_name || '-'}</td>
                    <td><span className={`badge ${statusBadge[proc.status] || 'badge-gray'}`}>{proc.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Ver detalhes" onClick={() => openDetail(proc)} style={{ color: '#3b82f6' }}>🔍</button>
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(proc)} style={{ color: '#1B2B4B' }}>✏️</button>
                        <button className="btn-icon" title="Excluir" onClick={() => handleDelete(proc)} style={{ color: '#ef4444' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmação excluir processo */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir processo"
        message={`Tem certeza que deseja excluir o processo "${confirmDelete?.number}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDeleteProcess}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Confirmação excluir andamento */}
      <ConfirmModal
        isOpen={!!confirmDeleteUpdate}
        title="Excluir andamento"
        message="Tem certeza que deseja excluir este andamento? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteUpdateFn}
        onCancel={() => setConfirmDeleteUpdate(null)}
      />

      {/* Modal novo/editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Processo' : 'Novo Processo'}>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Numero do processo *</label>
              <input className="form-input" value={form.number} onChange={e => setForm({...form, number: e.target.value})} placeholder="0000000-00.0000.0.00.0000" required />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select className="form-select" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                <option value="">Selecionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Advogado responsavel</label>
              <select className="form-select" value={form.lawyer_id} onChange={e => setForm({...form, lawyer_id: e.target.value})}>
                <option value="">Selecionar advogado</option>
                {lawyers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Area do direito</label>
              <select className="form-select" value={form.area} onChange={e => setForm({...form, area: e.target.value})}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fase processual</label>
              <input className="form-input" value={form.phase} onChange={e => setForm({...form, phase: e.target.value})} placeholder="ex: Instrucao, Recursal..." />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descricao</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Resumo do processo..." rows={3} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal detalhes + andamentos */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Processo ${selected?.number || ''}`} size="lg">
        {selected && (
          <div>
            {/* Info do processo */}
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12,
              padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 24,
              border: '1px solid #e5e7eb'
            }}>
              <div><div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Cliente</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selected.clients?.name || '-'}</div></div>
              <div><div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Area</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selected.area}</div></div>
              <div><div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Status</div><span className={`badge ${statusBadge[selected.status]}`}>{selected.status}</span></div>
              <div><div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Fase</div><div style={{ fontSize: 14 }}>{selected.phase || '-'}</div></div>
              <div><div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Advogado</div><div style={{ fontSize: 14 }}>{selected.user_profiles?.full_name || '-'}</div></div>
              <div><div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Cadastro</div><div style={{ fontSize: 14 }}>{formatDate(selected.created_at)}</div></div>
            </div>

            {selected.description && (
              <div style={{ marginBottom: 24, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>DESCRICAO</div>
                <p style={{ fontSize: 14, color: '#1A1A2E' }}>{selected.description}</p>
              </div>
            )}

            {/* Andamentos */}
            <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Historico de Andamentos</h4>

            {/* Form novo andamento */}
            <form onSubmit={handleAddUpdate} style={{ marginBottom: 20, padding: 16, background: '#f0f7ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', marginBottom: 12 }}>Adicionar Andamento</div>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <textarea
                  className="form-textarea"
                  value={updateForm.description}
                  onChange={e => setUpdateForm({...updateForm, description: e.target.value})}
                  placeholder="Descricao do andamento..."
                  rows={2}
                  style={{ gridColumn: '1' }}
                />
                <div>
                  <label className="form-label">Data</label>
                  <input
                    type="date"
                    className="form-input"
                    value={updateForm.date}
                    onChange={e => setUpdateForm({...updateForm, date: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={savingUpdate} style={{ fontSize: 13 }}>
                {savingUpdate ? 'Adicionando...' : '+ Adicionar'}
              </button>
            </form>

            {/* Lista andamentos */}
            {updates.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Nenhum andamento registrado</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {updates.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', gap: 12, padding: 12,
                    borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 60 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2B4B' }}>{formatDate(u.date)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: '#1A1A2E' }}>{u.description}</p>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>por {u.user_profiles?.full_name || 'Sistema'}</div>
                    </div>
                    <button className="btn-icon" onClick={() => handleDeleteUpdate(u.id)} style={{ color: '#ef4444', flexShrink: 0 }}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
