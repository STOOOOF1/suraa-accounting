import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fundsApi } from '../api/funds';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';
import FundForm from '../components/funds/FundForm';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Wallet,
  ArrowDownFromLine,
  ArrowUpFromLine,
  Edit3,
  RefreshCw,
} from 'lucide-react';

export default function FundDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [fund, setFund] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { fund: f, transactions: t } = await fundsApi.getById(id);
      setFund(f);
      setTransactions(t);
    } catch {
      toast.error('الخزينة غير موجودة');
      navigate('/funds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loader message="جاري تحميل بيانات الخزينة..." />;
  if (!fund) return null;

  const isMain = fund.type === 'main';
  const totalDeposits = transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawals = transactions.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="p-4 lg:p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/funds')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{fund.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isMain ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {isMain ? 'رئيسية' : 'مقيد'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              fund.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {fund.is_active ? 'نشط' : 'متوقف'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{fund.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button onClick={() => setShowEdit(true)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* بطاقة الرصيد */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-sm text-gray-500 mb-1">الرصيد الحالي</p>
        <p className={`text-3xl font-bold ${fund.balance > 0 ? 'text-green-600' : fund.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {formatCurrency(fund.balance)}
        </p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="text-gray-400">إجمالي القبض: </span>
            <span className="text-green-600 font-medium">{formatCurrency(totalDeposits)}</span>
          </div>
          <div>
            <span className="text-gray-400">إجمالي الصرف: </span>
            <span className="text-red-600 font-medium">{formatCurrency(totalWithdrawals)}</span>
          </div>
        </div>
      </div>

      {/* الحركات المالية */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 lg:p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">الحركات المالية</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد حركات مالية بعد</p>
            <p className="text-sm text-gray-300 mt-1">سيتم عرض سندات القبض والصرف هنا</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 lg:p-6 flex items-start gap-4 hover:bg-gray-50">
                <div className={`p-2 rounded-lg shrink-0 ${
                  tx.type === 'deposit' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {tx.type === 'deposit'
                    ? <ArrowDownFromLine className="w-5 h-5 text-green-600" />
                    : <ArrowUpFromLine className="w-5 h-5 text-red-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{tx.description || 'حركة مالية'}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                    <span>{formatDate(tx.created_at)}</span>
                    {tx.reference_no && <span>رقم: {tx.reference_no}</span>}
                  </div>
                </div>
                <p className={`text-sm font-bold shrink-0 ${
                  tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نافذة التعديل */}
      {showEdit && (
        <FundForm
          fund={fund}
          onClose={() => setShowEdit(false)}
          onCreated={() => { setShowEdit(false); load(); }}
        />
      )}
    </div>
  );
}
