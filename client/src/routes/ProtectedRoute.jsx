import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';

/**
 * مكون حماية المسارات
 * يسمح بالوصول فقط للمستخدمين المسجلين (والأدوار المسموحة)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen message="جاري التحقق من الصلاحية..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-500 mb-4">ليس لديك صلاحية كافية للوصول إلى هذه الصفحة.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
}
