const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * تحديث كلمة مرور مستخدم (للمدير فقط)
 */
const updatePassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور الجديدة مطلوبان.' });
    }
    if (new_password.length < 4) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل.' });
    }

    // 1. محاولة استخدام supabaseAdmin (مفتاح service_role)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
      const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) return res.status(400).json({ message: listError.message });

      const user = users.users.find(u => u.email === email);
      if (!user) return res.status(404).json({ message: 'المستخدم غير موجود.' });

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        password: new_password,
      });
      if (updateError) return res.status(400).json({ message: updateError.message });

      return res.json({ message: 'تم تحديث كلمة المرور بنجاح.' });
    }

    // 2. محاولة استخدام الاتصال المباشر بقاعدة البيانات
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
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 8000,
        });
        await client.connect();

        const { rows } = await client.query(
          `SELECT id FROM auth.users WHERE email = $1`,
          [email]
        );
        if (rows.length === 0) {
          await client.end();
          return res.status(404).json({ message: 'المستخدم غير موجود.' });
        }

        await client.query(
          `UPDATE auth.users SET encrypted_password = crypt($1, gen_salt('bf')), updated_at = NOW() WHERE email = $2`,
          [new_password, email]
        );
        await client.end();
        return res.json({ message: 'تم تحديث كلمة المرور بنجاح عبر قاعدة البيانات.' });
      } catch (pgError) {
        console.log('Direct pg failed:', pgError.message);
      }
    }

    return res.status(400).json({
      message: 'تعذر تحديث كلمة المرور. أضف SUPABASE_SERVICE_ROLE_KEY في server/.env',
      hint: 'انسخ المفتاح من Supabase Dashboard > Settings > API > service_role key',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updatePassword };
