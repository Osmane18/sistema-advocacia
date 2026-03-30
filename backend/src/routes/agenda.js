const router = require('express').Router()
const { getEvents, createEvent, updateEvent, deleteEvent, toggleEvent } = require('../controllers/agendaController')

router.get('/', getEvents)
router.post('/', createEvent)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)
router.patch('/:id/toggle', toggleEvent)

module.exports = router
