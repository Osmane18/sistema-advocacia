import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, isPast, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const PRIORIDADES = [
  { val: 'urgente', label: 'Urgente', color: '#dc2626', bg: '#fef2f2' },
  { val: 'alta',    label: 'Alta',    color: '#ea580c', bg: '#fff7ed' },
  { val: 'normal',  label: 'Normal',  color: '#2563eb', bg: '#eff6ff' },
  { val: 'baixa',   label: 'Baixa',   color: '#6b7280', bg: '#f9fafb' },
]

const STATUS = [
  { val: 'pendente',     label: 'Pendente',      color: '#f59e0b' },
  { val: 'em_andamento', label: 'Em andamento',  color: '#3b82f6' },
  { val: 'concluida',    label: 'Concluída',     color: '#22c55e' },
]

const emptyForm = {
  title: '', description: '', due_date: '', priority: 'normal',
  status: 'pendente', process_id: '', client_id: ''
}

function getPrioridade(val) { return PRIORIDADES.find(p => p.val === val) || PRIORIDADES[2] }
function getStatus(val) { return STATUS.find(s => s.val === val) || STATUS[0] }

function formatDate(str) {
  if (!str) return null
  try { return format(parseISO(str), 'dd/MM/yyyy', { locale: ptBR }) } catch { return str }
}

function TagPrioridade({ val }) {
  const p = getPrioridade(val)
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: p.bg, color: p.color, border: `1px solid ${p.color}30`
    }}>
      {p.label}
    </span>
  )
}

function TagStatus({ val }) {
  const s = getStatus(val)
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: s.color + '18', color: s.color, border: `1px solid ${s.color}30`
    }}>
      {s.label}
    </span>
  )
}

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [processes, setProcesses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmarExcluir, setConfirmarExcluir] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: t }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('tasks').select('*, clients(name), processes(number)')
        .order('due_date', { ascending: true, nullsLast: true })
        .order('priority', { ascending: true }),
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('processes').select('id, number').eq('status', 'ativo').order('number'),
    ])
    setTasks(t || [])
    setClients(c || [])
    setProcesses(p || [])
  }

  function abrirNova() {
    setEditando(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function abrirEditar(task) {
    setEditando(task)
    setForm({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority || 'normal',
      status: task.status || 'pendente',
      process_id: task.process_id || '',
      client_id: task.client_id || '',
    })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title) { toast.error('Informe o título da tarefa.'); return }
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
      process_id: form.process_id || null,
      client_id: form.client_id || null,
    }
    let error
    if (editando) {
      ({ error } = await supabase.from('tasks').update(payload).eq('id', editando.id))
    } else {
      ({ error } = await supabase.from('tasks').insert({ ...payload, created_by: user.id }))
    }
    if (error) { toast.error('Erro: ' + error.message); setSaving(false); return }
    toast.success(editando ? 'Tarefa atualizada!' : 'Tarefa criada!')
    setModalOpen(false)
    setEditando(null)
    loadData()
    setSaving(false)
  }

  async function concluir(task) {
    const novoStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
    await supabase.from('tasks').update({ status: novoStatus }).eq('id', task.id)
    toast.success(novoStatus === 'concluida' ? 'Tarefa concluída!' : 'Tarefa reaberta!')
    loadData()
  }

  async function excluir(id) {
    await supabase.from('tasks').delete().eq('id', id)
    toast.success('Tarefa excluída.')
    setConfirmarExcluir(null)
    loadData()
  }

  // Filtros
  let filtradas = tasks
  if (filtroStatus) filtradas = filtradas.filter(t => t.status === filtroStatus)
  if (filtroPrioridade) filtradas = filtradas.filter(t => t.priority === filtroPrioridade)

  // Contadores
  const pendentes = tasks.filter(t => t.status === 'pendente').length
  const urgentes = tasks.filter(t => t.priority === 'urgente' && t.status !== 'concluida').length
  const vencidas = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'concluida').length
  const hoje = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)) && t.status !== 'concluida').length

  return (
    <div className="fade-in">

      {/* Alertas */}
      {(urgentes > 0 || vencidas > 0 || hoje > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {vencidas > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fecaca', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
              <span style={{ fontSize: 20 }}>🚨</span>
              {vencidas} tarefa(s) com prazo vencido
            </div>
          )}
          {hoje > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #fde68a', fontSize: 14, fontWeight: 600, color: '#b45309' }}>
              <span style={{ fontSize: 20 }}>⏰</span>
              {hoje} tarefa(s) com prazo para hoje
            </div>
          )}
          {urgentes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#fff7ed', border: '1.5px solid #fed7aa', fontSize: 14, fontWeight: 600, color: '#ea580c' }}>
              <span style={{ fontSize: 20 }}>🔴</span>
              {urgentes} tarefa(s) urgente(s) pendente(s)
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>✅ Tarefas</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{pendentes} pendente(s) · {tasks.filter(t => t.status === 'concluida').length} concluída(s)</p>
        </div>
        <button
          onClick={abrirNova}
          style={{ background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
        >
          + Nova Tarefa
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Todos os status</option>
          {STATUS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
        </select>
        <select
          value={filtroPrioridade}
          onChange={e => setFiltroPrioridade(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
        </select>
        <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4 }}>{filtradas.length} tarefa(s)</span>
      </div>

      {/* Lista de tarefas */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filtradas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Nenhuma tarefa encontrada.</p>
            <button onClick={abrirNova} style={{ marginTop: 16, background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
              Criar primeira tarefa
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtradas.map((task, i) => {
              const vencida = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'concluida'
              const prazoHoje = task.due_date && isToday(parseISO(task.due_date)) && task.status !== 'concluida'
              const concluida = task.status === 'concluida'
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < filtradas.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: vencida ? '#fef2f2' : prazoHoje ? '#fffbeb' : '#fff',
                  opacity: concluida ? 0.6 : 1,
                  transition: 'background 0.2s',
                }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => concluir(task)}
                    style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2,
                      border: `2px solid ${concluida ? '#22c55e' : '#d1d5db'}`,
                      background: concluida ? '#22c55e' : '#fff',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 14, fontWeight: 700,
                    }}
                  >
                    {concluida ? '✓' : ''}
                  </button>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 600, color: '#1A1A2E',
                        textDecoration: concluida ? 'line-through' : 'none',
                      }}>
                        {task.title}
                      </span>
                      <TagPrioridade val={task.priority} />
                      <TagStatus val={task.status} />
                      {vencida && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>● VENCIDA</span>}
                      {prazoHoje && <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>● HOJE</span>}
                    </div>
                    {task.description && (
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0', lineHeight: 1.4 }}>{task.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                      {task.due_date && (
                        <span style={{ fontSize: 12, color: vencida ? '#dc2626' : prazoHoje ? '#b45309' : '#6b7280', fontWeight: vencida || prazoHoje ? 700 : 400 }}>
                          📅 {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.clients?.name && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>👤 {task.clients.name}</span>
                      )}
                      {task.processes?.number && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>⚖️ {task.processes.number}</span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => abrirEditar(task)} style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '5px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✏️</button>
                    <button onClick={() => setConfirmarExcluir(task)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal confirmar exclusão */}
      {confirmarExcluir && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🗑️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Excluir tarefa?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}><strong>{confirmarExcluir.title}</strong> será removida.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setConfirmarExcluir(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => excluir(confirmarExcluir.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#1A1A2E' }}>
                ✅ {editando ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Título *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Protocolar petição no TRT"
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Detalhes da tarefa..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prioridade</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                    {PRIORIDADES.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                    {STATUS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prazo</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Cliente</label>
                  <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                    <option value="">Nenhum</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Processo</label>
                  <select value={form.process_id} onChange={e => setForm(f => ({ ...f, process_id: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                    <option value="">Nenhum</option>
                    {processes.map(p => <option key={p.id} value={p.id}>{p.number}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Salvando...' : editando ? 'Atualizar' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
