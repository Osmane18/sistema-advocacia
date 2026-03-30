const router = require('express').Router()
const {
  getClients, getClientById, createClient, updateClient, deleteClient
} = require('../controllers/clientsController')

router.get('/', getClients)
router.get('/:id', getClientById)
router.post('/', createClient)
router.put('/:id', updateClient)
router.delete('/:id', deleteClient)

module.exports = router
