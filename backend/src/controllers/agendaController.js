const { supabase } = require('../config/supabase')

// Listar eventos
async function getEvents(req, res) {
  const { start, end, type, completed } = req.query

  let query = supabase
    .from('events')
    .select('*, clients(name), processes(number)')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (start) query = query.gte('date', start)
  if (end) query = query.lte('date', end)
  if (type) query = query.eq('type', type)
  if (completed !== undefined) query = query.eq('completed', completed === 'true')

  const { data, error } = await query
  if (error) throw error

  res.json(data)
}

// Criar evento
async function createEvent(req, res) {
  const { title, description, type, date, time, process_id, client_id, alert_days, completed } = req.body

  if (!title?.trim() || !date) {
    return res.status(400).json({ error: 'Titulo e data sao obrigatorios' })
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title, description, type: type || 'compromisso',
      date, time: time || null,
      process_id: process_id || null,
      client_id: client_id || null,
      user_id: req.user.sub,
      alert_days: alert_days || 1,
      completed: completed || false
    })
    .select()
    .single()

  if (error) throw error
  res.status(201).json(data)
}

// Atualizar evento
async function updateEvent(req, res) {
  const { id } = req.params
  const { title, description, type, date, time, process_id, client_id, alert_days, completed } = req.body

  const { data, error } = await supabase
    .from('events')
    .update({ title, description, type, date, time, process_id, client_id, alert_days, completed })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) return res.status(404).json({ error: 'Evento nao encontrado' })

  res.json(data)
}

// Excluir evento
async function deleteEvent(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
  res.status(204).end()
}

// Marcar como concluido
async function toggleEvent(req, res) {
  const { id } = req.params
  const { data: ev } = await supabase.from('events').select('completed').eq('id', id).single()
  if (!ev) return res.status(404).json({ error: 'Evento nao encontrado' })

  const { data, error } = await supabase
    .from('events')
    .update({ completed: !ev.completed })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  res.json(data)
}

module.exports = { getEvents, createEvent, updateEvent, deleteEvent, toggleEvent }
