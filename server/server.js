// ============================================================
// الخادم الرئيسي - نظام سفراء المحاسبي
// جمعية سفراء التعليمية
// ============================================================

require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// الوسائط (Middleware)
// ============================================================

// السماح بالطلبات من الواجهة الأمامية
const allowedOrigins = ['http://localhost:5173', 'http://192.168.100.16:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));

// تحليل JSON
app.use(express.json({ limit: '10mb' }));

// ============================================================
// المسارات (Routes)
// ============================================================

// مسارات المصادقة
app.use('/api/auth', authRoutes);

// مسارات كلمة المرور
app.use('/api/auth', require('./routes/password'));

// مسارات الخزائن
app.use('/api/funds', require('./routes/funds'));

// مسارات المعاملات المالية
app.use('/api/transactions', require('./routes/transactions'));

// مسارات الترحيلات
app.use('/api/migrations', require('./routes/migrations'));

// مسارات الداش بورد
app.use('/api/dashboard', require('./routes/dashboard'));

// فحص صحة الخادم
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'نظام سفراء المحاسبي يعمل',
    timestamp: new Date().toISOString(),
  });
});

// معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({ message: 'المسار المطلوب غير موجود.' });
});

// ============================================================
// تشغيل الخادم
// ============================================================
app.listen(PORT, async () => {
  console.log(`🚀 نظام سفراء المحاسبي يعمل على المنفذ ${PORT}`);
  console.log(`📋 البيئة: ${process.env.NODE_ENV || 'development'}`);

  // تشغيل الترحيلات التلقائية
  try {
    const { runMigrations } = require('./scripts/autoMigrate');
    await runMigrations(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  } catch (err) {
    console.log('⚠️  فشل تشغيل الترحيلات التلقائية:', err.message);
  }
});
