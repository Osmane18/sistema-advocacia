const { supabase } = require('../config/supabase')

const BUCKET = 'documentos'

// Listar documentos
async function getDocuments(req, res) {
  const { client_id, process_id } = req.query

  let query = supabase
    .from('documents')
    .select('*, clients(name), processes(number), user_profiles(full_name)')
    .order('created_at', { ascending: false })

  if (client_id) query = query.eq('client_id', client_id)
  if (process_id) query = query.eq('process_id', process_id)

  const { data, error } = await query
  if (error) throw error

  res.json(data)
}

// Upload de documento
async function uploadDocument(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })

  const { client_id, process_id } = req.body
  const file = req.file
  const filePath = `${req.user.sub}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600'
    })

  if (uploadError) throw uploadError

  // Salvar metadados
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: file.originalname,
      file_path: filePath,
      file_type: file.mimetype,
      file_size: file.size,
      client_id: client_id || null,
      process_id: process_id || null,
      uploaded_by: req.user.sub
    })
    .select()
    .single()

  if (dbError) throw dbError
  res.status(201).json(data)
}

// Gerar URL de download
async function downloadDocument(req, res) {
  const { id } = req.params

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('file_path, name')
    .eq('id', id)
    .single()

  if (docErr) throw docErr
  if (!doc) return res.status(404).json({ error: 'Documento nao encontrado' })

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path, 300) // 5 minutos

  if (error) throw error
  res.json({ url: data.signedUrl, name: doc.name })
}

// Excluir documento
async function deleteDocument(req, res) {
  const { id } = req.params

  const { data: doc } = await supabase.from('documents').select('file_path').eq('id', id).single()

  if (doc) {
    await supabase.storage.from(BUCKET).remove([doc.file_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error

  res.status(204).end()
}

module.exports = { getDocuments, uploadDocument, downloadDocument, deleteDocument }
