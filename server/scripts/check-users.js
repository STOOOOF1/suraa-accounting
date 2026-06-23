const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Sofraa%40%401446@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();

  const { rows: authUsers } = await client.query(
    `SELECT id, email, raw_user_meta_data->>'full_name' as name,
            email_confirmed_at IS NOT NULL as confirmed
     FROM auth.users ORDER BY email`
  );
  console.log('=== مستخدمي Auth ===');
  authUsers.forEach(u => console.log(`  ${u.email} | ${u.name || '-'} | ${u.confirmed ? 'مؤكد' : 'غير مؤكد'}`));

  const { rows: profiles } = await client.query(
    `SELECT u.email, p.role, p.full_name, p.is_active
     FROM auth.users u
     LEFT JOIN public.users p ON u.id = p.id
     ORDER BY u.email`
  );
  console.log('\n=== المستخدمين مع الأدوار ===');
  profiles.forEach(u => console.log(`  ${u.email} | دور: ${u.role || 'بدون'} | نشط: ${u.is_active !== false ? 'نعم' : 'لا'}`));

  await client.end();
}

main().catch(e => console.error(e.message));
