import React, { useState, useMemo, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import TabBar from "./components/TabBar";
import NotificationsTab from "./components/NotificationsTab";
import AccountTab from "./components/AccountTab";
import AppointmentsTab from "./components/AppointmentsTab";
import SubscriptionsTab from "./components/SubscriptionsTab";
// import HomeTab from "./components/HomeTab";
import AllProductsPage from "./components/AllProductsPage";
import BrandPage from "./components/BrandPage";
import BookingPage from "./components/CartFlow";
import SubscriptionDetailsPage from "./components/SubscriptionDetailsPage";
import EditAppointmentPage from "./components/EditAppointmentPage";
import BookNextSessionPage from "./components/BookNextSessionPage";

import SignUpPage from "./components/auth/SignUpPage";
import LoginPage from "./components/auth/LoginPage";
import OTPPage from "./components/auth/OTPPage";

import HairProfilePage from "./components/HairProfilePage";
import { TabId, Product, ServiceAddon, ServicePackageOption, BookingItem } from "./types";
import { Check } from "lucide-react";
import { cacheService } from "./services/cacheService";

// ✅ import clearAuth to remove token/refresh/user cookie
import { clearAuth } from "./components/auth/authStorage";
import HomeTab from "./components/home/HomeTab";

export interface Order {
  id: string;
  date: string;
  time?: string;
  status: string;
  total: string;
  items: BookingItem[];
  isPackage?: boolean;
  packageName?: string;
}

// Storage Keys
const STORAGE_KEY_BOOKINGS = "mezo_bookings_v1";
const STORAGE_KEY_FAVOURITES = "mezo_favourites_v1";
const STORAGE_KEY_IS_LOGGED_IN = "mezo_auth_is_logged_in"; // legacy
const STORAGE_KEY_AUTH_MODE = "mezo_auth_mode"; // 'guest' | 'authenticated'

type AuthStatus = "anonymous" | "guest" | "authenticated";

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [favourites, setFavourites] = useState<number[]>([]);
  const [pendingOrderDetailsId, setPendingOrderDetailsId] = useState<string | null>(null);

  // Auth State
  const [authStatus, setAuthStatus] = useState<AuthStatus>("anonymous");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("تمت العملية بنجاح");

  // --- Cache Warmup & Initial Data ---
  useEffect(() => {
    cacheService.warmup();

    // ✅ New Auth Check (token-first) + keep legacy support
    const mode = localStorage.getItem(STORAGE_KEY_AUTH_MODE);
    const legacyLoggedIn = localStorage.getItem(STORAGE_KEY_IS_LOGGED_IN) === "true";
    const hasToken = Boolean(localStorage.getItem("token"));

    if (mode === "guest") {
      setAuthStatus("guest");
    } else if (hasToken || mode === "authenticated" || legacyLoggedIn) {
      setAuthStatus("authenticated");
    } else {
      setAuthStatus("anonymous");
    }

    setIsAuthChecking(false);

    // Load Data
    const savedOrders = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const savedFavs = localStorage.getItem(STORAGE_KEY_FAVOURITES);
    if (savedFavs) setFavourites(JSON.parse(savedFavs));
  }, []);
  // -----------------------------------

  // Listen for navigation state from HairProfile
  useEffect(() => {
    if ((location.state as any)?.profileSaved) {
      setToastText("تم حفظ ملف العناية بنجاح");
      setShowToast(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auth Guard Logic
  useEffect(() => {
    if (isAuthChecking) return;

    const publicPaths = ["/signup", "/login", "/verify"];
    const isPublicPath = publicPaths.includes(location.pathname);
    const isAnonymous = authStatus === "anonymous";

    // anonymous trying to access private route -> go signup
    if (isAnonymous && !isPublicPath) {
      navigate("/signup", { replace: true });
    }
    // logged in (guest/auth) trying to access public route -> go home
    else if (!isAnonymous && isPublicPath) {
      navigate("/", { replace: true });
    }
  }, [authStatus, isAuthChecking, location.pathname, navigate]);

  // Derive current tab
  const currentTab = useMemo((): TabId => {
    const path = location.pathname;
    if (path.startsWith("/subscriptions")) return "subscriptions";
    if (path.startsWith("/notifications")) return "notifications";
    if (path.startsWith("/appointments")) return "appointments";
    if (path.startsWith("/account")) return "account";
    return "home";
  }, [location.pathname]);

  // Handle toast
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleBook = (
    product: Product,
    quantity: number,
    selectedAddons: ServiceAddon[] = [],
    packageOption?: ServicePackageOption,
    customFinalPrice?: number
  ) => {
    const bookingItem: BookingItem = {
      product,
      quantity,
      selectedAddons,
      packageOption,
      customFinalPrice,
    };
    const returnPath = location.pathname + location.search;
    navigate("/booking", { state: { ...bookingItem, returnPath } });
  };

  const handleAddOrder = (order: Order) => {
    const updatedOrders = [order, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedOrders));
  };

  const handleToggleFavourite = (productId: number) => {
    setFavourites((prev) => {
      const isFav = prev.includes(productId);
      const updated = isFav ? prev.filter((id) => id !== productId) : [...prev, productId];
      localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(updated));
      return updated;
    });
  };

  // keep your mode flag (guest/auth)
  const handleLoginSuccess = (mode: "authenticated" | "guest" = "authenticated") => {
    localStorage.setItem(STORAGE_KEY_AUTH_MODE, mode);

    // legacy flag for older logic (safe to keep)
    if (mode === "authenticated") {
      localStorage.setItem(STORAGE_KEY_IS_LOGGED_IN, "true");
    } else {
      localStorage.removeItem(STORAGE_KEY_IS_LOGGED_IN);
    }

    setAuthStatus(mode);
  };

  const handleLogout = () => {
    // ✅ clear tokens/user/cookie
    clearAuth();

    // app flags
    localStorage.removeItem(STORAGE_KEY_IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEY_AUTH_MODE);

    // legacy demo keys (if any)
    localStorage.removeItem("mezo_auth_user_name");
    localStorage.removeItem("mezo_auth_user_phone");

    setAuthStatus("anonymous");
    navigate("/signup", { replace: true });
  };

  if (isAuthChecking) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-[430px] bg-app-bg min-h-screen relative shadow-2xl flex flex-col overflow-hidden">
        <main className="flex-1 w-full relative">
          <Routes>
            {/* Auth Routes */}
            <Route
              path="/signup"
              element={<SignUpPage onLoginSuccess={() => handleLoginSuccess("guest")} />}
            />
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={() => handleLoginSuccess("authenticated")} />}
            />
            <Route
              path="/verify"
              element={<OTPPage onLoginSuccess={() => handleLoginSuccess("authenticated")} />}
            />

            {/* Protected Routes (Accessible by Guest & Auth) */}
            {authStatus !== "anonymous" && (
              <>
                <Route
                  path="/"
                  element={
                    <HomeTab
                      onBook={handleBook}
                      favourites={favourites}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  }
                />
                <Route
                  path="/category/:categoryName"
                  element={
                    <HomeTab
                      onBook={handleBook}
                      favourites={favourites}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  }
                />
                <Route
                  path="/product/:productId"
                  element={
                    <HomeTab
                      onBook={handleBook}
                      favourites={favourites}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  }
                />
                <Route
                  path="/products"
                  element={
                    <AllProductsPage
                      onBook={handleBook}
                      favourites={favourites}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  }
                />
                <Route
                  path="/brand/:brandId"
                  element={
                    <BrandPage
                      onBook={handleBook}
                      favourites={favourites}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  }
                />
                <Route path="/booking" element={<BookingPage onAddOrder={handleAddOrder} />} />
                <Route path="/subscriptions" element={<SubscriptionsTab />} />
                <Route path="/subscription-details/:subscriptionId" element={<SubscriptionDetailsPage />} />
                <Route path="/edit-appointment/:subscriptionId" element={<EditAppointmentPage />} />
                <Route path="/book-next-session/:subscriptionId" element={<BookNextSessionPage />} />

                <Route path="/notifications" element={<NotificationsTab />} />
                <Route path="/appointments" element={<AppointmentsTab orders={orders} />} />

                <Route path="/hair-profile" element={<HairProfilePage />} />

                <Route
                  path="/account/*"
                  element={
                    <AccountTab
                      orders={orders}
                      onNavigateToHome={() => navigate("/")}
                      initialOrderId={pendingOrderDetailsId}
                      onClearInitialOrder={() => setPendingOrderDetailsId(null)}
                      favourites={favourites}
                      onToggleFavourite={handleToggleFavourite}
                      onBook={handleBook}
                      onLogout={handleLogout}
                      isGuest={authStatus === "guest"}
                    />
                  }
                />
              </>
            )}

            {/* Catch all redirect */}
            <Route
              path="*"
              element={<Navigate to={authStatus !== "anonymous" ? "/" : "/login"} replace />}
            />
          </Routes>
        </main>

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-app-gold text-white py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between z-[100] animate-slideUp transition-all font-alexandria">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={16} strokeWidth={3} />
              </div>
              <span className="font-bold text-sm">{toastText}</span>
            </div>
          </div>
        )}

        {/* TabBar - Only show when NOT anonymous */}
        {authStatus !== "anonymous" && (
          <TabBar
            currentTab={currentTab}
            onTabChange={(tab) => navigate(`/${tab === "home" ? "" : tab}`)}
          />
        )}
      </div>
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
