import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'
import { useError } from '../context/ErrorContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'

function gerarPDFNF(rec, office, advogado) {
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const fmtDate = (d) => {
    if (!d) return '-'
    try { const [y, m, day] = d.split('T')[0].split('-'); return `${day}/${m}/${y}` } catch { return d }
  }
  const numero = Math.floor(Math.random() * 900000 + 100000)
  const hoje = format(new Date(), 'dd/MM/yyyy')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Honorários - ${rec.clients?.name || 'Cliente'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1B2B4B; padding-bottom: 20px; margin-bottom: 24px; }
    .office-name { font-size: 20px; font-weight: 700; color: #1B2B4B; }
    .office-info { font-size: 11px; color: #555; margin-top: 4px; line-height: 1.6; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 16px; font-weight: 700; color: #1B2B4B; text-transform: uppercase; }
    .doc-title p { font-size: 11px; color: #777; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; color: #1B2B4B; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 2px; }
    .field span { font-size: 13px; color: #1a1a1a; font-weight: 500; }
    .value-box { background: #f0f4ff; border: 2px solid #1B2B4B; border-radius: 8px; padding: 16px 20px; text-align: center; margin: 20px 0; }
    .value-box .label { font-size: 11px; color: #555; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
    .value-box .amount { font-size: 28px; font-weight: 700; color: #1B2B4B; }
    .description-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.6; color: #374151; }
    .notice { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px; margin-top: 24px; font-size: 12px; color: #92400e; line-height: 1.6; }
    .notice strong { display: block; margin-bottom: 4px; }
    .footer { border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    .signature { margin-top: 48px; display: flex; justify-content: center; }
    .signature-line { text-align: center; }
    .signature-line .line { border-top: 1px solid #1a1a1a; width: 260px; margin-bottom: 6px; }
    .signature-line p { font-size: 12px; color: #374151; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="office-name">${office?.name || advogado || 'Escritório de Advocacia'}</div>
      <div class="office-info">
        ${office?.cnpj ? `CNPJ: ${office.cnpj}<br>` : '<span style="color:#e67e22">⚠ CNPJ não cadastrado — preencha nas configurações</span><br>'}
        ${office?.address ? office.address + '<br>' : ''}
        ${office?.phone ? 'Tel: ' + office.phone + '<br>' : ''}
        ${office?.email ? office.email : ''}
      </div>
    </div>
    <div class="doc-title">
      <h2>Recibo de Honorários</h2>
      <p>Nº ${numero}</p>
      <p>Data de emissão: ${hoje}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Cliente / Tomador</div>
    <div class="grid">
      <div class="field"><label>Nome / Razão Social</label><span>${rec.clients?.name || 'Não informado'}</span></div>
      <div class="field"><label>Processo vinculado</label><span>${rec.processes?.number || '-'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Descrição do Serviço</div>
    <div class="description-box">${rec.description || 'Prestação de serviços advocatícios'}</div>
  </div>

  <div class="value-box">
    <div class="label">Valor dos Honorários</div>
    <div class="amount">${fmt(rec.amount)}</div>
  </div>

  <div class="section">
    <div class="section-title">Datas</div>
    <div class="grid">
      <div class="field"><label>Vencimento</label><span>${fmtDate(rec.due_date)}</span></div>
      <div class="field"><label>Data do Pagamento</label><span>${fmtDate(rec.paid_date)}</span></div>
    </div>
  </div>

  <div class="signature">
    <div class="signature-line">
      <div class="line"></div>
      <p><strong>${advogado || office?.name || 'Advogado(a)'}</strong></p>
      <p>Advogado(a) Responsável</p>
    </div>
  </div>

  <div class="notice">
    <strong>⚠ Atenção — Para fins fiscais:</strong>
    Use os dados acima para emitir a Nota Fiscal de Serviços (NFS-e) no portal da sua prefeitura.
    Este recibo não substitui a Nota Fiscal eletrônica obrigatória.
  </div>

  <div class="footer">
    <span>Documento gerado em ${hoje}</span>
    <span>Sistema de Gestão Advocacia</span>
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html)
  w.document.close()
}

const statusBadge = {
  pago:     'badge-success',
  pendente: 'badge-warning',
  atrasado: 'badge-danger'
}

const typeLabels = {
  honorario: 'Honorario',
  pagamento: 'Pagamento',
  despesa: 'Despesa'
}

const emptyForm = {
  client_id: '', process_id: '',
  type: 'honorario', description: '',
  amount: '', due_date: format(new Date(), 'yyyy-MM-dd'),
  paid_date: '', status: 'pendente'
}

function SummaryCard({ label, value, icon, color, loading }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: color + '20', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>{label}</div>
        {loading ? <div className="skeleton" style={{ width: 80, height: 24 }} /> :
          <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>}
      </div>
    </div>
  )
}

export default function Financial() {
  const { user, profile } = useAuth()
  const showError = useError()
  const [records, setRecords] = useState([])
  const [clients, setClients] = useState([])
  const [processes, setProcesses] = useState([])
  const [office, setOffice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ total: 0, monthIn: 0, monthOut: 0, pending: 0 })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    setLoadError(null)
    try {
      const [{ data: recs }, { data: cls }, { data: procs }, { data: officeData }] = await Promise.all([
        supabase.from('financial_records').select('*, clients(name), processes(number)')
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('processes').select('id, number').order('number'),
        supabase.from('offices').select('*').single()
      ])
      setOffice(officeData || null)
      setRecords(recs || [])
      setClients(cls || [])
      setProcesses(procs || [])

      // Calcular stats
      const now = new Date()
      const mStart = format(startOfMonth(now), 'yyyy-MM-dd')
      const mEnd = format(endOfMonth(now), 'yyyy-MM-dd')
      const totalReceita = (recs || []).filter(r => r.type !== 'despesa' && r.status === 'pago').reduce((s, r) => s + (r.amount || 0), 0)
      const monthIn = (recs || []).filter(r => r.type !== 'despesa' && r.status === 'pago' && r.paid_date >= mStart && r.paid_date <= mEnd).reduce((s, r) => s + (r.amount || 0), 0)
      const monthOut = (recs || []).filter(r => r.type === 'despesa' && r.paid_date >= mStart && r.paid_date <= mEnd).reduce((s, r) => s + (r.amount || 0), 0)
      const pending = (recs || []).filter(r => r.status === 'pendente' || r.status === 'atrasado').reduce((s, r) => s + (r.amount || 0), 0)
      setStats({ total: totalReceita, monthIn, monthOut, pending })
    } catch (err) {
      setLoadError(err.message)
      showError('Erro ao carregar financeiro: ' + err.message, 'Erro ao Carregar')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(rec) {
    setForm({
      client_id: rec.client_id || '',
      process_id: rec.process_id || '',
      type: rec.type || 'honorario',
      description: rec.description || '',
      amount: rec.amount?.toString() || '',
      due_date: rec.due_date || '',
      paid_date: rec.paid_date || '',
      status: rec.status || 'pendente'
    })
    setEditingId(rec.id)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.description.trim() || !form.amount) { showError('Descrição e valor são obrigatórios.', 'Campo Obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        client_id: form.client_id || null,
        process_id: form.process_id || null,
        paid_date: form.paid_date || null,
        due_date: form.due_date || null,
        created_by: user.id
      }
      if (editingId) {
        const { error } = await supabase.from('financial_records').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Lancamento atualizado!')
      } else {
        const { error } = await supabase.from('financial_records').insert(payload)
        if (error) throw error
        toast.success('Lancamento criado!')
      }
      setModalOpen(false)
      loadAll()
    } catch (err) {
      showError('Erro ao salvar lançamento: ' + err.message, 'Erro ao Salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setConfirmDelete(id)
  }

  async function confirmDeleteRecord() {
    const id = confirmDelete
    setConfirmDelete(null)
    try {
      const { error } = await supabase.from('financial_records').delete().eq('id', id)
      if (error) throw error
      toast.success('Lançamento excluído!')
      loadAll()
    } catch (err) {
      showError('Erro ao excluir lançamento: ' + err.message, 'Erro ao Excluir')
    }
  }

  function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  }

  function fmtDate(d) {
    if (!d) return '-'
    try { const [y,m,day] = d.split('T')[0].split('-'); return `${day}/${m}/${y}` } catch { return d }
  }

  const filtered = records.filter(r => {
    const matchType = !filterType || r.type === filterType
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchType && matchStatus
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Financeiro</h2>
          <p className="page-subtitle">{records.length} lancamento(s)</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo Lancamento</button>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard label="Receita Total" value={fmt(stats.total)} icon="💰" color="#16a34a" loading={loading} />
        <SummaryCard label="Receitas do Mes" value={fmt(stats.monthIn)} icon="📈" color="#1B2B4B" loading={loading} />
        <SummaryCard label="Despesas do Mes" value={fmt(stats.monthOut)} icon="📉" color="#ef4444" loading={loading} />
        <SummaryCard label="Pendentes/Atrasados" value={fmt(stats.pending)} icon="⚠️" color="#f59e0b" loading={loading} />
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="honorario">Honorario</option>
          <option value="pagamento">Pagamento</option>
          <option value="despesa">Despesa</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descricao</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Pago em</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
                ))
              ) : loadError ? (
                <tr>
                  <td colSpan={8}>
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
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <div className="empty-state-text">Nenhum lancamento encontrado</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: rec.type === 'despesa' ? '#fee2e2' : '#dcfce7',
                        color: rec.type === 'despesa' ? '#b91c1c' : '#15803d'
                      }}>
                        {typeLabels[rec.type] || rec.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{rec.description}</td>
                    <td>{rec.clients?.name || '-'}</td>
                    <td style={{ fontWeight: 700, color: rec.type === 'despesa' ? '#ef4444' : '#16a34a' }}>
                      {rec.type === 'despesa' ? '-' : '+'}{fmt(rec.amount)}
                    </td>
                    <td>{fmtDate(rec.due_date)}</td>
                    <td>{fmtDate(rec.paid_date)}</td>
                    <td><span className={`badge ${statusBadge[rec.status] || 'badge-gray'}`}>{rec.status}</span></td>
                    <td>
                      <div className="table-actions">
                        {rec.type !== 'despesa' && (
                          <button
                            className="btn-icon"
                            onClick={() => gerarPDFNF(rec, office, profile?.full_name)}
                            title="Gerar recibo / dados para NF"
                            style={{ color: '#7c3aed' }}
                          >
                            📄
                          </button>
                        )}
                        <button className="btn-icon" onClick={() => openEdit(rec)} title="Editar" style={{ color: '#1B2B4B' }}>✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(rec.id)} title="Excluir" style={{ color: '#ef4444' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmação excluir lançamento */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir lançamento"
        message="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteRecord}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Lancamento' : 'Novo Lancamento'}>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="honorario">Honorario</option>
                <option value="pagamento">Pagamento</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descricao *</label>
            <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descricao do lancamento" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input type="number" step="0.01" min="0" className="form-input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0,00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Vencimento</label>
              <input type="date" className="form-input" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
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
              <label className="form-label">Data do pagamento</label>
              <input type="date" className="form-input" value={form.paid_date} onChange={e => setForm({...form, paid_date: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Processo vinculado</label>
            <select className="form-select" value={form.process_id} onChange={e => setForm({...form, process_id: e.target.value})}>
              <option value="">Selecionar processo</option>
              {processes.map(p => <option key={p.id} value={p.id}>{p.number}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Lancamento'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
