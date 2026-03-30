const jwt = require('jsonwebtoken')
require('dotenv').config()

/**
 * Middleware de autenticacao.
 * Verifica o JWT do Supabase no header Authorization.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticacao nao fornecido' })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faca login novamente.' })
    }
    return res.status(401).json({ error: 'Token invalido' })
  }
}

module.exports = authMiddleware
