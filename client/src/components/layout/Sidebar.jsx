import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Wallet,
  ArrowDownFromLine,
  ArrowUpFromLine,
  LogOut,
  X,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'لوحة المعلومات', path: '/', roles: ['admin', 'data_entry'] },
  { icon: Wallet, label: 'الخزائن', path: '/funds', roles: ['admin', 'data_entry'] },
  { icon: ArrowDownFromLine, label: 'سندات القبض', path: '/receipts', roles: ['admin', 'data_entry'] },
  { icon: ArrowUpFromLine, label: 'سندات الصرف', path: '/payments', roles: ['admin', 'data_entry'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* خلفية معتمة للشاشات الصغيرة */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* رأس القائمة - الشعار */}
        <div className="shrink-0 h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div>
            <h2 className="font-bold text-gray-900">سفراء</h2>
            <p className="text-xs text-gray-500">النظام المحاسبي</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* روابط التنقل */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className={`w-5 h-5 shrink-0 ${item.label === 'الخزائن' ? '' : ''}`} />
                {item.label}
              </NavLink>
            ))}
        </nav>

        {/* أسفل القائمة - معلومات المستخدم */}
        <div className="shrink-0 p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {user?.full_name?.charAt(0) || 'م'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isAdmin ? 'مدير النظام' : 'مدخل بيانات'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
