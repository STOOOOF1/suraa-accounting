const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ متغيرات Supabase البيئة غير موجودة. تأكد من وجود ملف .env');
}

// عميل عام - يستخدم للتحقق من صحة التوكنات وعمليات read
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// عميل م privileged - يستخدم للعمليات الإدارية (service_role)
// إذا كان المفتاح فارغاً، سيتم تعطيل العمليات الإدارية
let supabaseAdmin = null;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

module.exports = { supabase, supabaseAdmin };
