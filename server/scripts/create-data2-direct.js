const { Client } = require('pg');

async function main() {
  const pgClient = new Client({
    connectionString: 'postgresql://postgres:Sofraa%40%401446@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres'
  });
  await pgClient.connect();

  const email = 'data2@sufara.org';
  const password = 'Data@123';
  const fullName = 'مدخل بيانات ثاني';

  // التحقق من عدم وجود المستخدم
  const { rows: existing } = await pgClient.query(
    `SELECT id FROM auth.users WHERE email = $1`, [email]
  );
  if (existing.length > 0) {
    console.log('ℹ️  المستخدم موجود مسبقاً.');
    await pgClient.end();
    return;
  }

  // تشفير كلمة المرور باستخدام pgcrypto
  const { rows: hashed } = await pgClient.query(
    `SELECT crypt($1, gen_salt('bf', 10)) as hash`, [password]
  );
  const hashedPassword = hashed[0].hash;

  // إدراج المستخدم مباشرة في auth.users
  const { rows: newUser } = await pgClient.query(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      $1,
      $2,
      NOW(),
      $3::jsonb,
      NOW(), NOW(),
      '', '', '', ''
    ) RETURNING id
  `, [email, hashedPassword, JSON.stringify({ full_name: fullName })]);

  const userId = newUser[0].id;

  // إدراج الهوية في auth.identities
  const userIdText = userId.toString();
  await pgClient.query(`
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider,
      provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      $1::uuid,
      json_build_object('sub', $2, 'email', $3, 'full_name', $4)::jsonb,
      'email',
      $3,
      NOW(), NOW(), NOW()
    )
  `, [userId, userIdText, email, fullName]);

  console.log(`✅ ${email} - تم إنشاء المستخدم بدور data_entry (افتراضي من التريغر)`);

  await pgClient.end();
}

main().catch(e => console.error('❌', e.message));
