import React, { useMemo } from 'react';
import {
  Users,
  Scissors,
  Tags,
  CalendarClock,
  Ticket,
  TrendingUp,
  Activity,
  UserCheck
} from 'lucide-react';
import { db } from '../../services/db';
import { translations, Locale } from '../../services/i18n';

interface DashboardHomeProps {
  lang: Locale;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ lang }) => {
  const data = db.getData();
  const t = translations[lang];

  const stats = useMemo(() => {
    const totalRevenue = data.accounting
      .filter(a => a.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const upcomingCount = data.appointments.filter(a => a.status === 'upcoming').length;
    const completedCount = data.appointments.filter(a => a.status === 'completed').length;

    return [
      { label: t.totalUsers, value: data.users.length, icon: <Users size={24} /> },
      { label: t.totalServices, value: data.services.length, icon: <Scissors size={24} /> },
      { label: t.totalCategories, value: data.categories.length, icon: <Tags size={24} /> },
      { label: t.upcomingBookings, value: upcomingCount, icon: <CalendarClock size={24} /> },
      { label: t.activeSubscriptions, value: data.subscriptions.filter(s => s.status === 'active').length, icon: <Ticket size={24} /> },
      { label: t.totalRevenue, value: `${totalRevenue.toFixed(3)} ${t.currency}`, icon: <TrendingUp size={24} /> },
      { label: t.completedBookings, value: completedCount, icon: <Activity size={24} /> },
      { label: t.totalStaff, value: data.staff.length, icon: <UserCheck size={24} /> },
    ];
  }, [data, t]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-all">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-600`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-lg font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center justify-between">
            {t.recentAppointments}
            <button className="text-sm text-[#483383] font-semibold">{t.viewAll}</button>
          </h3>
          <div className="space-y-4">
            {data.appointments.slice(0, 5).map((appt) => (
              <div key={appt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#483383]">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{appt.serviceName}</p>
                    <p className="text-[10px] text-gray-500">{appt.dateISO} @ {appt.time24}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-3 py-1 rounded-lg ${appt.status === 'upcoming' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {appt.status === 'upcoming' ? t.upcoming : t.completed}
                </span>
              </div>
            ))}
            {data.appointments.length === 0 && (
              <p className="text-center text-gray-400 py-10">{t.noRecentAppointments}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-base font-semibold text-gray-900 mb-6">{t.activityLog}</h3>
          <div className="space-y-6">
            {data.logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-[#483383] mt-1.5 shrink-0" />
                <div>
                  {/* Fix: Access actionType instead of non-existent action property */}
                  <p className="text-sm font-semibold text-gray-900">{log.actionType} {log.entityType}</p>
                  <p className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.details}</p>
                </div>
              </div>
            ))}
            {data.logs.length === 0 && (
              <p className="text-center text-gray-400 py-10">{t.noRecentLogs}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;