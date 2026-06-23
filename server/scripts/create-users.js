/**
 * سكريبت إنشاء المستخدمين الابتدائيين - نظام سفراء المحاسبي
 * التشغيل: node scripts/create-users.js "كلمة_المرور"
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const SUPABASE_URL = 'https://ntdzgmzgslyocwjnnjvg.supabase.co';
const ANON_KEY = 'sb_publishable_lGbw0KgndSdZf1ts5Ha_YA_TXO0_Vzw';

async function run() {
  const dbPassword = process.argv[2];
  if (!dbPassword) {
    console.error('❌ يرجى تمرير كلمة مرور قاعدة البيانات.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres`;
  const pgClient = new Client({ connectionString });
  await pgClient.connect();

  const users = [
    { email: 'admin@sufara.org', password: 'Admin@123', full_name: 'مدير النظام', role: 'admin' },
    { email: 'data1@sufara.org', password: 'Data@123', full_name: 'مدخل بيانات أول', role: 'data_entry' },
    { email: 'data2@sufara.org', password: 'Data@123', full_name: 'مدخل بيانات ثاني', role: 'data_entry' },
  ];

  for (const u of users) {
    process.stdout.write(`👤 ${u.email}... `);

    // محاولة تسجيل الدخول أولاً (للتأكد من عدم وجود المستخدم مسبقاً)
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    }).catch(() => ({ data: null }));

    if (existingUser?.user) {
      // المستخدم موجود مسبقاً
      await pgClient.query(
        `UPDATE public.users SET role = $1, full_name = $2 WHERE id = $3`,
        [u.role, u.full_name, existingUser.user.id]
      );
      console.log(`✅ موجود مسبقاً (تم تحديث دوره)`);
      continue;
    }

    // إنشاء مستخدم جديد
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { full_name: u.full_name } },
    });

    if (error) {
      console.log(`❌ ${error.message}`);
      continue;
    }

    // تأكيد البريد الإلكتروني
    await pgClient.query(
      `UPDATE auth.users SET email_confirmed_at = NOW(), raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
      [JSON.stringify({ full_name: u.full_name }), data.user.id]
    );

    // تحديث الدور
    await pgClient.query(
      `UPDATE public.users SET role = $1, full_name = $2 WHERE id = $3`,
      [u.role, u.full_name, data.user.id]
    );

    console.log(`✅ ${u.role}`);
  }

  await pgClient.end();

  console.log('\n✅ تم إنشاء جميع المستخدمين.');
  console.log('\n📋 بيانات الدخول:');
  console.log('   admin@sufara.org  |  Admin@123  (مدير النظام)');
  console.log('   data1@sufara.org  |  Data@123   (مدخل بيانات)');
  console.log('   data2@sufara.org  |  Data@123   (مدخل بيانات)');
}

run();
