const { createClient } = require('@supabase/supabase-js');
const { supabase, supabaseAdmin } = require('../config/supabase');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// إنشاء عميل Supabase بسياق مستخدم محدد (لتجاوز RLS بشكل صحيح)
const getAuthClient = (token) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
};

/**
 * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
      }
      return res.status(401).json({ message: 'فشل تسجيل الدخول. تأكد من صحة البيانات.' });
    }

    // جلب معلومات المستخدم الإضافية من جدول users
    const authedClient = getAuthClient(data.session.access_token);
    const { data: userData } = await authedClient
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: userData?.full_name,
        role: userData?.role,
        phone: userData?.phone,
        is_active: userData?.is_active,
      },
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error.message);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.' });
  }
};

/**
 * تسجيل الخروج
 */
const logout = async (req, res) => {
  try {
    res.json({ message: 'تم تسجيل الخروج بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الخروج.' });
  }
};

/**
 * إنشاء مستخدم جديد (للمدير فقط)
 */
const createUser = async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'مفتاح service_role غير مضبط. هذه الميزة غير متاحة حالياً.' });
    }

    const { email, password, full_name, role, phone } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ message: 'البريد الإلكتروني، كلمة المرور، الاسم، والدور مطلوبون.' });
    }

    if (!['admin', 'data_entry'].includes(role)) {
      return res.status(400).json({ message: 'الدور يجب أن يكون admin أو data_entry.' });
    }

    // إنشاء المستخدم في Supabase Auth مع تأكيد البريد الإلكتروني تلقائياً
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ message: 'البريد الإلكتروني مسجل مسبقاً.' });
      }
      return res.status(400).json({ message: authError.message });
    }

    // تحديث الدور والهاتف في جدول users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role, phone: phone || null })
      .eq('id', authData.user.id);

    if (updateError) {
      return res.status(400).json({ message: 'تم إنشاء الحساب ولكن فشل تحديث الصلاحيات.' });
    }

    res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
      },
    });
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error.message);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المستخدم.' });
  }
};

/**
 * جلب بيانات المستخدم الحالي
 */
const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authedClient = getAuthClient(token);
    const { data: userData, error } = await authedClient
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        ...userData,
      },
    });
  } catch (error) {
    console.error('خطأ في جلب البيانات:', error.message);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات.' });
  }
};

module.exports = { login, logout, createUser, getProfile };
