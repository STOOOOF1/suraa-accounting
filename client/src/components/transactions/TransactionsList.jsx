import { useState, useEffect } from 'react';
import { transactionsApi } from '../../api/transactions';
import { fundsApi } from '../../api/funds';
import { formatCurrency, formatDate } from '../../utils/format';
import Loader from '../common/Loader';
import TransactionForm from './TransactionForm';
import toast from 'react-hot-toast';
import {
  Plus,
  RefreshCw,
  Wallet,
  Filter,
  Image,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function TransactionsList({ type, title, icon: Icon }) {
  const isDeposit = type === 'deposit';
  const [transactions, setTransactions] = useState([]);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterFund, setFilterFund] = useState('');
  const [viewingImage, setViewingImage] = useState(null);

  const load = async (fundFilter = filterFund) => {
    try {
      setLoading(true);
      const params = { type, limit: 100 };
      if (fundFilter) params.fund_id = fundFilter;
      const { transactions: data } = await transactionsApi.getAll(params);
      setTransactions(data);
      const { funds: f } = await fundsApi.getAll();
      setFunds(f);
    } catch {
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sumAmount = transactions.reduce((s, t) => s + Number(t.amount), 0);

  const txWithAttachments = transactions.filter(tx => tx.attachment_url);
  const currentImageTx = viewingImage
    ? transactions.find(tx => tx.id === viewingImage)
    : null;
  const currentImageUrl = currentImageTx?.attachment_url || null;
  const currentImageIndex = viewingImage
    ? txWithAttachments.findIndex(tx => tx.id === viewingImage)
    : -1;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDeposit ? 'bg-green-50' : 'bg-red-50'}`}>
            <Icon className={`w-6 h-6 ${isDeposit ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">
              الإجمالي: <span className={`font-medium ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(sumAmount)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(filterFund)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white transition-colors bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            سند {isDeposit ? 'قبض' : 'صرف'} جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400 shrink-0" />
          <select
            value={filterFund}
            onChange={(e) => { setFilterFund(e.target.value); load(e.target.value); }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">جميع الخزائن</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader message="جاري التحميل..." />
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">لا توجد سندات {isDeposit ? 'قبض' : 'صرف'} بعد</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-teal-600 hover:text-teal-700 text-sm font-medium">
            + إنشاء أول سند
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => {
              const fund = funds.find((f) => f.id === tx.fund_id);
              return (
                <div key={tx.id} className="p-4 lg:p-5 flex items-start gap-4 hover:bg-gray-50">
                  <div className={`p-2 rounded-lg shrink-0 ${isDeposit ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Icon className={`w-5 h-5 ${isDeposit ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{tx.description || `${isDeposit ? 'قبض' : 'صرف'}`}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      <span>{formatDate(tx.created_at)}</span>
                      {fund && <span>{fund.name}</span>}
                      {tx.reference_no && <span>رقم: {tx.reference_no}</span>}
                    </div>
                    {tx.attachment_url && (
                      <button
                        onClick={() => setViewingImage(tx.id)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        <Image className="w-3.5 h-3.5" />
                        عرض الإرفاق
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {tx.attachment_url && (
                      <img
                        src={tx.attachment_url}
                        alt="مرفق"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80"
                        onClick={() => setViewingImage(tx.id)}
                      />
                    )}
                    <p className={`text-sm font-bold ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <TransactionForm
          type={type}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}

      {viewingImage && currentImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            {currentImageIndex > 0 && (
              <button
                onClick={() => setViewingImage(txWithAttachments[currentImageIndex - 1].id)}
                className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-full -mr-4 bg-white rounded-full p-1.5 shadow-lg"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            )}
            {currentImageIndex < txWithAttachments.length - 1 && (
              <button
                onClick={() => setViewingImage(txWithAttachments[currentImageIndex + 1].id)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-4 bg-white rounded-full p-1.5 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <img
              src={currentImageUrl}
              alt="مرفق السند"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
