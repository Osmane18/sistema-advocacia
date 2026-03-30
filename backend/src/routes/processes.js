const router = require('express').Router()
const {
  getProcesses, getProcessById, createProcess, updateProcess, deleteProcess,
  addProcessUpdate, deleteProcessUpdate
} = require('../controllers/processesController')

router.get('/', getProcesses)
router.get('/:id', getProcessById)
router.post('/', createProcess)
router.put('/:id', updateProcess)
router.delete('/:id', deleteProcess)
router.post('/:id/updates', addProcessUpdate)
router.delete('/:id/updates/:updateId', deleteProcessUpdate)

module.exports = router
