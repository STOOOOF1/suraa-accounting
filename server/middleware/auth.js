const { supabase } = require('../config/supabase');

/**
 * التحقق من صحة توكن الدخول (JWT)
 * يستخرج التوكن من رأس Authorization ويتحقق من صحته عبر Supabase Auth
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'غير مصرح. التوكن مطلوب.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ message: 'التوكن غير صالح أو منتهي الصلاحية.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحية:', error.message);
    res.status(500).json({ message: 'خطأ في التحقق من الصلاحية.' });
  }
};

module.exports = { authenticate };
