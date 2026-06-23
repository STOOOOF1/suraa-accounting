const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const getAuthClient = (token) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
};

const getSummary = async (req, res) => {
  try {
    const authed = getAuthClient(req.headers.authorization.replace('Bearer ', ''));

    const [mainFunds, restrictedFunds, deposits, withdrawals, recentTx] = await Promise.all([
      authed.from('funds').select('balance').eq('type', 'main'),
      authed.from('funds').select('balance').eq('type', 'restricted'),
      authed.from('fund_transactions').select('amount').eq('type', 'deposit'),
      authed.from('fund_transactions').select('amount').eq('type', 'withdrawal'),
      authed
        .from('fund_transactions')
        .select('*, funds!inner(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const totalMain = (mainFunds.data || []).reduce((s, f) => s + Number(f.balance), 0);
    const totalRestricted = (restrictedFunds.data || []).reduce((s, f) => s + Number(f.balance), 0);
    const totalDeposits = (deposits.data || []).reduce((s, t) => s + Number(t.amount), 0);
    const totalWithdrawals = (withdrawals.data || []).reduce((s, t) => s + Number(t.amount), 0);

    const transactions = (recentTx.data || []).map(t => ({
      ...t,
      fund_name: t.funds?.name || '',
    }));

    if (mainFunds.error) return res.status(400).json({ message: mainFunds.error.message });

    res.json({
      main_balance: totalMain,
      restricted_balance: totalRestricted,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      recent_transactions: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات الداش بورد.' });
  }
};

module.exports = { getSummary };
