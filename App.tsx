
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import TabBar from './components/TabBar';
import NotificationsTab from './components/NotificationsTab';
import AccountTab from './components/account/AccountTab';
import AppointmentsTab from './components/AppointmentsTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import HomeTab from './components/home/HomeTab';
import AllProductsPage from './components/AllProductsPage';
import BrandPage from './components/BrandPage';
import BookingPage from './components/CartFlow';
import SubscriptionDetailsPage from './components/SubscriptionDetailsPage';
import EditAppointmentPage from './components/EditAppointmentPage';
import BookNextSessionPage from './components/BookNextSessionPage';
import SignUpPage from './components/auth/SignUpPage';
import LoginPage from './components/auth/LoginPage';
import OTPPage from './components/auth/OTPPage';
import Cookies from "js-cookie";
import HairProfilePage from './components/HairProfilePage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import PlaceholderTab from './components/PlaceholderTab';
import { TabId, Product, ServiceAddon, ServicePackageOption, BookingItem } from './types';
import { cacheService } from './services/cacheService';

export interface Order {
  id: string;
  date: string;
  time?: string;
  status: string;
  total: string;
  items: BookingItem[];
  isPackage?: boolean;
  packageName?: string;
  walletPaid?: number;
  onlinePaid?: number;
  paymentMethodType?: string;
}

const STORAGE_KEY_BOOKINGS = 'mezo_bookings_v1';
const STORAGE_KEY_FAVOURITES = 'mezo_favourites_v1';
const STORAGE_KEY_IS_LOGGED_IN = 'mezo_auth_is_logged_in';
const STORAGE_KEY_AUTH_MODE = 'mezo_auth_mode';

type AuthStatus = 'anonymous' | 'guest' | 'authenticated';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [favourites, setFavourites] = useState<number[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('anonymous');

  // Load initial data
  useEffect(() => {
    cacheService.warmup();

    // Load bookings
    const savedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (savedBookings) {
      setOrders(JSON.parse(savedBookings));
    }

    // Load favourites
    const savedFavs = localStorage.getItem(STORAGE_KEY_FAVOURITES);
    if (savedFavs) {
      setFavourites(JSON.parse(savedFavs));
    }

    // Check auth
    const isLoggedIn = localStorage.getItem(STORAGE_KEY_IS_LOGGED_IN);
    const authMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE);

    if (isLoggedIn === 'true') {
      setAuthStatus('authenticated');
    } else if (authMode === 'guest') {
      setAuthStatus('guest');
    }
  }, []);

  // Update Active Tab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/product/') || path.startsWith('/category/') || path.startsWith('/brand/')) setActiveTab('home');
    else if (path.startsWith('/subscriptions')) setActiveTab('subscriptions');
    else if (path.startsWith('/notifications')) setActiveTab('notifications');
    else if (path.startsWith('/appointments')) setActiveTab('appointments');
    else if (path.startsWith('/account')) setActiveTab('account');
  }, [location.pathname]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home': navigate('/'); break;
      case 'subscriptions': navigate('/subscriptions'); break;
      case 'notifications': navigate('/notifications'); break;
      case 'appointments': navigate('/appointments'); break;
      case 'account': navigate('/account'); break;
    }
  };

  const handleBook = (
    product: Product,
    quantity: number,
    selectedAddons?: ServiceAddon[],
    packageOption?: ServicePackageOption,
    customFinalPrice?: number
  ) => {
    if (authStatus === 'anonymous') {
      navigate('/login');
      return;
    }

    const bookingItem: BookingItem = {
      product,
      quantity,
      selectedAddons,
      packageOption,
      customFinalPrice
    };

    navigate('/booking', { state: bookingItem });
  };

  const handleAddOrder = (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedOrders));
  };

  const toggleFavourite = (productId: number) => {
    let newFavs;
    if (favourites.includes(productId)) {
      newFavs = favourites.filter(id => id !== productId);
    } else {
      newFavs = [...favourites, productId];
    }
    setFavourites(newFavs);
    localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(newFavs));
  };

  const handleLoginSuccess = () => {
    const mode = localStorage.getItem(STORAGE_KEY_AUTH_MODE);
    if (mode === 'guest') {
      setAuthStatus('guest');
    } else {
      setAuthStatus('authenticated');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
    localStorage.removeItem("mezo_auth_user_name");
    localStorage.removeItem("mezo_auth_user_phone");
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    setAuthStatus("anonymous");
    navigate("/login");
  };

  const showTabBar = !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/booking') &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/signup') &&
    !location.pathname.startsWith('/verify') &&
    !location.pathname.startsWith('/technician/online');

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={isAdminRoute ? "w-full min-h-screen" : "h-[100vh] flex flex-col bg-app-bg w-full max-w-[430px] mx-auto relative shadow-2xl overflow-hidden"}>
      <div className={isAdminRoute ? "w-full h-full" : "flex-1 overflow-hidden relative"}>
        <Routes>
          {/* <Route path="/" element={
            <HomeTab
              onBook={handleBook}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          } />

          <Route path="/product/:productId" element={
            <HomeTab
              onBook={handleBook}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          } />

          <Route path="/category/:categoryName" element={
            <HomeTab
              onBook={handleBook}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          } />

          <Route path="/brand/:brandId" element={
            <BrandPage
              onBook={handleBook}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          } />

          <Route path="/all-products" element={
            <AllProductsPage
              onBook={handleBook}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          } />

          <Route path="/subscriptions" element={<SubscriptionsTab />} />
          <Route path="/notifications" element={<NotificationsTab />} />
          <Route path="/appointments" element={<AppointmentsTab orders={orders} />} />

          <Route path="/account/*" element={
            <AccountTab
              orders={orders}
              onNavigateToHome={() => handleTabChange('home')}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
              onBook={handleBook}
              onLogout={handleLogout}
              isGuest={authStatus === 'guest'}
            />
          } />

          <Route path="/booking" element={<BookingPage onAddOrder={handleAddOrder} />} />

          <Route path="/subscription-details/:subscriptionId" element={<SubscriptionDetailsPage />} />
          <Route path="/edit-appointment/:subscriptionId" element={<EditAppointmentPage />} />
          <Route path="/book-next-session/:subscriptionId" element={<BookNextSessionPage />} />

          <Route path="/hair-profile" element={<HairProfilePage />} />

        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<SignUpPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/verify" element={<OTPPage onLoginSuccess={handleLoginSuccess} />} />
*/}
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Placeholder for technician online */}
          <Route path="/technician/online" element={<PlaceholderTab title="Technician Online" />} />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>

      {showTabBar && (
        <TabBar currentTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
