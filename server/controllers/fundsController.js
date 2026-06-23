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

/**
 * حذف خزينة (للمدير فقط - بشرط ألا يكون لها حركات)
 */
const remove = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { id } = req.params;

    const { data: txList, error: txError } = await authed
      .from('fund_transactions')
      .select('id')
      .eq('fund_id', id)
      .limit(1);

    if (txError) return res.status(400).json({ message: txError.message });

    if (txList && txList.length > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف الخزينة لوجود حركات مالية مرتبطة بها.' });
    }

    const { error } = await authed.from('funds').delete().eq('id', id);

    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'تم حذف الخزينة بنجاح.' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الخزينة.' });
  }
};

/**
 * ترحيل حركات خزينة إلى خزينة أخرى (للمدير فقط)
 */
const transfer = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));
    const { id } = req.params;
    const { target_fund_id } = req.body;

    if (!target_fund_id) {
      return res.status(400).json({ message: 'الخزينة الهدف مطلوبة.' });
    }
    if (id === target_fund_id) {
      return res.status(400).json({ message: 'لا يمكن الترحيل لنفس الخزينة.' });
    }

    const { data: targetFund } = await authed.from('funds').select('id').eq('id', target_fund_id).single();
    if (!targetFund) {
      return res.status(404).json({ message: 'الخزينة الهدف غير موجودة.' });
    }

    // جلب الحركات قبل الترحيل
    const { data: oldTx, error: txError } = await authed
      .from('fund_transactions')
      .select('id, amount, type')
      .eq('fund_id', id);

    if (txError) return res.status(400).json({ message: txError.message });

    if (!oldTx || oldTx.length === 0) {
      return res.status(400).json({ message: 'لا توجد حركات مالية للترحيل في هذه الخزينة.' });
    }

    // تحديث fund_id للحركات إلى الخزينة الهدف
    const { error: updateError } = await authed
      .from('fund_transactions')
      .update({ fund_id: target_fund_id })
      .eq('fund_id', id);

    // إذا فشل التحديث بسبب RLS، نحاول عبر الاتصال المباشر
    if (updateError) {
      if (process.env.SUPABASE_DB_PASSWORD) {
        try {
          const { Client } = require('pg');
          const projectRef = process.env.SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)[1];
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
          const ids = oldTx.map(t => `'${t.id}'`).join(',');
          await client.query(`UPDATE public.fund_transactions SET fund_id = '${target_fund_id}' WHERE id IN (${ids})`);
          await client.end();
        } catch (pgErr) {
          return res.status(400).json({
            message: 'تعذر تحديث الحركات. يرجى تشغيل ترحيل 005 في Supabase Dashboard > SQL Editor.',
            detail: 'server/migrations/005_transfer_policy.sql',
          });
        }
      } else {
        return res.status(400).json({
          message: 'تعذر تحديث الحركات. يرجى تشغيل ترحيل 005 في Supabase Dashboard > SQL Editor.',
          detail: 'server/migrations/005_transfer_policy.sql',
        });
      }
    }

    // حساب الرصيد الجديد للخزينة القديمة (صفر)
    const calcBalance = (txs) => (txs || []).reduce((s, t) => s + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0);

    // الرصيد القديم للخزينة المصدر
    const oldBalance = calcBalance(oldTx);

    // جلب الرصيد الحالي للخزينة الهدف وتحديثه
    const { data: targetFundData } = await authed.from('funds').select('balance').eq('id', target_fund_id).single();
    const newTargetBalance = Number(targetFundData?.balance || 0) + oldBalance;

    await authed.from('funds').update({ balance: 0 }).eq('id', id);
    await authed.from('funds').update({ balance: newTargetBalance }).eq('id', target_fund_id);

    res.json({ message: `تم ترحيل ${oldTx.length} حركة بنجاح إلى الخزينة الهدف.` });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء ترحيل الحركات.' });
  }
};

module.exports = { getAll, getById, create, update, remove, transfer };
