const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * تحديث كلمة مرور المستخدم الحالي (باستخدام التوكن الخاص به)
 */
const updateMyPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 4) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة مطلوبة (4 أحرف على الأقل).' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'غير مصرح.' });

    // استدعاء Supabase Auth API مباشرة
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ password: new_password }),
    });

    if (!response.ok) {
      const errData = await response.json();
      const msg = errData.msg || errData.message || 'فشل تحديث كلمة المرور';
      return res.status(400).json({
        message: msg.includes('password') ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : msg,
      });
    }

    res.json({ message: 'تم تحديث كلمة المرور بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * تحديث كلمة مرور أي مستخدم (باستخدام مفتاح service_role)
 */
const updateAnyPassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password || new_password.length < 4) {
      return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان (4 أحرف على الأقل).' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return res.status(400).json({
        message: 'مفتاح service_role غير موجود. أضف SUPABASE_SERVICE_ROLE_KEY في server/.env',
        hint: 'انسخه من Supabase Dashboard > Settings > API',
      });
    }

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

    res.json({ message: `تم تحديث كلمة مرور ${email} بنجاح.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateMyPassword, updateAnyPassword };
