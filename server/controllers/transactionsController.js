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
 * جلب المعاملات المالية (مع فلترة اختيارية)
 */
const getAll = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { fund_id, type, page = 1, limit = 50 } = req.query;

    let query = authed
      .from('fund_transactions')
      .select('*', { count: 'exact' });

    if (fund_id) query = query.eq('fund_id', fund_id);
    if (type) query = query.eq('type', type);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return res.status(400).json({ message: error.message });
    res.json({ transactions: data, total: count, page: Number(page) });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المعاملات.' });
  }
};

/**
 * إنشاء سند قبض أو صرف
 */
const create = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { fund_id, type, amount, description, reference_no, attachment_url } = req.body;

    if (!fund_id || !type || !amount) {
      return res.status(400).json({ message: 'الخزينة والنوع والمبلغ مطلوبة.' });
    }
    if (!['deposit', 'withdrawal'].includes(type)) {
      return res.status(400).json({ message: 'النوع يجب أن يكون deposit أو withdrawal.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'المبلغ يجب أن يكون أكبر من صفر.' });
    }

    // التحقق من وجود الخزينة (للقراءة فقط)
    const { data: fund, error: fundError } = await authed
      .from('funds')
      .select('id, name, is_active')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund) {
      return res.status(404).json({ message: 'الخزينة غير موجودة.' });
    }
    if (!fund.is_active) {
      return res.status(400).json({ message: 'لا يمكن إضافة حركة لخزينة متوقفة.' });
    }

    // الحصول على التوكن للمستخدم الحالي
    const token = req.headers.authorization.replace('Bearer ', '');
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) return res.status(401).json({ message: 'غير مصرح.' });

    // إنشاء رقم مرجعي
    const ref = reference_no || `${type === 'deposit' ? 'REC' : 'PAY'}-${Date.now().toString(36).toUpperCase()}`;

    const insertData = {
      fund_id,
      type,
      amount,
      description: description || '',
      reference_no: ref,
      created_by: user.id,
    };
    if (attachment_url) insertData.attachment_url = attachment_url;

    const { data, error } = await authed
      .from('fund_transactions')
      .insert([insertData])
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    // جلب الرصيد المحدث
    const { data: updatedFund } = await authed
      .from('funds')
      .select('balance')
      .eq('id', fund_id)
      .single();

    res.status(201).json({
      transaction: data,
      new_balance: updatedFund?.balance || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء السند.' });
  }
};

module.exports = { getAll, create };
