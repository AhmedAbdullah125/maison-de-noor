import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
   ArrowRight,
   Clock,
   CheckCircle2,
   Ticket,
   AlertCircle,
   ChevronDown,
   CalendarDays,
   CreditCard,
   FileText,
   Timer
} from 'lucide-react';
import { DEMO_PRODUCTS, STORAGE_KEY_SUBSCRIPTIONS } from '../constants';
import AppImage from './AppImage';
import { UserSubscription } from '../types';
import AppHeader from './AppHeader';

const SubscriptionDetailsPage: React.FC = () => {
   const navigate = useNavigate();
   const { subscriptionId } = useParams();
   const location = useLocation();
   const [subscription, setSubscription] = useState<UserSubscription | null>(null);
   const [showTerms, setShowTerms] = useState(false);
   const isNewPurchase = location.state?.success;

   useEffect(() => {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      if (stored) {
         const subs = JSON.parse(stored) as UserSubscription[];
         const found = subs.find(s => s.id === subscriptionId);
         if (found) setSubscription(found);
      }
   }, [subscriptionId]);

   const service = useMemo(() => {
      if (!subscription) return null;
      return DEMO_PRODUCTS.find(p => p.id === subscription.serviceId);
   }, [subscription]);

   if (!subscription || !service) return null;

   const remaining = subscription.sessionsTotal - subscription.sessionsUsed;
   const progressPercent = (remaining / subscription.sessionsTotal) * 100;
   const isExpired = subscription.status === 'expired' || remaining === 0;

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

   const handleBookNext = () => {
      navigate(`/book-next-session/${subscription.id}`);
   };

   const handleEditAppointment = () => {
      navigate(`/edit-appointment/${subscription.id}`);
   };

   const mockHistory = Array.from({ length: subscription.sessionsUsed }).map((_, i) => ({
      date: '2025-10-0' + (i + 1),
      time: '14:00',
      status: 'تمت'
   }));

   return (
      <div className="flex flex-col h-full bg-app-bg relative font-amiri overflow-hidden min-h-screen animate-fadeIn">
         <AppHeader
            title="تفاصيل الاشتراك"
            onBack={() => navigate('/subscriptions')}
         />

         {/* Success Toast */}
         {isNewPurchase && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-green-500 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-3 z-[60] animate-slideUp">
               <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} strokeWidth={3} />
               </div>
               <span className="font-semibold text-sm">تم شراء الباقة بنجاح</span>
            </div>
         )}

         <div className="flex-1 overflow-y-auto no-scrollbar pb-28 px-6 pt-24 space-y-6">

            {/* 2) Top Summary Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <h2 className="text-xs font-semibold text-app-textSec mb-1">{service.name}</h2>
                     <h3 className="text-base font-semibold text-app-text">{subscription.packageTitle}</h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${getStatusStyle(subscription.status)}`}>
                     {getStatusLabel(subscription.status)}
                  </span>
               </div>

               <div className="flex items-center gap-4 mb-6 text-xs text-app-textSec">
                  <div className="flex items-center gap-1.5">
                     <Timer size={14} />
                     <span dir="ltr">ينتهي: {subscription.expiryDate}</span>
                  </div>
               </div>

               <div className="bg-app-bg/50 rounded-2xl p-4">
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xs font-semibold text-app-textSec">الجلسات المتبقية</span>
                     <span className="text-sm font-semibold text-app-gold">{remaining} من {subscription.sessionsTotal}</span>
                  </div>
                  <div className="w-full h-2 bg-app-card rounded-full overflow-hidden mb-2">
                     <div
                        className={`h-full rounded-full transition-all duration-1000 ${isExpired ? 'bg-gray-400' : 'bg-app-gold'}`}
                        style={{ width: `${progressPercent}%` }}
                     />
                  </div>
                  <p className="text-[9px] text-app-textSec opacity-80">
                     تم استخدام {subscription.sessionsUsed} من أصل {subscription.sessionsTotal} جلسات
                  </p>
               </div>
            </div>

            {isExpired && (
               <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600">
                  <AlertCircle size={20} />
                  <span className="font-semibold text-sm">هذا الاشتراك منتهي</span>
               </div>
            )}

            {/* 3) Next Session Card */}
            {!isExpired && (
               <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                  <div className="flex items-center gap-2 mb-4">
                     <CalendarDays size={20} className="text-app-gold" />
                     <h3 className="text-sm font-semibold text-app-text">الجلسة القادمة</h3>
                  </div>

                  {subscription.nextSession ? (
                     <>
                        <div className="bg-app-gold/5 border border-app-gold/20 rounded-2xl p-4 mb-4 flex justify-between items-center">
                           <div className="flex flex-col">
                              <span className="text-sm font-semibold text-app-text" dir="ltr">{subscription.nextSession.date}</span>
                              <span className="text-xs text-app-textSec mt-1" dir="ltr">{subscription.nextSession.time}</span>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                              <CheckCircle2 size={20} />
                           </div>
                        </div>
                        <p className="text-[10px] text-app-textSec mb-4 flex items-center gap-1.5">
                           <AlertCircle size={12} />
                           يرجى الحضور قبل الموعد بـ 10 دقائق
                        </p>
                        <button
                           onClick={handleEditAppointment}
                           className="w-full bg-white border border-app-gold text-app-gold font-semibold py-3.5 rounded-xl shadow-sm active:bg-app-bg transition-colors flex items-center justify-center gap-2"
                        >
                           <CalendarDays size={18} />
                           <span>تعديل الموعد</span>
                        </button>
                     </>
                  ) : (
                     <>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4 text-center">
                           <span className="text-sm font-semibold text-app-textSec">غير محدد</span>
                        </div>
                        <button
                           onClick={handleBookNext}
                           className="w-full bg-app-gold text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-app-gold/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                           <CalendarDays size={18} />
                           <span>احجزي الجلسة القادمة</span>
                        </button>
                     </>
                  )}
               </div>
            )}

            {/* 5) Features Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
               <div className="flex items-center gap-2 mb-4">
                  <Ticket size={20} className="text-app-gold" />
                  <h3 className="text-sm font-semibold text-app-text">ماذا يتضمن الاشتراك؟</h3>
               </div>
               <div className="space-y-3">
                  {[
                     `يشمل جلسات خدمة (${service.name})`,
                     'الحجز حسب المواعيد المتاحة',
                     'تذكير تلقائي قبل الموعد'
                  ].map((item, idx) => (
                     <div key={idx} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-app-gold/10 text-app-gold flex items-center justify-center shrink-0 mt-0.5">
                           <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm text-app-text">{item}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* 6) Conditions Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
               <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-app-gold" />
                  <h3 className="text-sm font-semibold text-app-text">الشروط</h3>
               </div>
               <ul className="list-disc list-outside pr-4 text-xs text-app-textSec space-y-2 mb-3 leading-relaxed">
                  <li>صلاحية الاشتراك حتى: <span dir="ltr">{subscription.expiryDate}</span></li>
                  <li>الحد الأدنى بين الجلسات: {subscription.minGapDays} يوم</li>
                  <li>سياسة الإلغاء: يمكن الإلغاء قبل 24 ساعة</li>
                  <li>عدم الحضور: يتم خصم الجلسة</li>
               </ul>
               <button
                  onClick={() => setShowTerms(true)}
                  className="text-xs font-semibold text-app-gold underline"
               >
                  عرض جميع الشروط
               </button>
            </div>

            {/* 7) Sessions History */}
            <div className="pb-8">
               <h3 className="text-sm font-semibold text-app-text mb-4 px-2">سجل الجلسات</h3>
               {mockHistory.length > 0 ? (
                  <div className="space-y-3">
                     {mockHistory.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-app-card/30 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                 <CheckCircle2 size={16} />
                              </div>
                              <div>
                                 <span className="block text-xs font-semibold text-app-text">جلسة {subscription.sessionsUsed - idx}</span>
                                 <span className="text-[10px] text-app-textSec" dir="ltr">{item.date} - {item.time}</span>
                              </div>
                           </div>
                           <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                              {item.status}
                           </span>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-8 bg-white rounded-2xl border border-app-card/30 border-dashed">
                     <p className="text-sm text-app-textSec">لا يوجد سجل جلسات حتى الآن</p>
                  </div>
               )}
            </div>

         </div>

         {showTerms && (
            <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end animate-fadeIn">
               <div
                  className="w-full bg-white rounded-t-[2rem] p-8 max-h-[80%] overflow-y-auto animate-slideUp relative"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button
                     onClick={() => setShowTerms(false)}
                     className="absolute top-6 right-6 p-2 bg-app-bg rounded-full text-app-text hover:bg-app-card"
                  >
                     <ChevronDown size={24} />
                  </button>
                  <h2 className="text-lg font-semibold text-app-text mb-6">الشروط والأحكام</h2>
                  <div className="space-y-4">
                     <p className="text-sm text-app-text leading-relaxed">
                        1. هذا الاشتراك شخصي ولا يمكن تحويله لشخص آخر.
                     </p>
                     <p className="text-sm text-app-text leading-relaxed">
                        2. العربون المدفوع لحجز الجلسات غير مسترجع في حال إلغاء الموعد قبل أقل من 24 ساعة أو عدم الحضور.
                     </p>
                     <p className="text-sm text-app-text leading-relaxed">
                        3. يجب استهلاك جميع الجلسات قبل تاريخ انتهاء الصلاحية الموضح.
                     </p>
                  </div>
                  <div className="h-10" />
               </div>
               <div className="absolute inset-0 -z-10" onClick={() => setShowTerms(false)} />
            </div>
         )}
      </div>
   );
};

export default SubscriptionDetailsPage;