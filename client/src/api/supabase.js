import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ متغيرات Supabase البيئة غير موجودة. أنشئ ملف .env في مجلد client');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
