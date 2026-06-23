const { Router } = require('express');
const { login, logout, createUser, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = Router();

// POST /api/auth/login - تسجيل الدخول
router.post('/login', login);

// POST /api/auth/logout - تسجيل الخروج
router.post('/logout', authenticate, logout);

// GET /api/auth/profile - بيانات المستخدم الحالي
router.get('/profile', authenticate, getProfile);

// POST /api/auth/users - إنشاء مستخدم جديد (للمدير فقط)
router.post('/users', authenticate, requireRole('admin'), createUser);

module.exports = router;
