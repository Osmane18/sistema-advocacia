require('dotenv').config()
require('express-async-errors')

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const authMiddleware = require('./middleware/auth')

const clientsRouter = require('./routes/clients')
const processesRouter = require('./routes/processes')
const agendaRouter = require('./routes/agenda')
const financialRouter = require('./routes/financial')
const documentsRouter = require('./routes/documents')

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares globais
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rotas protegidas com autenticacao
app.use('/api/clients', authMiddleware, clientsRouter)
app.use('/api/processes', authMiddleware, processesRouter)
app.use('/api/agenda', authMiddleware, agendaRouter)
app.use('/api/financial', authMiddleware, financialRouter)
app.use('/api/documents', authMiddleware, documentsRouter)

// Rota nao encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} nao encontrada` })
})

// Handler global de erros
app.use((err, req, res, next) => {
  console.error('[Erro]', err.message)

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado' })
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia invalida' })
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message
  })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

module.exports = app
