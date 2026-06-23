/**
 * سكريبت تهيئة قاعدة البيانات - نظام سفراء المحاسبي
 * يجري اتصالاً مباشراً بـ PostgreSQL ويشغّل الهجرة
 * 
 * التشغيل: node scripts/migrate.js "كلمة_المرور"
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const dbPassword = process.argv[2];
  if (!dbPassword) {
    console.error('❌ يرجى تمرير كلمة مرور قاعدة البيانات كمعامل.');
    console.error('   مثال: node scripts/migrate.js "Sofraa@@1446"');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres`;

  const client = new Client({ connectionString });

  try {
    console.log('🔌 جاري الاتصال بقاعدة البيانات...');
    await client.connect();
    console.log('✅ تم الاتصال.\n');

    const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📦 جاري تشغيل الهجرة...');
    await client.query(sql);
    console.log('✅ تم تشغيل الهجرة بنجاح.\n');

    const { rows: tables } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log('📋 الجداول:');
    tables.forEach((t) => console.log(`   - ${t.table_name}`));

    const { rows: funds } = await client.query(`SELECT id, name, type, balance FROM public.funds`);
    console.log('\n💰 الخزائن:');
    funds.forEach((f) => console.log(`   - ${f.name} (${f.type})`));

    console.log('\n✅ اكتملت تهيئة قاعدة البيانات بنجاح.');
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
