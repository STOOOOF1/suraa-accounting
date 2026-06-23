import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* مساحة فارغة للشاشات الكبيرة */}
      <div className="hidden lg:block" />

      {/* الجهة اليسرى */}
      <div className="flex items-center gap-4">
        {/* إشعارات */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* المستخدم */}
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{isAdmin ? 'مدير النظام' : 'مدخل بيانات'}</p>
          </div>
          <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user?.full_name?.charAt(0) || 'م'}
          </div>
        </div>
      </div>
    </header>
  );
}
