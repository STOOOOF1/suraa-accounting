import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dashboardApi } from '../api/dashboard';
import { LayoutDashboard, Users, Wallet, TrendingUp, Building2, ArrowDownFromLine, ArrowUpFromLine, FileText, Banknote } from 'lucide-react';

function formatCurrency(value) {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' ر.س';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const typeLabels = {
  deposit: { text: 'قبض', color: 'text-green-600', bg: 'bg-green-50' },
  withdrawal: { text: 'صرف', color: 'text-red-600', bg: 'bg-red-50' },
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.getSummary()
      .then(setData)
      .catch(() => setError('تعذر تحميل بيانات لوحة المعلومات'))
      .finally(() => setLoading(false));
  }, []);

  const quickCards = [
    {
      icon: Wallet,
      label: 'الخزينة الرئيسية',
      value: data ? formatCurrency(data.main_balance) : '٠٫٠٠ ر.س',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      icon: Building2,
      label: 'البرامج المقيدة',
      value: data ? formatCurrency(data.restricted_balance) : '٠٫٠٠ ر.س',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: ArrowDownFromLine,
      label: 'إجمالي القبض',
      value: data ? formatCurrency(data.total_deposits) : '٠٫٠٠ ر.س',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: ArrowUpFromLine,
      label: 'إجمالي الصرف',
      value: data ? formatCurrency(data.total_withdrawals) : '٠٫٠٠ ر.س',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  const transactions = data?.recent_transactions || [];
  const funds = data?.funds || [];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              مرحباً بك، {user?.full_name}
            </h1>
            <p className="text-sm text-gray-500">
              {isAdmin ? 'مدير النظام' : 'مدخل بيانات'} - جمعية سفراء التعليمية
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {quickCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-3 rounded-lg ${card.bg} mb-3`}>
              <card.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${card.color}`} />
            </div>
            <p className="text-xs lg:text-sm text-gray-500">{card.label}</p>
            <p className={`text-base lg:text-xl font-bold mt-1 ${loading ? 'text-gray-300 animate-pulse' : 'text-gray-900'}`}>
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      {!loading && funds.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-teal-600" />
            تفاصيل الخزائن
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">الخزينة</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">النوع</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-medium">الرصيد</th>
                  <th className="text-center py-3 px-2 text-green-600 font-medium">إجمالي القبض</th>
                  <th className="text-center py-3 px-2 text-red-600 font-medium">إجمالي الصرف</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{f.name}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded ${f.type === 'main' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                        {f.type === 'main' ? 'رئيسية' : 'مقيدة'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-gray-900">{formatCurrency(f.balance)}</td>
                    <td className="py-3 px-2 text-center font-medium text-green-600">{formatCurrency(f.total_deposits)}</td>
                    <td className="py-3 px-2 text-center font-medium text-red-600">{formatCurrency(f.total_withdrawals)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">آخر العمليات</h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد عمليات مالية بعد</p>
              <p className="text-sm text-gray-300 mt-1">سيتم عرض آخر سندات القبض والصرف هنا</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const t = typeLabels[tx.type] || {};
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.bg || 'bg-gray-100'}`}>
                        <FileText className={`w-4 h-4 ${t.color || 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.fund_name}</p>
                        <p className="text-xs text-gray-500">
                          {tx.reference_no} - {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${t.color}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded ${t.bg} ${t.color}`}>
                        {t.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المستخدمون النشطون</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.full_name?.charAt(0) || 'م'}
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-sm text-gray-500">{isAdmin ? 'مدير النظام' : 'مدخل بيانات'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
