
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, MessageSquare, Calendar, Ticket, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { DASHBOARD_API_BASE_URL } from '@/lib/apiConfig';
import { http } from '@/components/services/http';

// Types based on API response
interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  photo: string;
  wallet: string;
  lang: string;
  is_active: number;
  is_verify: number;
  created_at: string;
}

interface Session {
  id: number;
  session_number: number;
  status: 'scheduled' | 'completed' | 'pending' | 'cancelled';
  schedule: {
    session_date: string | null;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
  };
  customer_notes: string | null;
  created_at: string;
}

interface ServiceTranslation {
  id: number;
  language: string;
  name: string;
  description: string | null;
}

interface Service {
  id: number;
  main_image: string;
  price: string;
  translations: ServiceTranslation[];
}

interface Subscription {
  id: number;
  session_count: number;
  remaining_sessions: number;
  completed_sessions: number | null;
  subscription_name: string;
  service: string;
}

interface Request {
  id: number;
  request_number: string;
  status: string;
  sessions_info: {
    session_count: number;
    completed_sessions: number;
    remaining_sessions: number;
    progress: number;
  };
  pricing: {
    final_price: string;
  };
  validity: {
    start_date: string;
    start_time: string;
    end_date: string;
  };
  service: Service;
  subscription: Subscription;
  sessions: Session[];
  created_at: string;
}

interface UserData {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  photo: string;
  wallet: string;
  requests: Request[];
}

