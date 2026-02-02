
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, MessageSquare, Calendar, ShoppingBag, Ticket, CheckCircle2, Clock } from 'lucide-react';
import { teamData, TeamClient, TeamAppointment, TeamSubscription } from '../data/demoData';

const ClientProfilePage: React.FC = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<TeamClient | undefined>();
  const [appointments, setAppointments] = useState<TeamAppointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<TeamSubscription[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (clientId) {
      const c = teamData.getClientById(clientId);
      if (c) {
        setClient(c);
        setAppointments(teamData.getClientAppointments(clientId));
        setSubscriptions(teamData.getClientActiveSubscriptions(clientId));
      }
    }
  }, [clientId]);

  const handleConfirmAttendance = (apptId: string) => {
    setIsConfirming(true);
    setTimeout(() => {
      teamData.updateAppointmentStatus(apptId, 'completed');
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'completed' } : a));
      setIsConfirming(false);
    }, 1000);
  };

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg text-gray-400 font-bold">
        جاري التحميل أو العميل غير موجود...
      </div>
    );
  }

  const upcomingAppt = appointments.find(a => a.status === 'upcoming');

  return (
    <div className="min-h-full bg-app-bg pt-6 pb-24">
      {/* Navbar */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-app-text hover:bg-gray-50"
        >
          <ArrowRight size={20} />
        </button>
        <span className="font-bold text-lg">ملف العميلة</span>
        <div className="w-10" />
      </div>

      {/* Profile Card */}
      <div className="mx-6 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-6 text-center">
        <div className="w-20 h-20 bg-app-bg rounded-full mx-auto mb-4 flex items-center justify-center text-app-gold text-2xl font-bold border-2 border-white shadow-lg">
          {client.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-app-text mb-1">{client.name}</h2>
        <p className="text-sm text-gray-400 font-mono mb-4" dir="ltr">{client.phone}</p>
        
        <div className="flex justify-center gap-3">
          <a href={`tel:${client.phone}`} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
            <Phone size={18} />
          </a>
          <a href={`https://wa.me/${client.phone}`} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
            <MessageSquare size={18} />
          </a>
        </div>

        {client.notes && (
          <div className="mt-6 bg-yellow-50 p-3 rounded-2xl text-xs text-yellow-700 font-medium border border-yellow-100">
            ملاحظات: {client.notes}
          </div>
        )}
      </div>

      {/* Quick Action: Confirm Attendance */}
      {upcomingAppt && (
        <div className="mx-6 mb-8">
          <div className="bg-[#483383] text-white p-6 rounded-[24px] shadow-xl shadow-[#483383]/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/60 text-xs font-bold mb-1">موعد اليوم</p>
                  <h3 className="text-lg font-bold">{upcomingAppt.serviceName}</h3>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md">
                  <span className="font-mono font-bold">{upcomingAppt.time}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleConfirmAttendance(upcomingAppt.id)}
                disabled={isConfirming}
                className="w-full bg-white text-[#483383] py-3 rounded-xl font-bold text-sm hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isConfirming ? 'جاري التأكيد...' : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>تأكيد الحضور وبدء الخدمة</span>
                  </>
                )}
              </button>
            </div>
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10" />
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6 px-6">
        {/* Subscriptions */}
        <div className="bg-white p-5 rounded-[24px] border border-gray-100">
          <h3 className="font-bold text-app-text mb-4 flex items-center gap-2">
            <Ticket size={18} className="text-app-gold" />
            الاشتراكات الفعالة
          </h3>
          {subscriptions.length > 0 ? (
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <div key={sub.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-app-text">{sub.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-app-gold" 
                        style={{ width: `${(sub.usedSessions / sub.totalSessions) * 100}%` }} 
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {sub.usedSessions}/{sub.totalSessions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">لا توجد اشتراكات نشطة</p>
          )}
        </div>

        {/* History */}
        <div className="bg-white p-5 rounded-[24px] border border-gray-100">
          <h3 className="font-bold text-app-text mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-app-gold" />
            آخر المواعيد
          </h3>
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-bold text-app-text">{apt.serviceName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span dir="ltr">{apt.date}</span>
                    <span>•</span>
                    <span dir="ltr">{apt.time}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${
                  apt.status === 'completed' ? 'bg-green-50 text-green-600' : 
                  apt.status === 'upcoming' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {apt.status === 'completed' ? 'مكتمل' : apt.status === 'upcoming' ? 'قادم' : apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
