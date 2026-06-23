import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fundsApi } from '../api/funds';
import { formatCurrency } from '../utils/format';
import Loader from '../components/common/Loader';
import FundForm from '../components/funds/FundForm';
import toast from 'react-hot-toast';
import {
  Wallet,
  Building2,
  Plus,
  Eye,
  Banknote,
  PiggyBank,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export default function Funds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [selectedTargetFund, setSelectedTargetFund] = useState('');
  const [transferring, setTransferring] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const loadFunds = async () => {
    try {
      setLoading(true);
      const { funds: data } = await fundsApi.getAll();
      setFunds(data);
    } catch {
      toast.error('حدث خطأ أثناء جلب الخزائن');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFunds(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fundsApi.remove(deleteTarget.id);
      toast.success('تم حذف الخزينة بنجاح');
      setDeleteTarget(null);
      loadFunds();
    } catch (err) {
      let msg = 'حدث خطأ أثناء الحذف';
      try { const e = JSON.parse(err.message); msg = e.message; } catch {}
      toast.error(msg);
      setDeleteTarget(null);
    }
  };

  const handleDeleteClick = async (fund) => {
    try {
      const { transactions } = await fundsApi.getById(fund.id);
      if (transactions.length > 0) {
        setTransferTarget(fund);
        setSelectedTargetFund('');
      } else {
        setDeleteTarget(fund);
      }
    } catch {
      toast.error('حدث خطأ أثناء التحقق من الخزينة');
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget || !selectedTargetFund) {
      return toast.error('يرجى اختيار الخزينة الهدف');
    }
    setTransferring(true);
    try {
      await fundsApi.transfer(transferTarget.id, selectedTargetFund);
      await fundsApi.remove(transferTarget.id);
      toast.success('تم ترحيل الحركات وحذف الخزينة بنجاح');
      setTransferTarget(null);
      setSelectedTargetFund('');
      loadFunds();
    } catch (err) {
      let msg = 'حدث خطأ أثناء الترحيل';
      try { const e = JSON.parse(err.message); msg = e.message; } catch {}
      toast.error(msg);
    } finally {
      setTransferring(false);
    }
  };

  const mainFunds = funds.filter((f) => f.type === 'main');
  const restrictedFunds = funds.filter((f) => f.type === 'restricted');

  if (loading) return <Loader message="جاري تحميل الخزائن..." />;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Wallet className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">الخزائن</h1>
            <p className="text-sm text-gray-500">إدارة الصناديق والخزائن المالية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadFunds} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition-colors">
              <Plus className="w-4 h-4" />
              إضافة خزينة
            </button>
          )}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-teal-600" />
          الخزينة الرئيسية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainFunds.map((fund) => (
            <FundCard key={fund.id} fund={fund} onClick={() => navigate(`/funds/${fund.id}`)} isAdmin={isAdmin} onDelete={handleDeleteClick} showDelete={false} />
          ))}
          {mainFunds.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-8">لا توجد خزينة رئيسية</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-blue-600" />
          البرامج والأنشطة المقيدة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restrictedFunds.map((fund) => (
            <FundCard key={fund.id} fund={fund} onClick={() => navigate(`/funds/${fund.id}`)} isAdmin={isAdmin} onDelete={handleDeleteClick} showDelete={true} />
          ))}
          {restrictedFunds.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-8">لا توجد برامج مقيدة بعد</p>
          )}
        </div>
      </section>

      {/* تأكيد حذف خزينة بدون حركات */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500 mb-6">
              هل أنت متأكد من حذف خزينة <span className="font-medium text-gray-700">{deleteTarget.name}</span>؟
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">إلغاء</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة ترحيل الحركات ثم حذف الخزينة */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { if (!transferring) setTransferTarget(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ترحيل الحركات قبل الحذف</h3>
            <p className="text-sm text-gray-500 mb-4">
              خزينة <span className="font-medium text-gray-700">{transferTarget.name}</span> تحتوي على حركات مالية. يرجى اختيار الخزينة الهدف لترحيل الحركات إليها:
            </p>
            <select
              value={selectedTargetFund}
              onChange={(e) => setSelectedTargetFund(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none mb-6"
            >
              <option value="">اختر الخزينة الهدف...</option>
              {funds.filter((f) => f.id !== transferTarget.id).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setTransferTarget(null)} disabled={transferring} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50">إلغاء</button>
              <button onClick={handleTransfer} disabled={transferring || !selectedTargetFund} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {transferring ? 'جاري الترحيل...' : 'ترحيل وحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <FundForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadFunds(); }}
        />
      )}
    </div>
  );
}

function FundCard({ fund, onClick, isAdmin, onDelete, showDelete }) {
  const Icon = fund.type === 'main' ? Banknote : Building2;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-teal-200 transition-all group">
      <div onClick={onClick} className="cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${fund.type === 'main' ? 'bg-teal-50' : 'bg-blue-50'}`}>
            <Icon className={`w-6 h-6 ${fund.type === 'main' ? 'text-teal-600' : 'text-blue-600'}`} />
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            fund.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {fund.is_active ? 'نشط' : 'متوقف'}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1">{fund.name}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{fund.description || 'لا يوجد وصف'}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">الرصيد</p>
            <p className={`font-bold text-lg ${fund.balance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {formatCurrency(fund.balance)}
            </p>
          </div>
          <Eye className="w-5 h-5 text-gray-300 group-hover:text-teal-500 transition-colors" />
        </div>
      </div>
      {isAdmin && showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(fund); }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="حذف الخزينة"
        >
          <Trash2 className="w-3.5 h-3.5" />
          حذف
        </button>
      )}
    </div>
  );
}
