import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';

const SubscriptionBookingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-amiri overflow-hidden min-h-screen">
      <header className="sticky top-0 z-30 flex items-center gap-4 px-6 pt-6 pb-4 bg-app-bg shadow-sm border-b border-app-card/30 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex-shrink-0"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-semibold text-app-text flex-1 truncate text-right">
          حجز الجلسة القادمة
        </h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 pb-20 p-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-app-gold border border-app-card/30 shadow-sm animate-pulse">
          <CalendarDays size={48} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-app-text mb-2">قريباً</h2>
        <p className="text-sm text-app-textSec font-normal max-w-[240px] leading-relaxed">
          نعمل على إطلاق نظام حجز المواعيد المباشر من داخل الباقة قريباً.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionBookingPage;