import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { useIsMobile } from '../hooks/useIsMobile'
import toast from 'react-hot-toast'
import { useError } from '../context/ErrorContext'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  isToday, differenceInDays, parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const typeColors = {
  audiencia: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6', label: 'Audiencia' },
  prazo:     { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Prazo' },
  reuniao:   { bg: '#dcfce7', text: '#15803d', dot: '#22c55e', label: 'Reuniao' },
  compromisso: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Compromisso' }
}

const emptyForm = {
  title: '', description: '', type: 'compromisso',
  date: format(new Date(), 'yyyy-MM-dd'), time: '',
  process_id: '', client_id: '', alert_days: 1, completed: false
}

export default function Agenda() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const showError = useError()
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    loadAll()
  }, [currentMonth])

  async function loadAll() {
    setLoading(true)
    setLoadError(null)
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const [{ data: evs }, { data: cls }, { data: procs }] = await Promise.all([
        supabase.from('events').select('*, clients(name), processes(number)')
          .gte('date', start).lte('date', end)
          .order('date', { ascending: true }).order('time', { ascending: true }),
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('processes').select('id, number').order('number')
      ])
      setEvents(evs || [])
      setClients(cls || [])
      setProcesses(procs || [])
    } catch (err) {
      setLoadError(err.message)
      showError('Erro ao carregar agenda: ' + err.message, 'Erro ao Carregar')
    } finally {
      setLoading(false)
    }
  }

  function openNew(date = null) {
    setForm({ ...emptyForm, date: date || format(new Date(), 'yyyy-MM-dd'), user_id: user.id })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(ev) {
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      type: ev.type || 'compromisso',
      date: ev.date || format(new Date(), 'yyyy-MM-dd'),
      time: ev.time ? ev.time.slice(0, 5) : '',
      process_id: ev.process_id || '',
      client_id: ev.client_id || '',
      alert_days: ev.alert_days || 1,
      completed: ev.completed || false
    })
    setEditingId(ev.id)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date) { showError('Título e data são obrigatórios.', 'Campo Obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        user_id: user.id,
        time: form.time || null,
        process_id: form.process_id || null,
        client_id: form.client_id || null
      }
      if (editingId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingId)
        if (error) throw error
        toast.success('Evento atualizado!')
      } else {
        const { error } = await supabase.from('events').insert(payload)
        if (error) throw error
        toast.success('Evento criado!')
      }
      setModalOpen(false)
      loadAll()
    } catch (err) {
      showError('Erro ao salvar evento: ' + err.message, 'Erro ao Salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setConfirmDelete(id)
  }

  async function confirmDeleteEvent() {
    const id = confirmDelete
    setConfirmDelete(null)
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      toast.success('Evento excluído!')
      loadAll()
    } catch (err) {
      showError('Erro ao excluir evento: ' + err.message, 'Erro ao Excluir')
    }
  }

  async function toggleComplete(ev) {
    try {
      const { error } = await supabase.from('events').update({ completed: !ev.completed }).eq('id', ev.id)
      if (error) throw error
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, completed: !e.completed } : e))
    } catch (err) {
      showError('Erro ao atualizar evento: ' + err.message, 'Erro')
    }
  }

  // Construcao do calendario
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  function getEventsForDay(day) {
    return events.filter(ev => ev.date === format(day, 'yyyy-MM-dd'))
  }

  const today = new Date()
  const urgentEvents = events.filter(ev => {
    if (ev.completed) return false
    try {
      const diff = differenceInDays(parseISO(ev.date), today)
      return diff >= 0 && diff <= 3
    } catch { return false }
  })

  // Eventos do dia selecionado ou todos do mes
  const displayEvents = selectedDay
    ? events.filter(ev => ev.date === format(selectedDay, 'yyyy-MM-dd'))
    : events

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Agenda</h2>
          <p className="page-subtitle">{events.length} evento(s) este mes</p>
        </div>
        <button className="btn-primary" onClick={() => openNew()}>+ Novo Evento</button>
      </div>

      {/* Alertas urgentes */}
      {urgentEvents.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, padding: 12, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b91c1c' }}>Atencao: eventos nos proximos 3 dias</div>
            <div style={{ fontSize: 12, color: '#ef4444' }}>
              {urgentEvents.map(e => e.title).join(' • ')}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 20 }}>
        {/* Calendario */}
        <div className="card">
          {/* Navegacao do mes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button className="btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ fontSize: 18, color: '#1B2B4B' }}>&#8249;</button>
            <h3 style={{ fontWeight: 700, fontSize: 17, textTransform: 'capitalize' }}>
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <button className="btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ fontSize: 18, color: '#1B2B4B' }}>&#8250;</button>
          </div>

          {/* Dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {weekDays.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: '#6b7280', textTransform: 'uppercase', padding: '4px 0'
              }}>{d}</div>
            ))}
          </div>

          {/* Dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calDays.map(day => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const isTodayDay = isToday(day)

              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  style={{
                    minHeight: 56,
                    padding: '6px 4px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? '#1B2B4B' : isTodayDay ? '#fffbeb' : 'transparent',
                    border: isTodayDay && !isSelected ? '1.5px solid #C9A84C' : '1.5px solid transparent',
                    opacity: isCurrentMonth ? 1 : 0.35,
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f3f4f6' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isTodayDay ? '#fffbeb' : 'transparent' }}
                >
                  <div style={{
                    fontSize: 12,
                    fontWeight: isTodayDay || isSelected ? 700 : 400,
                    color: isSelected ? '#C9A84C' : isTodayDay ? '#C9A84C' : '#1A1A2E',
                    textAlign: 'center',
                    marginBottom: 3
                  }}>
                    {format(day, 'd')}
                  </div>
                  {/* Pontos dos eventos */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: ev.completed ? '#d1d5db' : (typeColors[ev.type]?.dot || '#6b7280')
                      }} />
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 9, color: '#6b7280' }}>+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
            {Object.entries(typeColors).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.dot }} />
                <span style={{ color: '#6b7280' }}>{val.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>
              {selectedDay ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR }) : 'Eventos do Mes'}
            </h3>
            {selectedDay && (
              <button
                onClick={() => openNew(format(selectedDay, 'yyyy-MM-dd'))}
                style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                + Novo
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8 }} />)
            ) : loadError ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Erro ao carregar agenda</div>
                <button className="btn-primary" onClick={loadAll} style={{ fontSize: 13 }}>Tentar novamente</button>
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  {selectedDay ? 'Nenhum evento neste dia' : 'Nenhum evento este mes'}
                </div>
              </div>
            ) : (
              displayEvents.map(ev => {
                const colors = typeColors[ev.type] || { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' }
                const isUrgent = !ev.completed && (() => {
                  try { return differenceInDays(parseISO(ev.date), today) <= 3 && differenceInDays(parseISO(ev.date), today) >= 0 }
                  catch { return false }
                })()

                return (
                  <div key={ev.id} style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                    background: ev.completed ? '#f9fafb' : isUrgent ? '#fef2f2' : colors.bg,
                    border: `1px solid ${ev.completed ? '#e5e7eb' : isUrgent ? '#fecaca' : 'transparent'}`,
                    opacity: ev.completed ? 0.65 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={ev.completed}
                        onChange={() => toggleComplete(ev)}
                        style={{ marginTop: 2, cursor: 'pointer', accentColor: '#C9A84C' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: ev.completed ? '#9ca3af' : colors.text,
                          textDecoration: ev.completed ? 'line-through' : 'none'
                        }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {ev.date.split('-').reverse().join('/')}{ev.time ? ` ${ev.time.slice(0,5)}` : ''}
                          {ev.clients?.name ? ` • ${ev.clients.name}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button className="btn-icon" onClick={() => openEdit(ev)} style={{ fontSize: 14, padding: '2px 4px' }}>✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(ev.id)} style={{ fontSize: 14, padding: '2px 4px', color: '#ef4444' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmação excluir evento */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir evento"
        message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteEvent}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Modal novo/editar evento */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Evento' : 'Novo Evento'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Titulo *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Titulo do evento" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="audiencia">Audiencia</option>
                <option value="prazo">Prazo</option>
                <option value="reuniao">Reuniao</option>
                <option value="compromisso">Compromisso</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Horario</label>
              <input type="time" className="form-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Alertar com antecedencia (dias)</label>
              <input type="number" className="form-input" value={form.alert_days} onChange={e => setForm({...form, alert_days: parseInt(e.target.value) || 1})} min={1} max={30} />
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
              <label className="form-label">Processo</label>
              <select className="form-select" value={form.process_id} onChange={e => setForm({...form, process_id: e.target.value})}>
                <option value="">Selecionar processo</option>
                {processes.map(p => <option key={p.id} value={p.id}>{p.number}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descricao</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detalhes do evento..." rows={2} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Evento'}</button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (max-width: 1024px) {
          .agenda-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
