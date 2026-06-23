const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function main() {
  // إنشاء المستخدم الثالث فقط
  const supabase = createClient(
    'https://ntdzgmzgslyocwjnnjvg.supabase.co',
    'sb_publishable_lGbw0KgndSdZf1ts5Ha_YA_TXO0_Vzw'
  );

  const pgClient = new Client({
    connectionString: 'postgresql://postgres:Sofraa%40%401446@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres'
  });
  await pgClient.connect();

  process.stdout.write('👤 data2@sufara.org... ');

  const { data, error } = await supabase.auth.signUp({
    email: 'data2@sufara.org',
    password: 'Data@123',
    options: { data: { full_name: 'مدخل بيانات ثاني' } },
  });

  if (error) {
    console.log('❌', error.message);
    await pgClient.end();
    return;
  }

  // تأكيد البريد
  await pgClient.query(
    `UPDATE auth.users SET email_confirmed_at = NOW(), raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"مدخل بيانات ثاني"}'::jsonb WHERE id = $1`,
    [data.user.id]
  );

  // الدور افتراضي data_entry من التريقر

  console.log('✅ data_entry');
  console.log('\n✅ جميع المستخدمين جاهزون.');

  await pgClient.end();
}

main().catch(e => console.error('❌', e.message));
