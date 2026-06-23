const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function runSqlViaPg(sqlPath) {
  if (!process.env.SUPABASE_DB_PASSWORD) return false;
  try {
    const { Client } = require('pg');
    const projectRef = process.env.SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)[1];
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
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    await client.end();
    return true;
  } catch { return false; }
}

async function runMigrationIfNeeded(supabaseUrl, supabaseAnonKey, migrationFile, checkFn) {
  // التحقق مما إذا كان الترحيل مطبقاً
  const applied = await checkFn();
  if (applied) { console.log(`✅ ${migrationFile} مطبق مسبقاً`); return; }

  console.log(`⚠️  ${migrationFile} غير مطبق. جاري التشغيل...`);
  const sqlPath = path.join(__dirname, '..', 'migrations', migrationFile);
  if (!fs.existsSync(sqlPath)) { console.log(`❌ الملف ${sqlPath} غير موجود`); return; }

  // محاولة الاتصال المباشر
  const ok = await runSqlViaPg(sqlPath);
  if (ok) { console.log(`✅ تم تطبيق ${migrationFile} بنجاح`); return; }

  console.log(`ℹ️  لتشغيل الترحيل يدوياً: افتح Supabase Dashboard > SQL Editor والصق محتوى:`);
  console.log(`   server/migrations/${migrationFile}`);
}

/**
 * تشغيل الترحيلات تلقائياً عند بدء تشغيل السيرفر
 */
async function runMigrations(supabaseUrl, supabaseAnonKey) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  // الترحيل 004: عمود attachment_url
  await runMigrationIfNeeded(supabaseUrl, supabaseAnonKey, '004_attachment_column.sql', async () => {
    const { error } = await supabase.from('fund_transactions').select('attachment_url').limit(1);
    return !error || !error.message?.toLowerCase().includes('attachment_url');
  });

  // الترحيل 005: سياسات UPDATE و DELETE
  await runMigrationIfNeeded(supabaseUrl, supabaseAnonKey, '005_transfer_policy.sql', async () => {
    const { error } = await supabase.from('fund_transactions').update({ description: '__migration_test__' }).eq('id', '00000000-0000-0000-0000-000000000000');
    if (error && error.message?.includes('violates row-level security')) return false;
    return true;
  });
}

module.exports = { runMigrations };
