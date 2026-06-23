const { Router } = require('express');
const { getAll, create } = require('../controllers/transactionsController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

// GET /api/transactions - قائمة المعاملات (مع فلترة)
router.get('/', getAll);

// POST /api/transactions - إنشاء سند قبض/صرف
router.post('/', create);

module.exports = router;
