const { supabase } = require('../config/supabase')

// Listar todos os clientes
async function getClients(req, res) {
  const { search, limit = 100, offset = 0 } = req.query

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (search) {
    query = query.or(`name.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  res.json({ data, count, limit: Number(limit), offset: Number(offset) })
}

// Buscar cliente por ID
async function getClientById(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) return res.status(404).json({ error: 'Cliente nao encontrado' })

  res.json(data)
}

// Criar cliente
async function createClient(req, res) {
  const { name, cpf_cnpj, phone, email, address, notes } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nome obrigatorio' })
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({ name, cpf_cnpj, phone, email, address, notes, created_by: req.user.sub })
    .select()
    .single()

  if (error) throw error
  res.status(201).json(data)
}

// Atualizar cliente
async function updateClient(req, res) {
  const { id } = req.params
  const { name, cpf_cnpj, phone, email, address, notes } = req.body

  const { data, error } = await supabase
    .from('clients')
    .update({ name, cpf_cnpj, phone, email, address, notes })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) return res.status(404).json({ error: 'Cliente nao encontrado' })

  res.json(data)
}

// Excluir cliente
async function deleteClient(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  res.status(204).end()
}

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient }
