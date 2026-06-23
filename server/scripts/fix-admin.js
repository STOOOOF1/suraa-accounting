const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Sofraa%40%401446@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres'
  });

  await client.connect();

  // 1. تأكيد بريد المشرف وتحديث اسمه
  await client.query(
    `UPDATE auth.users SET email_confirmed_at = NOW(), raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"مدير النظام"}'::jsonb WHERE email = 'admin@sufara.org'`
  );
  console.log('✅ admin - تم تأكيد البريد الإلكتروني');

  // 2. تحديث دور المشرف
  await client.query(
    `UPDATE public.users SET role = 'admin', full_name = 'مدير النظام' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@sufara.org')`
  );
  console.log('✅ admin - تم تحديث الدور إلى مدير النظام');

  // 3. التحقق
  const { rows: users } = await client.query(
    `SELECT u.email, p.role, u.email_confirmed_at IS NOT NULL as confirmed FROM auth.users u LEFT JOIN public.users p ON u.id = p.id ORDER BY u.email`
  );
  console.log('\n📋 المستخدمون بعد التحديث:');
  users.forEach(u => console.log(`  ${u.email} | ${u.role || '-'} | ${u.confirmed ? 'مؤكد' : 'غير مؤكد'}`));

  await client.end();
}

main().catch(e => console.error('❌', e.message));
