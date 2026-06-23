const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/fundsController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

// جميع مسارات الخزائن تتطلب تسجيل الدخول
router.use(authenticate);

// GET /api/funds - قائمة الخزائن
router.get('/', getAll);

// GET /api/funds/:id - تفاصيل خزينة
router.get('/:id', getById);

// POST /api/funds - إنشاء خزينة (للمدير فقط)
router.post('/', requireRole('admin'), create);

// PUT /api/funds/:id - تحديث خزينة (للمدير فقط)
router.put('/:id', requireRole('admin'), update);

// DELETE /api/funds/:id - حذف خزينة (للمدير فقط)
router.delete('/:id', requireRole('admin'), remove);

module.exports = router;
