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

    const [fundsRes, deposits, withdrawals, recentTx] = await Promise.all([
      authed.from('funds').select('*').order('type', { ascending: true }).order('name', { ascending: true }),
      authed.from('fund_transactions').select('fund_id, amount').eq('type', 'deposit'),
      authed.from('fund_transactions').select('fund_id, amount').eq('type', 'withdrawal'),
      authed
        .from('fund_transactions')
        .select('*, funds!inner(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (fundsRes.error) return res.status(400).json({ message: fundsRes.error.message });

    const funds = fundsRes.data || [];
    const depositsData = deposits.data || [];
    const withdrawalsData = withdrawals.data || [];

    const totalMain = funds.filter(f => f.type === 'main').reduce((s, f) => s + Number(f.balance), 0);
    const totalRestricted = funds.filter(f => f.type === 'restricted').reduce((s, f) => s + Number(f.balance), 0);
    const totalDeposits = depositsData.reduce((s, t) => s + Number(t.amount), 0);
    const totalWithdrawals = withdrawalsData.reduce((s, t) => s + Number(t.amount), 0);

    const transactions = (recentTx.data || []).map(t => ({
      ...t,
      fund_name: t.funds?.name || '',
    }));

    const fundDetails = funds.map(f => {
      const fundDeposits = depositsData.filter(t => t.fund_id === f.id).reduce((s, t) => s + Number(t.amount), 0);
      const fundWithdrawals = withdrawalsData.filter(t => t.fund_id === f.id).reduce((s, t) => s + Number(t.amount), 0);
      return {
        id: f.id,
        name: f.name,
        type: f.type,
        balance: Number(f.balance),
        total_deposits: fundDeposits,
        total_withdrawals: fundWithdrawals,
      };
    });

    res.json({
      main_balance: totalMain,
      restricted_balance: totalRestricted,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      recent_transactions: transactions,
      funds: fundDetails,
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات لوحة المعلومات.' });
  }
};

module.exports = { getSummary };
