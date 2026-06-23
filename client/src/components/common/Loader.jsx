import { Loader2 } from 'lucide-react';

export default function Loader({ fullScreen = false, message = 'جاري التحميل...' }) {
  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-gray-500 mt-3">{message}</p>
      </div>
    </div>
  );
}
