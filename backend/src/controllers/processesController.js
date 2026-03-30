const { supabase } = require('../config/supabase')

// Listar processos
async function getProcesses(req, res) {
  const { status, area, search, limit = 100, offset = 0 } = req.query

  let query = supabase
    .from('processes')
    .select('*, clients(name), user_profiles!processes_lawyer_id_fkey(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (status) query = query.eq('status', status)
  if (area) query = query.eq('area', area)
  if (search) query = query.ilike('number', `%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  res.json({ data, count })
}

// Buscar processo por ID com andamentos
async function getProcessById(req, res) {
  const { id } = req.params

  const [{ data: proc, error: procErr }, { data: updates, error: updErr }] = await Promise.all([
    supabase.from('processes').select('*, clients(name), user_profiles!processes_lawyer_id_fkey(full_name)').eq('id', id).single(),
    supabase.from('process_updates').select('*, user_profiles(full_name)').eq('process_id', id).order('date', { ascending: false })
  ])

  if (procErr) throw procErr
  if (!proc) return res.status(404).json({ error: 'Processo nao encontrado' })

  res.json({ ...proc, updates: updates || [] })
}

// Criar processo
async function createProcess(req, res) {
  const { number, client_id, area, phase, lawyer_id, status, description } = req.body

  if (!number?.trim()) return res.status(400).json({ error: 'Numero do processo obrigatorio' })

  const { data, error } = await supabase
    .from('processes')
    .insert({ number, client_id, area, phase, lawyer_id, status: status || 'ativo', description })
    .select()
    .single()

  if (error) throw error
  res.status(201).json(data)
}

// Atualizar processo
async function updateProcess(req, res) {
  const { id } = req.params
  const { number, client_id, area, phase, lawyer_id, status, description } = req.body

  const { data, error } = await supabase
    .from('processes')
    .update({ number, client_id, area, phase, lawyer_id, status, description })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) return res.status(404).json({ error: 'Processo nao encontrado' })

  res.json(data)
}

// Excluir processo
async function deleteProcess(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('processes').delete().eq('id', id)
  if (error) throw error
  res.status(204).end()
}

// Adicionar andamento
async function addProcessUpdate(req, res) {
  const { id } = req.params
  const { description, date } = req.body

  if (!description?.trim()) return res.status(400).json({ error: 'Descricao obrigatoria' })

  const { data, error } = await supabase
    .from('process_updates')
    .insert({ process_id: id, description, date: date || new Date().toISOString().split('T')[0], created_by: req.user.sub })
    .select()
    .single()

  if (error) throw error

  // Atualiza updated_at do processo
  await supabase.from('processes').update({ updated_at: new Date().toISOString() }).eq('id', id)

  res.status(201).json(data)
}

// Excluir andamento
async function deleteProcessUpdate(req, res) {
  const { updateId } = req.params
  const { error } = await supabase.from('process_updates').delete().eq('id', updateId)
  if (error) throw error
  res.status(204).end()
}

module.exports = { getProcesses, getProcessById, createProcess, updateProcess, deleteProcess, addProcessUpdate, deleteProcessUpdate }
