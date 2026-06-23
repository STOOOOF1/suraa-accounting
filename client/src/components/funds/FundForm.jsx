import { useState } from 'react';
import { fundsApi } from '../../api/funds';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function FundForm({ fund, onClose, onCreated }) {
  const [name, setName] = useState(fund?.name || '');
  const [type, setType] = useState(fund?.type || 'restricted');
  const [description, setDescription] = useState(fund?.description || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('يرجى إدخال اسم الخزينة');

    setSubmitting(true);
    try {
      if (fund) {
        await fundsApi.update(fund.id, { name, description });
        toast.success('تم تحديث الخزينة');
      } else {
        await fundsApi.create({ name, type, description });
        toast.success('تم إنشاء الخزينة');
      }
      onCreated();
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {fund ? 'تعديل خزينة' : 'إضافة خزينة جديدة'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="اسم الخزينة"
            />
          </div>

          {!fund && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                <option value="restricted">برنامج مقيد</option>
                <option value="main">رئيسية</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              placeholder="وصف الخزينة (اختياري)"
            />
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
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-teal-300"
            >
              {submitting ? 'جاري الحفظ...' : fund ? 'حفظ التغييرات' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
