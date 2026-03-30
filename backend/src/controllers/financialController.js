const { supabase } = require('../config/supabase')

// Listar registros financeiros
async function getFinancialRecords(req, res) {
  const { type, status, client_id, limit = 100, offset = 0 } = req.query

  let query = supabase
    .from('financial_records')
    .select('*, clients(name), processes(number)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (client_id) query = query.eq('client_id', client_id)

  const { data, error, count } = await query
  if (error) throw error

  // Calcular totais
  const totals = {
    receita: 0, despesa: 0, pendente: 0
  }
  if (data) {
    data.forEach(r => {
      if (r.type !== 'despesa' && r.status === 'pago') totals.receita += r.amount || 0
      if (r.type === 'despesa' && r.status === 'pago') totals.despesa += r.amount || 0
      if (r.status === 'pendente' || r.status === 'atrasado') totals.pendente += r.amount || 0
    })
  }

  res.json({ data, count, totals })
}

// Criar registro
async function createFinancialRecord(req, res) {
  const { client_id, process_id, type, description, amount, due_date, paid_date, status } = req.body

  if (!description?.trim() || amount === undefined) {
    return res.status(400).json({ error: 'Descricao e valor sao obrigatorios' })
  }

  const { data, error } = await supabase
    .from('financial_records')
    .insert({
      client_id: client_id || null,
      process_id: process_id || null,
      type: type || 'honorario',
      description,
      amount: parseFloat(amount),
      due_date: due_date || null,
      paid_date: paid_date || null,
      status: status || 'pendente',
      created_by: req.user.sub
    })
    .select()
    .single()

  if (error) throw error
  res.status(201).json(data)
}

// Atualizar registro
async function updateFinancialRecord(req, res) {
  const { id } = req.params
  const { client_id, process_id, type, description, amount, due_date, paid_date, status } = req.body

  const { data, error } = await supabase
    .from('financial_records')
    .update({ client_id, process_id, type, description, amount: parseFloat(amount), due_date, paid_date, status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) return res.status(404).json({ error: 'Registro nao encontrado' })

  res.json(data)
}

// Excluir registro
async function deleteFinancialRecord(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('financial_records').delete().eq('id', id)
  if (error) throw error
  res.status(204).end()
}

module.exports = { getFinancialRecords, createFinancialRecord, updateFinancialRecord, deleteFinancialRecord }
