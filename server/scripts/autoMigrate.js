const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * تشغيل الترحيلات تلقائياً عند بدء تشغيل السيرفر
 */
async function runMigrations(supabaseUrl, supabaseAnonKey) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  // التحقق من وجود عمود attachment_url
  const { error } = await supabase
    .from('fund_transactions')
    .select('attachment_url')
    .limit(1);

  const columnExists = !error || !error.message?.toLowerCase().includes('attachment_url');
  if (!columnExists) {
    console.log('⚠️  عمود attachment_url غير موجود. جاري تشغيل الترحيل...');

    // محاولة الاتصال المباشر بقاعدة البيانات
    if (process.env.SUPABASE_DB_PASSWORD) {
      try {
        const { Client } = require('pg');
        const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];
        const client = new Client({
          host: `${projectRef}.supabase.co`,
          port: 5432,
          database: 'postgres',
          user: 'postgres',
          password: process.env.SUPABASE_DB_PASSWORD,
          ssl: { rejectUnauthorized: false, sslmode: 'require' },
          connectionTimeoutMillis: 8000,
        });
        await client.connect();
        const sqlPath = path.join(__dirname, '..', 'migrations', '004_attachment_column.sql');
        if (fs.existsSync(sqlPath)) {
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await client.query(sql);
          console.log('✅ تم تشغيل ترحيل attachment_column بنجاح');
        }
        await client.end();
        return;
      } catch (err) {
        console.log('⚠️  تعذر الاتصال بقاعدة البيانات مباشرة:', err.message);
      }
    }

    // محاولة عبر Management API
    const pat = process.env.SUPABASE_PAT;
    if (pat) {
      try {
        const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];
        const sqlPath = path.join(__dirname, '..', 'migrations', '004_attachment_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${pat}`,
            },
            body: JSON.stringify({ query: sql }),
          }
        );
        if (response.ok) {
          console.log('✅ تم تشغيل ترحيل attachment_column بنجاح عبر Management API');
          return;
        }
        console.log('⚠️  فشل تشغيل الترحيل عبر Management API');
      } catch (err) {
        console.log('⚠️  فشل الاتصال بـ Management API:', err.message);
      }
    }

    console.log('ℹ️  لتشغيل الترحيل يدوياً:');
    console.log('   1. افتح Supabase Dashboard > SQL Editor');
    console.log('   2. الصق محتوى الملف: server/migrations/004_attachment_column.sql');
    console.log('   3. شغّل الأمر');
    console.log('   أو أضف SUPABASE_DB_PASSWORD في server/.env وأعد تشغيل السيرفر');
  } else {
    console.log('✅ عمود attachment_url موجود مسبقاً');
  }
}

module.exports = { runMigrations };
