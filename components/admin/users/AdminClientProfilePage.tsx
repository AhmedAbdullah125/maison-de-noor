
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, MessageSquare, Calendar, Ticket, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { DASHBOARD_API_BASE_URL } from '@/lib/apiConfig';
import { changeBookingStatus } from '../bookings/bookings.api';
import { translations, Locale } from '@/services/i18n';
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

interface AdminClientProfilePageProps {
    lang: Locale;
}

const AdminClientProfilePage: React.FC<AdminClientProfilePageProps> = ({ lang }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const t = translations[lang];

    useEffect(() => {
        if (userId) {
            fetchUserProfile(userId);
        }
    }, [userId]);

    const fetchUserProfile = async (id: string) => {
        try {
            setLoading(true);
            setError('');

            const response = await http.get(`${DASHBOARD_API_BASE_URL}/users/${id}`);

            if (response.data && response.data.data) {
                setUserData(response.data.data);
            } else {
                setError(lang === 'ar' ? 'لم يتم العثور على بيانات العميلة' : 'Client data not found');
            }
        } catch (err: any) {
            console.error('Error fetching user profile:', err);
            setError(lang === 'ar' ? 'حدث خطأ في تحميل بيانات العميلة' : 'Error fetching client data');
        } finally {
            setLoading(false);
        }
    };


    const handleConfirmAttendance = async (sessionId: number) => {
        setIsConfirming(true);
        try {
            // Call API to confirm attendance (change status to completed)
            const res = await changeBookingStatus(sessionId, 'completed', lang as Locale);

            if (res.ok) {
                // Refresh data after confirmation
                if (userId) {
                    await fetchUserProfile(userId);
                }
            }
        } catch (err) {
            console.error('Error confirming attendance:', err);
        } finally {
            setIsConfirming(false);
        }
    };

    const getServiceName = (service: Service | null | undefined, lang: string): string => {
        if (!service || !service.translations) return t.service;
        const translation = service.translations.find(tr => tr.language === lang);
        return translation?.name || service.translations.find(tr => tr.language === 'en')?.name || service.translations[0]?.name || t.service;
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const formatTime = (timeStr: string): string => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5); // Extract HH:mm from HH:mm:ss
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#483383] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-semibold">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-400 font-semibold mb-4">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-[#483383] text-white px-6 py-3 rounded-xl font-semibold hover:scale-95 transition-transform"
                    >
                        {t.back}
                    </button>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex h-full items-center justify-center text-gray-400 font-semibold">
                {lang === 'ar' ? 'لم يتم العثور على بيانات العميلة' : 'Client data not found'}
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
        <div className="max-w-4xl mx-auto pb-12">
            {/* Navbar */}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <ArrowRight size={20} className={lang === 'ar' ? '' : 'rotate-180'} />
                </button>
                <span className="font-bold text-xl text-gray-900">{t.clientProfile}</span>
            </div>

            {/* Profile Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {userData.photo && !userData.photo.includes('unknown.svg') ? (
                        <img src={userData.photo} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[#483383] text-3xl font-semibold">{userData.name.charAt(0)}</span>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{userData.name}</h2>
                <p className="text-sm text-gray-400 font-mono mb-4" dir="ltr">{userData.phone}</p>

                {userData.wallet && parseFloat(userData.wallet) > 0 && (
                    <div className="inline-block bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                        {t.wallet}: {parseFloat(userData.wallet).toFixed(3)} {t.currency}
                    </div>
                )}

                <div className="flex justify-center gap-3">
                    <a
                        href={`tel:${userData.phone}`}
                        className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 hover:scale-105 transition-all"
                    >
                        <Phone size={20} />
                    </a>
                    <a
                        href={`https://wa.me/${userData.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 hover:scale-105 transition-all"
                    >
                        <MessageSquare size={20} />
                    </a>
                </div>
            </div>

            {/* Quick Action: Confirm Attendance */}
            {upcomingSession && upcomingRequest && (
                <div className="mb-8">
                    <div className="bg-[#483383] text-white p-6 rounded-[24px] shadow-xl shadow-[#483383]/20 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center md:text-start">
                                <p className="text-white/60 text-xs font-semibold mb-1 uppercase tracking-wider">{t.upcomingAppointment}</p>
                                <h3 className="text-xl font-bold mb-1">{getServiceName(upcomingRequest.service, lang)}</h3>
                                <p className="text-white/80 text-sm">
                                    {t.sessionNumberOf.replace('{current}', upcomingSession.session_number.toString()).replace('{total}', upcomingRequest.sessions_info.session_count.toString())}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md text-center border border-white/10">
                                    <div className="text-xs opacity-80 mb-0.5">{formatDate(upcomingSession.schedule.session_date!)}</div>
                                    <div className="font-mono font-bold text-lg">{formatTime(upcomingSession.schedule.start_time!)}</div>
                                </div>

                                <button
                                    onClick={() => handleConfirmAttendance(upcomingSession.id)}
                                    disabled={isConfirming}
                                    className="bg-white text-[#483383] py-3 px-6 rounded-xl font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
                                >
                                    {isConfirming ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t.confirmAttendanceMessage}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            <span>{t.confirmAttendanceAction}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {/* Decor */}
                        <div className={`absolute top-0 ${lang === 'ar' ? 'right-0 -mr-10' : 'left-0 -ml-10'} w-40 h-40 bg-white/5 rounded-full -mt-10 blur-2xl`} />
                        <div className={`absolute bottom-0 ${lang === 'ar' ? 'left-0 -ml-10' : 'right-0 -mr-10'} w-32 h-32 bg-white/5 rounded-full -mb-10 blur-2xl`} />
                    </div>
                </div>
            )}

            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Subscriptions/Requests */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Ticket size={20} />
                        </div>
                        {t.activeSubscriptions}
                    </h3>
                    {userData.requests && userData.requests.length > 0 ? (
                        <div className="space-y-4">
                            {userData.requests.map(request => (
                                <div key={request.id} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 mb-1">{getServiceName(request.service, lang)}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">{request.request_number}</p>
                                        </div>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${request.status === 'completed' ? 'bg-green-50 text-green-700' :
                                            request.status === 'active' ? 'bg-blue-50 text-blue-700' :
                                                request.status === 'pending' ? 'bg-orange-50 text-orange-700' :
                                                    'bg-gray-100 text-gray-500'
                                            }`}>
                                            {request.status === 'completed' ? t.completed :
                                                request.status === 'active' ? t.active :
                                                    request.status === 'pending' ? t.pending : request.status}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="text-gray-500 font-medium">{t.progress}</span>
                                            <span className="font-bold text-gray-900">
                                                {request.sessions_info.completed_sessions} / {request.sessions_info.session_count} {t.sessions}
                                            </span>
                                        </div>
                                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#483383] transition-all"
                                                style={{ width: `${request.sessions_info.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {request.validity.start_date && (
                                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex flex-wrap gap-2">
                                            <span className="bg-white px-2 py-1 rounded border border-gray-100">{t.validFrom.replace('{date}', formatDate(request.validity.start_date))}</span>
                                            {request.validity.end_date && <span className="bg-white px-2 py-1 rounded border border-gray-100"> {t.validUntil.replace('{date}', formatDate(request.validity.end_date))}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 font-medium">{t.noActiveSubscriptions}</p>
                        </div>
                    )}
                </div>

                {/* Sessions History */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        {t.sessions}
                    </h3>
                    <div className="space-y-0 divide-y divide-gray-50">
                        {userData.requests?.flatMap(req =>
                            req.sessions?.map(session => ({
                                ...session,
                                serviceName: getServiceName(req.service, lang),
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
                                <div key={session.id} className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 rounded-xl transition-colors -mx-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">{session.serviceName}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{t.sessions} {session.session_number}</span>
                                            <span className="text-gray-300">•</span>
                                            <span dir="ltr" className="font-mono">{formatDate(session.schedule.session_date!)}</span>
                                            {session.schedule.start_time && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span dir="ltr" className="font-mono">{formatTime(session.schedule.start_time)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${session.status === 'completed' ? 'bg-green-50 text-green-700' :
                                        session.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                                            session.status === 'pending' ? 'bg-orange-50 text-orange-700' :
                                                session.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {session.status === 'completed' ? t.completed :
                                            session.status === 'scheduled' ? t.upcomingStatus :
                                                session.status === 'pending' ? t.pending :
                                                    session.status === 'cancelled' ? t.canceledStatus : session.status}
                                    </span>
                                </div>
                            ))}

                        {(!userData.requests || userData.requests.flatMap(r => r.sessions || []).filter(s => s.schedule.session_date).length === 0) && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-4">
                                <p className="text-sm text-gray-400 font-medium">{t.noScheduledSessions}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminClientProfilePage;
