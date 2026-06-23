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
 * جلب جميع الخزائن
 */
const getAll = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { data, error } = await authed
      .from('funds')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) return res.status(400).json({ message: error.message });
    res.json({ funds: data });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الخزائن.' });
  }
};

/**
 * جلب خزينة واحدة مع آخر حركاتها
 */
const getById = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { id } = req.params;

    const { data: fund, error: fundError } = await authed
      .from('funds')
      .select('*')
      .eq('id', id)
      .single();

    if (fundError) return res.status(404).json({ message: 'الخزينة غير موجودة.' });

    const { data: transactions, error: txError } = await authed
      .from('fund_transactions')
      .select('*')
      .eq('fund_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) return res.status(400).json({ message: txError.message });

    res.json({ fund, transactions: transactions || [] });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات الخزينة.' });
  }
};

/**
 * إنشاء خزينة جديدة (للمدير فقط)
 */
const create = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'الاسم والنوع مطلوبان.' });
    }
    if (!['main', 'restricted'].includes(type)) {
      return res.status(400).json({ message: 'النوع يجب أن يكون main أو restricted.' });
    }

    const { data, error } = await authed
      .from('funds')
      .insert([{ name, type, description: description || '' }])
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json({ fund: data });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الخزينة.' });
  }
};

/**
 * تحديث خزينة (للمدير فقط)
 */
const update = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await authed
      .from('funds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.json({ fund: data });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث الخزينة.' });
  }
};

module.exports = { getAll, getById, create, update };
