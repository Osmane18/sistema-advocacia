const router = require('express').Router()
const multer = require('multer')
const { getDocuments, uploadDocument, downloadDocument, deleteDocument } = require('../controllers/documentsController')

// Multer em memoria (max 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain'
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo nao permitido'))
    }
  }
})

router.get('/', getDocuments)
router.post('/upload', upload.single('file'), uploadDocument)
router.get('/:id/download', downloadDocument)
router.delete('/:id', deleteDocument)

module.exports = router
