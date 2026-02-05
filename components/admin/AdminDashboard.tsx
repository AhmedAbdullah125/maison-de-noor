
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Tags, Scissors, Users, CalendarClock, CalendarCheck, Ticket, ShieldCheck, UserRound, Wallet, BarChart3, Bell, History, LogOut, Menu, X, Languages, Clock, LayoutGrid } from 'lucide-react';
import { translations, getLang, setLang, Locale } from '../../services/i18n';
import { Manager, ManagerPermissions } from '../../types';
// Module Components
import DashboardHome from './DashboardHome';
import CategoriesModule from './CategoriesModule';
import ServicesModule from './ServicesModule';
import ServiceFormPage from './ServiceFormPage';
import ServiceAddonsModule from './ServiceAddonsModule'; // Added
import UsersModule from './UsersModule';
import BookingsModule from './BookingsModule';
import StaffModule from './StaffModule';
import AccountingModule from './AccountingModule';
import ActivityLogModule from './ActivityLogModule';
import NotificationsModule from './NotificationsModule';
import ManagersModule from './ManagersModule';
import ReportsModule from './ReportsModule';
import ActiveSubscriptionsModule from './ActiveSubscriptionsModule';
import ExpiredSubscriptionsModule from './ExpiredSubscriptionsModule';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [lang, setLangState] = useState<Locale>(getLang());
  const t = translations[lang];

  const currentManager = useMemo((): Manager | null => {
    const session = localStorage.getItem('salon_admin_session');
    return session ? JSON.parse(session) : null;
  }, []);

  useEffect(() => {
    if (!currentManager) {
      navigate('/admin/login');
    }
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [navigate, lang, currentManager]);

  const handleLogout = async () => {
    const { adminLogout } = await import('./auth/logout.api');
    await adminLogout();
    navigate('/admin/login');
  };

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    setLangState(newLang);
  };

  const navItems = useMemo(() => {
    if (!currentManager) return [];

    const items = [
      { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={20} />, path: '/admin' },
      { id: 'categories', label: t.categories, icon: <Tags size={20} />, path: '/admin/categories' },
      { id: 'services', label: t.services, icon: <Scissors size={20} />, path: '/admin/services' },
      { id: 'serviceAddons', label: t.serviceAddons, icon: <LayoutGrid size={20} />, path: '/admin/service-addons' }, // Added
      { id: 'users', label: t.users, icon: <Users size={20} />, path: '/admin/users' },
      { id: 'upcomingBookings', label: t.upcomingBookings, icon: <CalendarClock size={20} />, path: '/admin/bookings/upcoming' },
      { id: 'completedBookings', label: t.completedBookings, icon: <CalendarCheck size={20} />, path: '/admin/bookings/completed' },
      { id: 'activeSubscriptions', label: t.activeSubscriptions, icon: <Ticket size={20} />, path: '/admin/subscriptions/active', permissionKey: 'subscriptions' },
      { id: 'expiredSubscriptions', label: t.expiredSubscriptions, icon: <Clock size={20} />, path: '/admin/subscriptions/expired', permissionKey: 'subscriptions' },
      { id: 'staffHR', label: t.staffHR, icon: <UserRound size={20} />, path: '/admin/staff' },
      { id: 'accounting', label: t.accounting, icon: <Wallet size={20} />, path: '/admin/accounting' },
      { id: 'reports', label: t.reports, icon: <BarChart3 size={20} />, path: '/admin/reports' },
      { id: 'managers', label: t.managers, icon: <ShieldCheck size={20} />, path: '/admin/managers' },
      { id: 'notifications', label: t.notifications, icon: <Bell size={20} />, path: '/admin/notifications' },
      { id: 'activityLog', label: t.activityLog, icon: <History size={20} />, path: '/admin/activity' },
    ];

    // Filter by permissions
    return items.filter(item => {
      if (true) return true;
      const key = (item.permissionKey || item.id) as keyof ManagerPermissions;
      return currentManager.permissions[key] === true;
    });
  }, [currentManager, t]);

  const hasPermission = (id: keyof ManagerPermissions) => {
    if (!currentManager) return false;
    if (true) return true;
    return currentManager.permissions[id] === true;
  };

  if (!currentManager) return null;

  return (
    <div className={`min-h-screen bg-gray-50 flex overflow-hidden font-amiri`}>
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#100F19] text-white transition-all duration-300 flex flex-col fixed h-full z-50 ${lang === 'ar' ? 'right-0' : 'left-0'}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} font-semibold text-base flex items-center gap-2`}>
            <div className="w-8 h-8 bg-[#483383] rounded-lg flex items-center justify-center text-white">M</div>
            <span>Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-white/10 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.id === 'services' && (location.pathname.includes('/admin/services/new') || location.pathname.includes('/edit')));
            return (
              <Link
                key={item.id}
                to={item.path!}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-[#483383] text-white shadow-lg shadow-[#483383]/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="font-normal text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-normal text-sm">{t.logout}</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? (lang === 'ar' ? 'mr-64' : 'ml-64') : (lang === 'ar' ? 'mr-20' : 'ml-20')} flex flex-col min-h-screen h-screen overflow-hidden`}>
        <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find(i => i.path === location.pathname)?.label || t.dashboard}
          </h2>
          <div className="flex items-center gap-6">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 text-sm font-semibold text-[#483383] hover:bg-gray-50 px-3 py-2 rounded-xl transition-all"
            >
              <Languages size={18} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <div className="flex items-center gap-4">
              <div className={`flex flex-col ${lang === 'ar' ? 'items-start' : 'items-end'}`}>
                <span className="text-sm font-semibold text-gray-900">{currentManager.fullName}</span>
                <span className="text-[10px] font-normal text-gray-400">{currentManager.email}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-gray-50/50">
          <Routes>
            <Route index element={hasPermission('dashboard') ? <DashboardHome lang={lang} /> : <Navigate to="/admin/activity" />} />
            <Route path="categories" element={hasPermission('categories') ? <CategoriesModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="services" element={hasPermission('services') ? <ServicesModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="services/new" element={hasPermission('services') ? <ServiceFormPage lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="services/:id/edit" element={hasPermission('services') ? <ServiceFormPage lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="service-addons" element={hasPermission('serviceAddons') ? <ServiceAddonsModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="users" element={hasPermission('users') ? <UsersModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="bookings/upcoming" element={hasPermission('upcomingBookings') ? <BookingsModule type="upcoming" lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="bookings/completed" element={hasPermission('completedBookings') ? <BookingsModule type="completed" lang={lang} /> : <Navigate to="/admin" />} />

            <Route path="subscriptions" element={<Navigate to="/admin/subscriptions/active" replace />} />
            <Route path="subscriptions/active" element={hasPermission('subscriptions') ? <ActiveSubscriptionsModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="subscriptions/expired" element={hasPermission('subscriptions') ? <ExpiredSubscriptionsModule lang={lang} /> : <Navigate to="/admin" />} />

            <Route path="staff" element={hasPermission('staffHR') ? <StaffModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="accounting" element={hasPermission('accounting') ? <AccountingModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="activity" element={hasPermission('activityLog') ? <ActivityLogModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="notifications" element={hasPermission('notifications') ? <NotificationsModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="managers" element={hasPermission('managers') ? <ManagersModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="reports" element={hasPermission('reports') ? <ReportsModule lang={lang} /> : <Navigate to="/admin" />} />
            <Route path="*" element={<div className="p-20 text-center text-gray-400">Feature under development</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
