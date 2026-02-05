import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Clock, Check } from 'lucide-react';
import { UserSubscription, Appointment } from '../types';
import { DEMO_PRODUCTS, STORAGE_KEY_SUBSCRIPTIONS, STORAGE_KEY_APPOINTMENTS } from '../constants';
import AppHeader from './AppHeader';

const EditAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { subscriptionId } = useParams();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    if (stored) {
      const subs = JSON.parse(stored) as UserSubscription[];
      const found = subs.find(s => s.id === subscriptionId);
      if (found) {
        setSubscription(found);
        if (found.nextSession) {
          setSelectedDate(found.nextSession.date);
          setSelectedTime(found.nextSession.time);
        }
      }
    }
  }, [subscriptionId]);

  const service = useMemo(() => {
    if (!subscription) return null;
    return DEMO_PRODUCTS.find(p => p.id === subscription.serviceId);
  }, [subscription]);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !subscription || !service) return;
    setIsProcessing(true);

    setTimeout(() => {
      const storedSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      if (storedSubs) {
        const subs = JSON.parse(storedSubs) as UserSubscription[];
        const updatedSubs = subs.map(s => {
          if (s.id === subscriptionId) {
            return {
              ...s,
              nextSession: { date: selectedDate, time: selectedTime }
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(updatedSubs));
      }

      const storedAppts = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
      let appointments: Appointment[] = storedAppts ? JSON.parse(storedAppts) : [];

      const existingApptIndex = appointments.findIndex(a =>
        a.subscriptionId === subscriptionId && a.status === 'upcoming'
      );

      if (existingApptIndex >= 0) {
        appointments[existingApptIndex] = {
          ...appointments[existingApptIndex],
          dateISO: selectedDate,
          time24: selectedTime
        };
      } else {
        const newAppt: Appointment = {
          id: `apt_${Date.now()}`,
          source: 'subscription',
          subscriptionId: subscription.id,
          serviceId: service.id,
          serviceName: service.name,
          durationMinutes: subscription.durationMinutes,
          dateISO: selectedDate,
          time24: selectedTime,
          status: 'upcoming',
          createdAt: new Date().toISOString()
        };
        appointments.push(newAppt);
      }

      localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));

      setIsProcessing(false);
      navigate('/appointments', { state: { toastMessage: 'تم تعديل الموعد بنجاح' } });
    }, 1500);
  };

  if (!subscription || !service) return null;

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-amiri overflow-hidden min-h-screen">
      <AppHeader
        title="تعديل الموعد"
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-48 px-6 pt-24 space-y-6">

        {/* Summary Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-app-textSec mb-1">{service.name}</h2>
            <h3 className="text-base font-semibold text-app-text">{subscription.packageTitle}</h3>
          </div>

          <div className="space-y-3 bg-app-bg/50 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-app-textSec">الموعد الحالي:</span>
              <span className="font-semibold text-app-text" dir="ltr">
                {subscription.nextSession?.date} - {subscription.nextSession?.time}
              </span>
            </div>
          </div>
        </div>

        {/* Date/Time Pickers */}
        <section>
          <h2 className="text-sm font-semibold text-app-text mb-4">اختاري موعداً جديداً</h2>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="date"
                className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm text-right"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
              <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec pointer-events-none" size={18} />
            </div>

            <div className="relative">
              <input
                type="time"
                className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-sm text-right"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
              />
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec pointer-events-none" size={18} />
            </div>
          </div>
        </section>

      </div>

      <div className="fixed bottom-[90px] left-0 right-0 p-6 bg-white border-t border-app-card/30 z-40 max-w-[430px] mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleConfirm}
          disabled={isProcessing || !selectedDate || !selectedTime}
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={20} />
              <span>تأكيد تعديل الموعد</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default EditAppointmentPage;