const ClientProfilePage: React.FC = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchUserProfile(clientId);
    }
  }, [clientId]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await http.get(`${DASHBOARD_API_BASE_URL}/users/${userId}`);

      if (response.data && response.data.data) {
        setUserData(response.data.data);
      } else {
        setError('لم يتم العثور على بيانات العميلة');
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError('حدث خطأ في تحميل بيانات العميلة');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (sessionId: number) => {
    setIsConfirming(true);
    try {
      // TODO: Implement API call to confirm attendance
      // await http.post(`${DASHBOARD_API_BASE_URL}/sessions/${sessionId}/confirm`);

      // For now, just simulate
      setTimeout(() => {
        setIsConfirming(false);
        // Refresh data after confirmation
        if (clientId) {
          fetchUserProfile(clientId);
        }
      }, 1000);
    } catch (err) {
      console.error('Error confirming attendance:', err);
      setIsConfirming(false);
    }
  };

  const getServiceName = (service: Service | null | undefined, lang: string = 'ar'): string => {
    if (!service || !service.translations) return 'خدمة';
    const translation = service.translations.find(t => t.language === lang);
    return translation?.name || 'خدمة';
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Extract HH:mm from HH:mm:ss
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-app-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 font-bold mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-app-gold text-white px-6 py-3 rounded-full font-bold hover:scale-95 transition-transform"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg text-gray-400 font-bold">
        لم يتم العثور على بيانات العميلة
      </div>
    );
  }

  // Find the next scheduled session
  const upcomingSession = userData.requests
    ?.flatMap(req => req.sessions || [])
    .find(session => session.status === 'scheduled' && session.schedule.session_date);

  const upcomingRequest = upcomingSession
    ? userData.requests.find(req => req.sessions?.some(s => s.id === upcomingSession.id))
    : null;

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
        <div className="w-20 h-20 bg-app-bg rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
          {userData.photo && !userData.photo.includes('unknown.svg') ? (
            <img src={userData.photo} alt={userData.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-app-gold text-2xl font-bold">{userData.name.charAt(0)}</span>
          )}
        </div>
        <h2 className="text-xl font-bold text-app-text mb-1">{userData.name}</h2>
        <p className="text-sm text-gray-400 font-mono mb-2" dir="ltr">{userData.phone}</p>

        {userData.wallet && parseFloat(userData.wallet) > 0 && (
          <div className="inline-block bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold mb-4">
            المحفظة: {parseFloat(userData.wallet).toFixed(3)} د.ك
          </div>
        )}

        <div className="flex justify-center gap-3">
          <a href={`tel:${userData.phone}`} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
            <Phone size={18} />
          </a>
          <a href={`https://wa.me/${userData.phone}`} className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
            <MessageSquare size={18} />
          </a>
        </div>
      </div>

      {/* Quick Action: Confirm Attendance */}
      {upcomingSession && upcomingRequest && (
        <div className="mx-6 mb-8">
          <div className="bg-[#483383] text-white p-6 rounded-[24px] shadow-xl shadow-[#483383]/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/60 text-xs font-bold mb-1">الموعد القادم</p>
                  <h3 className="text-lg font-bold">{getServiceName(upcomingRequest.service)}</h3>
                  <p className="text-white/80 text-xs mt-1">
                    الجلسة {upcomingSession.session_number} من {upcomingRequest.sessions_info.session_count}
                  </p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-md text-center">
                  <div className="text-xs opacity-80">{formatDate(upcomingSession.schedule.session_date!)}</div>
                  <div className="font-mono font-bold">{formatTime(upcomingSession.schedule.start_time!)}</div>
                </div>
              </div>

              <button
                onClick={() => handleConfirmAttendance(upcomingSession.id)}
                disabled={isConfirming}
                className="w-full bg-white text-[#483383] py-3 rounded-xl font-bold text-sm hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التأكيد...</span>
                  </>
                ) : (
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
        {/* Active Subscriptions/Requests */}
        <div className="bg-white p-5 rounded-[24px] border border-gray-100">
          <h3 className="font-bold text-app-text mb-4 flex items-center gap-2">
            <Ticket size={18} className="text-app-gold" />
            الاشتراكات النشطة
          </h3>
          {userData.requests && userData.requests.length > 0 ? (
            <div className="space-y-3">
              {userData.requests.map(request => (
                <div key={request.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-app-text">{getServiceName(request.service)}</p>
                      <p className="text-xs text-gray-400 mt-1">رقم الطلب: {request.request_number}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${request.status === 'completed' ? 'bg-green-50 text-green-600' :
                      request.status === 'active' ? 'bg-blue-50 text-blue-600' :
                        request.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                          'bg-gray-100 text-gray-400'
                      }`}>
                      {request.status === 'completed' ? 'مكتمل' :
                        request.status === 'active' ? 'نشط' :
                          request.status === 'pending' ? 'قيد الانتظار' : request.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">التقدم</span>
                      <span className="font-bold text-app-text">
                        {request.sessions_info.completed_sessions} / {request.sessions_info.session_count} جلسة
                      </span>
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-app-gold transition-all"
                        style={{ width: `${request.sessions_info.progress}%` }}
                      />
                    </div>
                  </div>

                  {request.validity.start_date && (
                    <div className="mt-3 text-xs text-gray-500">
                      <span>صالح من {formatDate(request.validity.start_date)}</span>
                      {request.validity.end_date && <span> حتى {formatDate(request.validity.end_date)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">لا توجد اشتراكات نشطة</p>
          )}
        </div>

        {/* Sessions History */}
        <div className="bg-white p-5 rounded-[24px] border border-gray-100">
          <h3 className="font-bold text-app-text mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-app-gold" />
            الجلسات
          </h3>
          <div className="space-y-4">
            {userData.requests?.flatMap(req =>
              req.sessions?.map(session => ({
                ...session,
                serviceName: getServiceName(req.service),
                requestNumber: req.request_number
              })) || []
            )
              .filter(session => session.schedule.session_date) // Only show scheduled sessions
              .sort((a, b) => {
                // Sort by date desc
                const dateA = a.schedule.session_date || '';
                const dateB = b.schedule.session_date || '';
                return dateB.localeCompare(dateA);
              })
              .slice(0, 10) // Show last 10 sessions
              .map(session => (
                <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-app-text">{session.serviceName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>الجلسة {session.session_number}</span>
                      <span>•</span>
                      <span dir="ltr">{formatDate(session.schedule.session_date!)}</span>
                      {session.schedule.start_time && (
                        <>
                          <span>•</span>
                          <span dir="ltr">{formatTime(session.schedule.start_time)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${session.status === 'completed' ? 'bg-green-50 text-green-600' :
                    session.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                      session.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                        session.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {session.status === 'completed' ? 'مكتملة' :
                      session.status === 'scheduled' ? 'مجدولة' :
                        session.status === 'pending' ? 'قيد الانتظار' :
                          session.status === 'cancelled' ? 'ملغية' : session.status}
                  </span>
                </div>
              ))}

            {(!userData.requests || userData.requests.flatMap(r => r.sessions || []).filter(s => s.schedule.session_date).length === 0) && (
              <p className="text-xs text-gray-400 text-center py-4">لا توجد جلسات مجدولة</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
