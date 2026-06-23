const { Router } = require('express');
const { runMigration, getStatus } = require('../controllers/migrationController');

const router = Router();

// GET /api/migrations/status - التحقق من حالة الترحيلات
router.get('/status', getStatus);

// POST /api/migrations/run/:name - تشغيل ملف ترحيل
router.post('/run/:name', runMigration);

module.exports = router;
