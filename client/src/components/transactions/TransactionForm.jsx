import { useState, useEffect } from 'react';
import { fundsApi } from '../../api/funds';
import { transactionsApi } from '../../api/transactions';
import { storageApi } from '../../api/storage';
import { resizeImage } from '../../utils/imageResize';
import toast from 'react-hot-toast';
import { X, ArrowDownFromLine, ArrowUpFromLine, Paperclip, Loader2 } from 'lucide-react';

export default function TransactionForm({ type, onClose, onCreated }) {
  const isDeposit = type === 'deposit';
  const [funds, setFunds] = useState([]);
  const [fundId, setFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fundsApi.getAll().then(({ funds: data }) => setFunds(data)).catch(() => {});
  }, []);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      return toast.error('حجم الملف يتجاوز 10 ميجابايت');
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) {
      return toast.error('الرجاء اختيار صورة (JPG, PNG, WebP, GIF)');
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fundId || !amount || Number(amount) <= 0) {
      return toast.error('يرجى اختيار الخزينة وإدخال مبلغ صحيح');
    }
    setSubmitting(true);

    try {
      let attachmentUrl = null;
      if (file) {
        setUploading(true);
        const resized = await resizeImage(file);
        attachmentUrl = await storageApi.uploadAttachment(resized);
        setUploading(false);
      }

      const { transaction, new_balance } = await transactionsApi.create({
        fund_id: fundId,
        type,
        amount: Number(amount),
        description,
        attachment_url: attachmentUrl,
      });
      toast.success(`تم إنشاء سند ${isDeposit ? 'قبض' : 'صرف'} بنجاح`);
      onCreated(transaction, new_balance);
    } catch {
      toast.error('حدث خطأ أثناء إنشاء السند');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDeposit ? 'bg-green-50' : 'bg-red-50'}`}>
              {isDeposit
                ? <ArrowDownFromLine className="w-5 h-5 text-green-600" />
                : <ArrowUpFromLine className="w-5 h-5 text-red-600" />
              }
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              سند {isDeposit ? 'قبض' : 'صرف'} جديد
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الخزينة</label>
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              <option value="">اختر الخزينة...</option>
              {funds.filter((f) => f.is_active).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (ريال)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البيان</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              placeholder="وصف المعاملة (اختياري)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إرفاق صورة فاتورة أو إثبات
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors">
              {preview ? (
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="معاينة"
                    className="max-h-32 rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-teal-600">
                  <Paperclip className="w-8 h-8" />
                  <span className="text-sm">انقر لإرفاق صورة</span>
                  <span className="text-xs text-gray-300">JPG, PNG, WebP - حد أقصى 10MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                isDeposit ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'جاري...' : `تسجيل سند ${isDeposit ? 'قبض' : 'صرف'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
