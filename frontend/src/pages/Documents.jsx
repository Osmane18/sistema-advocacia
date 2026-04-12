import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'
import { useError } from '../context/ErrorContext'
import { format } from 'date-fns'

const BUCKET = 'documentos'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function getSignedUrl(filePath, expiresIn) {
  let token = SUPABASE_KEY
  try {
    const stored = localStorage.getItem('sistema-advocacia-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      token = parsed?.access_token || SUPABASE_KEY
    }
  } catch {}

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${filePath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ expiresIn }),
    signal: AbortSignal.timeout(10000)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro ao gerar link')
  return `${SUPABASE_URL}/storage/v1${json.signedURL}`
}

function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(type) {
  if (!type) return '📄'
  if (type.includes('pdf')) return '📕'
  if (type.includes('word') || type.includes('document')) return '📘'
  if (type.includes('image')) return '🖼️'
  if (type.includes('spreadsheet') || type.includes('excel')) return '📗'
  return '📄'
}

export default function Documents() {
  const { user } = useAuth()
  const showError = useError()
  const [documents, setDocuments] = useState([])
  const [clients, setClients] = useState([])
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterClient, setFilterClient] = useState('')
  const [filterProcess, setFilterProcess] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedProcess, setSelectedProcess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [{ data: docs }, { data: cls }, { data: procs }] = await Promise.all([
        supabase.from('documents').select('*, clients(name, phone), processes(number)')
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('processes').select('id, number').order('number')
      ])
      setDocuments(docs || [])
      setClients(cls || [])
      setProcesses(procs || [])
    } catch (err) {
      showError('Erro ao carregar documentos: ' + err.message, 'Erro ao Carregar')
    } finally {
      setLoading(false)
    }
  }

  async function uploadFiles(files) {
    if (!files.length) return
    setUploading(true)
    let successCount = 0

    for (const file of files) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = `${user.id}/${Date.now()}_${safeName}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, { contentType: file.type, cacheControl: '3600' })

        if (uploadError) throw uploadError

        const { error: dbError } = await supabase.from('documents').insert({
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          client_id: selectedClient || null,
          process_id: selectedProcess || null,
          uploaded_by: user.id
        })

        if (dbError) throw dbError
        successCount++
      } catch (err) {
        showError(`Erro ao enviar "${file.name}": ${err.message}`, 'Erro no Envio')
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s)!`)
      loadAll()
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload(e) {
    await uploadFiles(Array.from(e.target.files || []))
  }

  async function handleDownload(doc) {
    try {
      const signedUrl = await getSignedUrl(doc.file_path, 60)
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = doc.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      showError('Erro ao baixar arquivo: ' + err.message, 'Erro ao Baixar')
    }
  }

  async function handleWhatsApp(doc) {
    try {
      const signedUrl = await getSignedUrl(doc.file_path, 86400)
      const phone = doc.clients?.phone || ''
      const num = phone.replace(/\D/g, '')

      const msg = encodeURIComponent(
        `Olá${doc.clients?.name ? `, ${doc.clients.name}` : ''}! 👋\n\nSegue o documento: *${doc.name}*\n\n🔗 ${signedUrl}\n\n_(Link válido por 24 horas)_`
      )

      if (num && num.length >= 10) {
        window.open(`https://web.whatsapp.com/send?phone=55${num}&text=${msg}`, 'whatsapp_tab')
      } else {
        await navigator.clipboard.writeText(signedUrl)
        toast.success('Link copiado! Cole no WhatsApp do cliente.')
      }
    } catch (err) {
      showError('Erro ao gerar link: ' + err.message, 'Erro')
    }
  }

  async function handleDelete(doc) {
    setConfirmDelete(doc)
  }

  async function confirmDeleteDoc() {
    const doc = confirmDelete
    setConfirmDelete(null)
    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([doc.file_path])

      if (storageError) console.warn('Aviso ao remover storage:', storageError.message)

      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id)
      if (dbError) throw dbError

      toast.success('Arquivo excluído!')
      loadAll()
    } catch (err) {
      showError('Erro ao excluir arquivo: ' + err.message, 'Erro ao Excluir')
    }
  }

  function formatDate(d) {
    if (!d) return '-'
    try { return format(new Date(d), 'dd/MM/yyyy') } catch { return d }
  }

  const filtered = documents.filter(d => {
    const matchClient = !filterClient || d.client_id === filterClient
    const matchProcess = !filterProcess || d.process_id === filterProcess
    return matchClient && matchProcess
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Documentos</h2>
          <p className="page-subtitle">{documents.length} arquivo(s)</p>
        </div>
      </div>

      {/* Upload area */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Enviar Documentos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cliente (opcional)</label>
            <select className="form-select" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option value="">Selecionar cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Processo (opcional)</label>
            <select className="form-select" value={selectedProcess} onChange={e => setSelectedProcess(e.target.value)}>
              <option value="">Selecionar processo</option>
              {processes.map(p => <option key={p.id} value={p.id}>{p.number}</option>)}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Enviando...
              </>
            ) : (
              <>📎 Selecionar Arquivos</>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />

        {/* Drop zone visual */}
        <div
          style={{
            marginTop: 16,
            border: '2px dashed #e5e7eb',
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            color: '#9ca3af',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.background = '#fffbeb' }}
          onDragLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'transparent' }}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.background = 'transparent'
            const files = Array.from(e.dataTransfer.files)
            if (files.length) uploadFiles(files)
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Clique ou arraste arquivos aqui</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>PDF, Word, Excel, imagens — max. 50MB por arquivo</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <select className="filter-select" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="filter-select" value={filterProcess} onChange={e => setFilterProcess(e.target.value)}>
          <option value="">Todos os processos</option>
          {processes.map(p => <option key={p.id} value={p.id}>{p.number}</option>)}
        </select>
        {(filterClient || filterProcess) && (
          <button className="btn-secondary" onClick={() => { setFilterClient(''); setFilterProcess('') }} style={{ fontSize: 13, padding: '8px 12px' }}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Confirmação excluir documento */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir documento"
        message={`Tem certeza que deseja excluir o arquivo "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDeleteDoc}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Tabela de documentos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Tamanho</th>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Enviado por</th>
                <th>Data</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📄</div>
                      <div className="empty-state-text">Nenhum documento encontrado</div>
                      <div className="empty-state-sub">Use o formulario acima para enviar arquivos</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{getFileIcon(doc.file_type)}</span>
                        <span style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {doc.file_type?.split('/')[1]?.toUpperCase() || '-'}
                      </span>
                    </td>
                    <td>{formatFileSize(doc.file_size)}</td>
                    <td>{doc.processes?.number || '-'}</td>
                    <td>{doc.clients?.name || '-'}</td>
                    <td>{doc.user_profiles?.full_name || '-'}</td>
                    <td>{formatDate(doc.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleWhatsApp(doc)}
                          title={doc.clients?.phone ? `Enviar para ${doc.clients.name} no WhatsApp` : 'Copiar link para WhatsApp'}
                          style={{ color: '#22c55e' }}
                        >
                          💬
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDownload(doc)}
                          title="Baixar"
                          style={{ color: '#1B2B4B' }}
                        >
                          ⬇️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(doc)}
                          title="Excluir"
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
    </div>
  )
}
