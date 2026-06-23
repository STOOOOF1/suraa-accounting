const { Router } = require('express');
const { updateMyPassword, updateAnyPassword } = require('../controllers/passwordController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

router.use(authenticate);

// POST /api/auth/change-password - تغيير كلمة مرور المستخدم الحالي
router.post('/change-password', updateMyPassword);

// POST /api/auth/admin/change-password - تغيير كلمة مرور أي مستخدم (للمدير فقط)
router.post('/admin/change-password', requireRole('admin'), updateAnyPassword);

module.exports = router;
