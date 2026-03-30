const router = require('express').Router()
const {
  getFinancialRecords, createFinancialRecord, updateFinancialRecord, deleteFinancialRecord
} = require('../controllers/financialController')

router.get('/', getFinancialRecords)
router.post('/', createFinancialRecord)
router.put('/:id', updateFinancialRecord)
router.delete('/:id', deleteFinancialRecord)

module.exports = router
