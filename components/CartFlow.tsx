
import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, CalendarDays, Clock, FileText, AlertCircle, Ticket, Wallet, CreditCard } from 'lucide-react';
import { Order } from '../App';
import { BookingItem, Appointment, UserSubscription } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { STORAGE_KEY_APPOINTMENTS, STORAGE_KEY_SUBSCRIPTIONS } from '../constants';
import AppHeader from './AppHeader';
import AppImage from './AppImage';

interface BookingPageProps {
  onAddOrder: (order: Order) => void;
}

type CheckoutStep = 'details' | 'success';

const STORAGE_KEY_DRAFT_BOOKING = 'mezo_draft_booking_v1';

const BookingPage: React.FC<BookingPageProps> = ({ onAddOrder }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get the booking item & return path from router state
  const state = location.state as (BookingItem & { returnPath?: string }) | undefined;
  const bookingItem = state; // alias for clarity

  const [step, setStep] = useState<CheckoutStep>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [lastPaidAmount, setLastPaidAmount] = useState('0.000');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'wallet'>('online');

  // Mock wallet balance (source of truth for demo)
  const walletBalance = 12.500;

  // Redirect if no item found
  useEffect(() => {
    if (!bookingItem) {
      navigate('/');
    }
  }, [bookingItem, navigate]);

  const handleBack = () => {
    if (state?.returnPath) {
      navigate(state.returnPath);
    } else {
      navigate('/');
    }
  };

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [bookingForm, setBookingForm] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DRAFT_BOOKING);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        date: parsed.date || getTomorrowDate(),
        time: parsed.time || '09:00',
        notes: parsed.notes || ''
      };
    }
    return {
      date: getTomorrowDate(),
      time: '09:00',
      notes: ''
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DRAFT_BOOKING, JSON.stringify(bookingForm));
  }, [bookingForm]);

  const totalAmountNum = useMemo(() => {
    if (!bookingItem) return 0;

    // Case 2: Package Option from Dashboard (Computed Price passed in state)
    if (bookingItem.customFinalPrice !== undefined) {
      return bookingItem.customFinalPrice * bookingItem.quantity;
    }

    // Case 3: Regular Service + Addons
    const basePrice = parseFloat(bookingItem.product.price.replace(/[^\d.]/g, ''));
    const addonsPrice = bookingItem.selectedAddons ? bookingItem.selectedAddons.reduce((acc, addon) => acc + addon.price_kwd, 0) : 0;
    return (basePrice + addonsPrice) * bookingItem.quantity;
  }, [bookingItem]);

  // Always Full Payment
  const amountDueNow = totalAmountNum;

  // Split Logic Helpers
  const walletPay = paymentMethod === 'wallet' ? Math.min(walletBalance, amountDueNow) : 0;
  const remainingPay = amountDueNow - walletPay;

  const isFormValid = useMemo(() => {
    if (!bookingForm.date || !bookingForm.time) return false;
    return true;
  }, [bookingForm]);

  const handlePay = () => {
    if (!bookingItem) return;
    if (!isFormValid) return;

    setIsProcessing(true);

    setTimeout(() => {
      const orderId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

      let statusText = '';
      let paymentType = 'online';

      if (paymentMethod === 'online') {
        statusText = 'مؤكد (تم الدفع بالكامل)';
        paymentType = 'online';
      } else {
        if (remainingPay === 0) {
          statusText = 'مؤكد (تم الخصم من المحفظة)';
          paymentType = 'wallet';
        } else {
          statusText = `مؤكد (محفظة ${walletPay.toFixed(3)} + أونلاين ${remainingPay.toFixed(3)})`;
          paymentType = 'wallet+online';
        }
      }

      // Determine package name
      let packageNameStr = bookingItem.product.name;
      if (bookingItem.packageOption) {
        packageNameStr = `${bookingItem.product.name} (${bookingItem.packageOption.sessionsCount} جلسات)`;
      }

      const newOrder: Order = {
        id: orderId,
        date: new Date().toLocaleDateString('en-GB'), // Order Date
        time: bookingForm.time,
        status: statusText,
        total: `${totalAmountNum.toFixed(3)} د.ك`,
        items: [], // Legacy field
        isPackage: !!bookingItem.packageOption,
        packageName: packageNameStr,
        walletPaid: walletPay,
        onlinePaid: remainingPay,
        paymentMethodType: paymentType
      };

      // --- Handle Subscription Creation ---

      // Scenario B: Dashboard Package Option (Book 1st session now)
      if (bookingItem.packageOption) {
        const pkgOpt = bookingItem.packageOption;
        const expiryDateObj = new Date();
        // Use dynamic validity if set, otherwise default 30
        expiryDateObj.setDate(expiryDateObj.getDate() + (pkgOpt.validityDays || 30));

        const newSubscription: UserSubscription = {
          id: `sub_${Date.now()}`,
          serviceId: bookingItem.product.id,
          packageTitle: pkgOpt.titleText || `${bookingItem.product.name} (${pkgOpt.sessionsCount} جلسات)`,
          status: 'active',
          sessionsTotal: pkgOpt.sessionsCount,
          sessionsUsed: 1, // Consumed for this booking
          expiryDate: expiryDateObj.toLocaleDateString('en-GB'),
          minGapDays: 0,
          durationMinutes: 60, // Default or parse from product
          purchaseDate: new Date().toLocaleDateString('en-GB')
        };
        saveSubscription(newSubscription);
      }

      // --- Handle Appointment Creation ---
      const durationMatch = bookingItem.product.duration?.match(/\d+/);
      const durationVal = durationMatch ? parseInt(durationMatch[0]) : 60;

      const newAppt: Appointment = {
        id: `apt_${Date.now()}`,
        source: bookingItem.packageOption ? 'subscription' : 'service',
        serviceId: bookingItem.product.id,
        serviceName: bookingItem.product.name,
        durationMinutes: durationVal,
        dateISO: bookingForm.date,
        time24: bookingForm.time,
        pricePaidNow: amountDueNow,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        bookingType: 'SALON',
      };
      saveAppointment(newAppt);

      localStorage.removeItem(STORAGE_KEY_DRAFT_BOOKING);

      setLastOrderId(orderId);
      setLastPaidAmount(amountDueNow.toFixed(3));
      onAddOrder(newOrder);
      setIsProcessing(false);
      setStep('success');
    }, 2000);
  };

  const saveSubscription = (sub: UserSubscription) => {
    const storedSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    const currentSubs: UserSubscription[] = storedSubs ? JSON.parse(storedSubs) : [];
    currentSubs.push(sub);
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(currentSubs));
  };

  const saveAppointment = (appt: Appointment) => {
    const storedAppts = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    const appointments: Appointment[] = storedAppts ? JSON.parse(storedAppts) : [];
    appointments.push(appt);
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  };

  if (!bookingItem) return null;

  const renderDetails = () => (
    <div className="flex flex-col h-full animate-fadeIn bg-app-bg relative">
      <AppHeader
        title="بيانات الحجز والدفع"
        bgClassName="bg-white/95 backdrop-blur-md"
        onBack={handleBack}
      />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pt-24 pb-80">

        {/* Item Summary */}
        <section>
          <h2 className="text-sm font-semibold text-app-text mb-4 flex items-center gap-2">
            <Ticket size={18} className="text-app-gold" />
            تفاصيل الخدمة
          </h2>
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-app-card/30">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-app-bg overflow-hidden shrink-0">
                <AppImage src={bookingItem.product.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-app-text">{bookingItem.product.name}</h3>
                {bookingItem.packageOption ? (
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-app-gold/10 text-app-gold px-2 py-0.5 rounded-md font-semibold">
                      {bookingItem.packageOption.sessionsCount} جلسات
                    </span>
                  </div>
                ) : bookingItem.selectedAddons && bookingItem.selectedAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {bookingItem.selectedAddons.map(a => (
                      <span key={a.id} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">+{a.title_ar}</span>
                    ))}
                  </div>
                )}
                <p className="text-sm font-semibold text-app-gold mt-1.5">{totalAmountNum.toFixed(3)} د.ك</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-app-text mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-app-gold" />
            الموعد المفضل
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="date"
                className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm text-right"
                value={bookingForm.date}
                onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
              />
              <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec pointer-events-none" size={18} />
            </div>

            <div className="relative">
              <input
                type="time"
                className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm text-right"
                value={bookingForm.time}
                onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
              />
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec pointer-events-none" size={18} />
            </div>
          </div>
        </section>

        <section>
          <div className="relative">
            <textarea
              placeholder="ملاحظات إضافية (اختياري)"
              className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm h-24"
              value={bookingForm.notes} onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
            <FileText className="absolute left-4 top-4 text-app-textSec pointer-events-none" size={18} />
          </div>
        </section>

      </div>

      {/* Absolute Bottom Footer (Constrained to Parent Width) */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-app-card/30 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-app-textSec">
            <span>إجمالي القيمة:</span>
            <span>{totalAmountNum.toFixed(3)} د.ك</span>
          </div>

          <div className="flex items-center justify-between bg-app-gold/10 p-3 rounded-xl">
            <span className="text-sm font-semibold text-app-gold">المبلغ المطلوب الآن:</span>
            <span className="text-base font-semibold text-app-gold">{amountDueNow.toFixed(3)} د.ك</span>
          </div>
        </div>

        {/* Minimal Payment Method Selector */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setPaymentMethod('wallet')}
            className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-2 ${paymentMethod === 'wallet' ? 'bg-app-gold text-white border-app-gold shadow-md' : 'bg-white text-app-textSec border-gray-200'}`}
          >
            <Wallet size={16} />
            <span>الدفع من المحفظة</span>
          </button>
          <button
            onClick={() => setPaymentMethod('online')}
            className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-2 ${paymentMethod === 'online' ? 'bg-app-gold text-white border-app-gold shadow-md' : 'bg-white text-app-textSec border-gray-200'}`}
          >
            <CreditCard size={16} />
            <span>الدفع أونلاين</span>
          </button>
        </div>

        {paymentMethod === 'wallet' && remainingPay > 0 && (
          <p className="text-[10px] text-app-textSec text-center mb-2 px-4 leading-relaxed">
            سيتم خصم <span className="font-semibold text-app-text">{walletPay.toFixed(3)} د.ك</span> من المحفظة،
            والمتبقي <span className="font-semibold text-app-text">{remainingPay.toFixed(3)} د.ك</span> سيتم دفعه أونلاين
          </p>
        )}

        <div className="flex items-start gap-2 text-[10px] p-3 rounded-xl mb-4 bg-blue-50 text-blue-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span className="font-semibold leading-tight">
            المبلغ المدفوع غير مسترجع في حال عدم الحضور.
          </span>
        </div>

        <button
          onClick={handlePay}
          disabled={isProcessing || !isFormValid}
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            paymentMethod === 'wallet' && remainingPay === 0 ? 'دفع من المحفظة' :
              paymentMethod === 'wallet' ? 'دفع المتبقي أونلاين' : 'دفع كامل المبلغ'
          )}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fadeIn bg-white">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 animate-bounce">
        <CheckCircle2 size={56} />
      </div>
      <h1 className="text-xl font-semibold text-app-text mb-2">
        {bookingItem?.packageOption
          ? 'تم شراء الباقة بنجاح!'
          : 'تم تأكيد حجزك!'}
      </h1>
      <p className="text-app-textSec mb-6 leading-relaxed">
        {bookingItem?.packageOption
          ? 'تم تفعيل الباقة في حسابك. يمكنك الآن حجز الجلسات القادمة من قسم اشتراكاتي.'
          : 'تم تأكيد الموعد. يرجى الاحتفاظ برقم الحجز.'}
      </p>

      <div className="bg-app-bg px-6 py-3 rounded-2xl mb-10 border border-app-card/30">
        <div className="flex items-center justify-between gap-8 mb-2">
          <div className="text-center">
            <span className="text-app-textSec text-[10px] font-semibold block">رقم الحجز</span>
            <span className="text-app-text font-semibold text-sm">#{lastOrderId}</span>
          </div>
          <div className="text-center">
            <span className="text-app-textSec text-[10px] font-semibold block">المدفوع</span>
            <span className="text-app-gold font-semibold text-sm">{lastPaidAmount} د.ك</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-3">
        {bookingItem?.packageOption ? (
          <>
            <button
              onClick={() => {
                navigate('/subscriptions', { state: { toastMessage: 'تم تفعيل الباقة بنجاح' } });
              }}
              className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              عرض اشتراكاتي
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-app-gold font-semibold py-4 rounded-2xl active:bg-app-bg transition-colors"
            >
              الرجوع للرئيسية
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                navigate('/appointments');
              }}
              className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              الذهاب إلى مواعيدي
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-app-gold font-semibold py-4 rounded-2xl active:bg-app-bg transition-colors"
            >
              الرجوع للرئيسية
            </button>
          </>
        )}
      </div>
    </div>
  );

  return step === 'details' ? renderDetails() : renderSuccess();
};

export default BookingPage;
