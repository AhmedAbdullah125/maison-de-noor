import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Ticket, 
  CalendarDays, 
  Clock, 
  ChevronLeft, 
  ShoppingBag,
  Timer,
  Check
} from 'lucide-react';
import { DEMO_PRODUCTS, STORAGE_KEY_SUBSCRIPTIONS } from '../constants';
import { UserSubscription } from '../types';
import AppHeader from './AppHeader';

const SubscriptionsTab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.toastMessage) {
      setToastMessage(location.state.toastMessage);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    if (stored) {
      setSubscriptions(JSON.parse(stored));
    }
    const timer = setTimeout(() => {
       setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const getService = (id: number) => DEMO_PRODUCTS.find(p => p.id === id);

  const getStatusStyle = (status: UserSubscription['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: UserSubscription['status']) => {
     switch (status) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'paused': return 'متوقف مؤقتاً';
      default: return '';
    }
  };

  const handleBookNext = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation();
    navigate(`/book-next-session/${subId}`);
  };

  const handleEditAppointment = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation();
    navigate(`/edit-appointment/${subId}`);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-[2rem] h-64 animate-pulse border border-app-card/30" />
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center pb-20 px-6">
      <div className="w-24 h-24 bg-app-card/50 rounded-full flex items-center justify-center mb-6 text-app-gold">
        <Ticket size={48} strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-app-text mb-2">لا يوجد لديك أي اشتراك</h2>
      <p className="text-sm text-app-textSec mb-8 max-w-[280px] leading-relaxed">
        عند شراء أي باقة ستظهر هنا ويمكنك حجز الجلسات منها
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-app-bg border border-app-gold text-app-gold px-8 py-4 rounded-2xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
      >
        <ShoppingBag size={20} />
        <span>استكشفي خدماتنا</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn relative bg-app-bg">
      <AppHeader title="اشتراكاتي" />
      
      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-app-gold text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-3 z-[100] animate-slideUp">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Check size={16} strokeWidth={3} />
          </div>
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {isLoading ? (
          renderSkeleton()
        ) : subscriptions.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-5">
            {subscriptions.map(sub => {
              const service = getService(sub.serviceId);
              if (!service) return null;
              
              const remaining = sub.sessionsTotal - sub.sessionsUsed;
              const progressPercent = (remaining / sub.sessionsTotal) * 100;
              const isActive = sub.status === 'active';

              return (
                <div 
                  key={sub.id}
                  onClick={() => navigate(`/subscription-details/${sub.id}`)}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-app-card/40 cursor-pointer active:scale-[0.98] transition-all group"
                >
                  <div className="px-6 pt-6 pb-4 flex justify-between items-start border-b border-app-bg/60">
                    <div>
                      <span className="block text-[10px] font-bold text-app-textSec mb-1">
                        {service.name}
                      </span>
                      <h3 className="text-lg font-bold text-app-text leading-tight">
                        {sub.packageTitle}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getStatusStyle(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="col-span-2">
                       <div className="flex items-center gap-2 mb-1.5">
                          <CalendarDays size={16} className="text-app-gold" />
                          <span className="text-xs font-bold text-app-text">الجلسة القادمة</span>
                       </div>
                       {sub.nextSession ? (
                         <div className="bg-app-bg/50 rounded-xl px-3 py-2 flex items-center justify-between border border-app-card/30">
                            <span className="text-sm font-bold text-app-text" dir="ltr">{sub.nextSession.date}</span>
                            <span className="text-xs font-medium text-app-textSec" dir="ltr">{sub.nextSession.time}</span>
                         </div>
                       ) : (
                         <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex flex-col justify-center text-center">
                            <span className="text-xs font-bold text-app-textSec">غير محدد</span>
                            <p className="text-[8px] text-app-textSec/60 mt-1 font-medium">احجزي الجلسة القادمة من زر "احجزي الجلسة القادمة"</p>
                         </div>
                       )}
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                          <Timer size={13} />
                          <span className="text-[10px] font-bold">صلاحية الاشتراك</span>
                      </div>
                      <span className="text-xs font-bold text-app-text block" dir="ltr">
                        ينتهي: {sub.expiryDate}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                       <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center gap-1.5">
                             <Ticket size={14} className="text-app-gold" />
                             <span className="text-xs font-bold text-app-text">الجلسات المتبقية</span>
                          </div>
                          <span className="text-xs font-bold text-app-gold">
                             {remaining} من {sub.sessionsTotal}
                          </span>
                       </div>
                       <div className="w-full h-2 bg-app-bg rounded-full overflow-hidden border border-app-card/20">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${sub.status === 'expired' ? 'bg-gray-400' : 'bg-app-gold'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                       </div>
                       <p className="text-[9px] text-app-textSec mt-1.5 text-left">
                         {sub.status === 'expired' 
                           ? 'انتهت صلاحية الجلسات المتبقية' 
                           : `تم استخدام ${sub.sessionsUsed} من أصل ${sub.sessionsTotal} جلسات`
                         }
                       </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-app-bg/30 border-t border-app-card/20">
                    {isActive && remaining > 0 ? (
                       <div className="flex gap-3">
                          {sub.nextSession ? (
                             <button 
                               onClick={(e) => handleEditAppointment(e, sub.id)}
                               className="flex-1 bg-app-gold text-white font-bold py-3 rounded-xl shadow-sm text-sm active:scale-[0.98] transition-all"
                             >
                               تعديل الموعد
                             </button>
                          ) : (
                             <button 
                               onClick={(e) => handleBookNext(e, sub.id)}
                               className="flex-1 bg-app-gold text-white font-bold py-3 rounded-xl shadow-sm text-sm active:scale-[0.98] transition-all"
                             >
                               احجزي الجلسة القادمة
                             </button>
                          )}
                          
                          <div className="w-12 h-11 flex items-center justify-center rounded-xl bg-white border border-app-card/30 text-app-gold">
                             <ChevronLeft size={20} />
                          </div>
                       </div>
                    ) : (
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-app-textSec">
                             {sub.status === 'expired' ? 'هذا الاشتراك منتهي' : 'تم استخدام جميع الجلسات'}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-app-gold font-bold">
                             <span>عرض التفاصيل</span>
                             <ChevronLeft size={14} />
                          </div>
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsTab;