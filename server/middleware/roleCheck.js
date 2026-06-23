const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const getAuthClient = (token) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
};

/**
 * التحقق من أن دور المستخدم يطابق الأدوار المسموحة
 * @param  {...string} roles - قائمة الأدوار المسموحة (admin, data_entry)
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'غير مصرح.' });
      }

      const authed = getAuthClient(token);
      const { data: userData, error } = await authed
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !userData) {
        return res.status(403).json({ message: 'غير مصرح لك بالوصول.' });
      }

      if (!roles.includes(userData.role)) {
        return res.status(403).json({ message: 'صلاحيات غير كافية. هذه الميزة متاحة فقط للمدير.' });
      }

      req.userRole = userData.role;
      next();
    } catch (error) {
      console.error('خطأ في التحقق من الدور:', error.message);
      res.status(500).json({ message: 'خطأ في التحقق من الصلاحية.' });
    }
  };
};

module.exports = { requireRole };
