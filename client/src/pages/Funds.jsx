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

  const mainFunds = funds.filter((f) => f.type === 'main');
  const restrictedFunds = funds.filter((f) => f.type === 'restricted');

  if (loading) return <Loader message="جاري تحميل الخزائن..." />;

  return (
    <div className="p-4 lg:p-6">
      {/* رأس الصفحة */}
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
          <button
            onClick={loadFunds}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة خزينة
            </button>
          )}
        </div>
      </div>

      {/* الخزينة الرئيسية */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-teal-600" />
          الخزينة الرئيسية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainFunds.map((fund) => (
            <FundCard key={fund.id} fund={fund} onClick={() => navigate(`/funds/${fund.id}`)} isAdmin={isAdmin} onDelete={setDeleteTarget} />
          ))}
          {mainFunds.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-8">لا توجد خزينة رئيسية</p>
          )}
        </div>
      </section>

      {/* البرامج المقيدة */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-blue-600" />
          البرامج والأنشطة المقيدة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restrictedFunds.map((fund) => (
            <FundCard key={fund.id} fund={fund} onClick={() => navigate(`/funds/${fund.id}`)} isAdmin={isAdmin} onDelete={setDeleteTarget} />
          ))}
          {restrictedFunds.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-8">لا توجد برامج مقيدة بعد</p>
          )}
        </div>
      </section>

      {/* تأكيد الحذف */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500 mb-6">
              هل أنت متأكد من حذف خزينة <span className="font-medium text-gray-700">{deleteTarget.name}</span>؟
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                إلغاء
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة خزينة */}
      {showForm && (
        <FundForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadFunds(); }}
        />
      )}
    </div>
  );
}

function FundCard({ fund, onClick, isAdmin, onDelete }) {
  const isMain = fund.type === 'main';
  const Icon = isMain ? Banknote : Building2;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-teal-200 transition-all group relative">
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(fund); }}
          className="absolute top-3 left-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
          title="حذف الخزينة"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div onClick={onClick} className="cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${isMain ? 'bg-teal-50' : 'bg-blue-50'}`}>
            <Icon className={`w-6 h-6 ${isMain ? 'text-teal-600' : 'text-blue-600'}`} />
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
    </div>
  );
}
