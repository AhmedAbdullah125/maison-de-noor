import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import {
  Heart,
  ClipboardList,
  Info,
  Mail,
  Phone,
  ChevronLeft,
  XCircle,
  Wallet,
  Video,
  Check,
  ShoppingBag,
  LogOut,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Order } from "../App";
import { Product, ServiceAddon } from "../types";
import { DEMO_PRODUCTS, APP_COLORS } from "../constants";

import ProductCard from "./ProductCard";
import ReviewsTab from "./ReviewsTab";
import SubscriptionsTab from "./SubscriptionsTab";
import AppImage from "./AppImage";
import AppHeader from "./AppHeader";

import { clearAuth } from "./auth/authStorage";
import { useGetProfile } from "./services/useGetProfile";

import { deleteAccountRequest } from "./services/deleteAccount";

interface AccountTabProps {
  orders: Order[];
  onNavigateToHome: () => void;
  initialOrderId?: string | null;
  onClearInitialOrder?: () => void;
  favourites: number[];
  onToggleFavourite: (productId: number) => void;
  onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[]) => void;
  onLogout: () => void;
  isGuest?: boolean;
}

const AccountTab: React.FC<AccountTabProps> = ({
  orders,
  onNavigateToHome,
  initialOrderId,
  onClearInitialOrder,
  favourites,
  onToggleFavourite,
  onBook,
  onLogout,
  isGuest = false,
}) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isHairProfileComplete, setIsHairProfileComplete] = useState(false);

  // لو عندك نظام لغة، اربطه هنا
  const lang = "ar";

  // ✅ Profile API (skip for guest)
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetProfile(lang) as any;

  // ✅ User Data (API -> fallback localStorage -> fallback defaults)
  const userName = useMemo(() => {
    if (isGuest) return "زائر";
    return (
      profile?.name ||
      localStorage.getItem("mezo_auth_user_name") ||
      (JSON.parse(localStorage.getItem("user") || "null")?.name as string) ||
      "—"
    );
  }, [isGuest, profile?.name]);

  const userPhone = useMemo(() => {
    if (isGuest) return "";
    return (
      profile?.phone ||
      localStorage.getItem("mezo_auth_user_phone") ||
      (JSON.parse(localStorage.getItem("user") || "null")?.phone as string) ||
      ""
    );
  }, [isGuest, profile?.phone]);

  const userPhoto = useMemo(() => {
    if (isGuest) return null;
    return (
      profile?.photo ||
      (JSON.parse(localStorage.getItem("user") || "null")?.photo as string) ||
      null
    );
  }, [isGuest, profile?.photo]);

  const walletValue = useMemo(() => {
    if (isGuest) return null;
    return profile?.wallet ?? JSON.parse(localStorage.getItem("user") || "null")?.wallet ?? null;
  }, [isGuest, profile?.wallet]);

  const points = 1250;

  useEffect(() => {
    if (initialOrderId) {
      const order = orders.find((o) => o.id === initialOrderId);
      if (order) {
        navigate(`/account/order/${order.id}`);
        onClearInitialOrder?.();
      }
    }
  }, [initialOrderId, orders, onClearInitialOrder, navigate]);

  useEffect(() => {
    const profileLocal = localStorage.getItem("mezo_hair_profile");
    setIsHairProfileComplete(!!profileLocal);
  }, []);

  const favoriteProducts = useMemo(() => {
    return DEMO_PRODUCTS.filter((p) => favourites.includes(p.id));
  }, [favourites]);

  const handleProductClick = (product: Product) => {
    navigate(`/account/favorites/product/${product.id}`);
  };

  const handleLogoutClick = () => {
    if (isGuest) {
      navigate("/login");
      return;
    }
    clearAuth();
    onLogout();
  };

  // ✅ NEW: confirm delete integration
  const handleConfirmDelete = async () => {
    if (deleteLoading) return;
    setDeleteLoading(true);

    try {
      // call API
      const result = await deleteAccountRequest(lang);

      if (!result?.ok) {
        setDeleteLoading(false);
        return;
      }

      // ✅ clear auth tokens after successful delete
      clearAuth();

      // close modal
      setShowDeleteModal(false);

      // logout from app state
      onLogout();

      // optionally redirect (depending on your guard, it will redirect anyway)
      navigate("/signup", { replace: true });
    } finally {
      setDeleteLoading(false);
    }
  };

  const Menu = () => (
    <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
      <AppHeader title="الحساب" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {!isGuest && profileLoading && (
          <div className="text-[11px] text-app-textSec text-center mb-3">
            جاري تحميل بيانات الحساب...
          </div>
        )}
        {!isGuest && profileError && (
          <div className="text-[11px] text-red-500 text-center mb-3">
            تعذر تحميل بيانات الحساب
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm mb-6 border border-app-card/30">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-app-gold/10 flex-shrink-0 shadow-inner bg-gray-100">
              {isGuest ? (
                <div className="w-full h-full flex items-center justify-center text-app-textSec">
                  <ShoppingBag size={24} />
                </div>
              ) : (
                <AppImage
                  src={userPhoto || "https://maison-de-noor.com/assets/img/unknown.svg"}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col text-right">
              <span className="font-bold text-base text-app-text">{userName}</span>
              {!isGuest && (
                <span className="text-xs text-app-textSec font-medium" dir="ltr">
                  {userPhone}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 text-red-500 font-bold text-xs hover:bg-red-50 px-3 py-2 rounded-xl transition-all active:scale-95"
          >
            <span className="mt-0.5">{isGuest ? "تسجيل الدخول" : "تسجيل الخروج"}</span>
            {isGuest ? (
              <LogOut size={18} className="text-red-500 rotate-180" />
            ) : (
              <XCircle size={18} className="text-red-500" />
            )}
          </button>
        </div>

        {/* Hair and Scalp Profile Card */}
        <div
          onClick={() => navigate("/hair-profile")}
          className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm mb-6 border border-app-card/30 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex flex-col text-right">
            <span className="font-bold text-sm text-app-text">ملف العناية بالفروة و الشعر</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold ${isHairProfileComplete ? "text-green-600" : "text-app-textSec/60"}`}>
              {isHairProfileComplete ? "مكتمل" : "غير مكتمل"}
            </span>
            <div className={`p-2.5 rounded-2xl flex items-center justify-center transition-colors ${isHairProfileComplete ? "bg-green-50 text-green-600" : "bg-app-bg text-app-gold"}`}>
              {isHairProfileComplete ? <Check size={20} strokeWidth={3} /> : <FileText size={20} />}
            </div>
          </div>
        </div>

        {/* Top Section: QR & Points Wallet (Hidden for Guest) */}
        {!isGuest && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-app-card/30 flex flex-col items-center justify-center text-center">
              <h2 className="text-xs font-bold text-app-text mb-3">QR الحساب</h2>
              <div className="p-2 bg-white rounded-xl border border-app-card/20 shadow-sm mb-3">
                <QRCodeSVG value={`mezo://account/${userPhone}`} size={100} fgColor={APP_COLORS.gold} bgColor="#ffffff" level="M" />
              </div>
              <p className="text-[9px] text-app-textSec opacity-70 leading-tight">امسحي الكود للفتح السريع</p>
            </div>

            <div className="relative bg-white rounded-[2rem] p-4 shadow-sm border border-app-card/30 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-app-gold/5 pointer-events-none" />
              <Wallet className="absolute -bottom-6 -left-6 text-app-gold/5 w-28 h-28 rotate-12 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-app-gold/10 rounded-full text-app-gold">
                      <Wallet size={14} />
                    </div>
                    <span className="text-xs font-bold text-app-text">محفظتي</span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-app-gold font-alexandria tracking-tight">
                      {points.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-medium text-app-textSec">نقطة</span>
                  </div>

                  <p className="text-[12px] text-app-textSec leading-snug opacity-90 font-medium">
                    اجمعي نقاط أكثر ولتحصلي على خصم أكبر
                  </p>

                  {walletValue !== null && (
                    <p className="text-[10px] text-app-textSec mt-2 font-bold" dir="ltr">
                      Wallet: {walletValue}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-dashed border-app-card/40">
                  <p className="text-[10px] font-bold text-app-textSec/80 text-center">100 نقطة = 1 د.ك</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Section */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-app-card/30 mb-8">
          <div
            onClick={() => navigate("/account/favorites")}
            className="flex items-center justify-between p-3.5 border-b border-app-bg active:bg-app-bg transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                <Heart size={20} />
              </div>
              <span className="text-sm font-bold text-app-text">الخدمات المفضلة</span>
            </div>
            <ChevronLeft className="text-app-textSec opacity-40" size={18} />
          </div>

          <div
            onClick={() => navigate("/account/history")}
            className="flex items-center justify-between p-3.5 border-b border-app-bg active:bg-app-bg transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                <ClipboardList size={20} />
              </div>
              <span className="text-sm font-bold text-app-text">سجل الحجوزات</span>
            </div>
            <ChevronLeft className="text-app-textSec opacity-40" size={18} />
          </div>

          <div
            onClick={() => navigate("/account/reviews")}
            className="flex items-center justify-between p-3.5 border-b border-app-bg active:bg-app-bg transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                <Video size={20} />
              </div>
              <span className="text-sm font-bold text-app-text">تجارب عميلاتنا</span>
            </div>
            <ChevronLeft className="text-app-textSec opacity-40" size={18} />
          </div>

          <div className="flex items-center justify-between p-3.5 border-b border-app-bg active:bg-app-bg transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                <Info size={20} />
              </div>
              <span className="text-sm font-bold text-app-text">عن Mezo Do Noor</span>
            </div>
            <ChevronLeft className="text-app-textSec opacity-40" size={18} />
          </div>

          <div className="flex items-center justify-between p-3.5 border-b border-app-bg active:bg-app-bg transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                <Mail size={20} />
              </div>
              <span className="text-sm font-bold text-app-text">contact@mezodonoor.com</span>
            </div>
            <ChevronLeft className="text-app-textSec opacity-40" size={18} />
          </div>

          <div className="flex items-center justify-between p-3.5 active:bg-app-bg transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                <Phone size={20} />
              </div>
              <span className="text-sm font-bold text-app-text" dir="ltr">
                96554647655
              </span>
            </div>
            <ChevronLeft className="text-app-textSec opacity-40" size={18} />
          </div>
        </div>

        {/* Delete Account */}
        {!isGuest && (
          <div className="flex justify-center items-center py-4 mb-4">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-[10px] font-bold text-red-400/80 hover:text-red-500 underline underline-offset-4 active:opacity-60 transition-all font-alexandria"
            >
              حذف الحساب
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const History = () => (
    <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
      <AppHeader title="سجل الحجوزات" onBack={() => navigate("/account")} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-app-gold/40 border border-app-card/30">
              <ClipboardList size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-6">لا يوجد أي حجوزات حتى الآن</h2>
            <button
              onClick={onNavigateToHome}
              className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              استعراض الخدمات
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-app-text">رقم الحجز: {order.id}</span>
                  <span className="text-[10px] font-bold px-3 py-1 bg-green-50 text-green-600 rounded-full">
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs text-app-textSec">
                    <span>تاريخ الحجز:</span>
                    <span className="font-medium" dir="ltr">
                      {order.date}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-app-textSec">
                    <span>الخدمة:</span>
                    <span className="font-medium">{order.packageName || "خدمة محددة"}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-app-text">
                    <span>الإجمالي:</span>
                    <span className="text-app-gold">{order.total}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/account/order/${order.id}`)}
                  className="w-full py-3 text-app-gold font-bold text-sm bg-app-bg rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  عرض تفاصيل الحجز
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const OrderDetails = () => {
    const { orderId } = useParams();
    const selectedOrder = orders.find((o) => o.id === orderId);

    if (!selectedOrder) return null;

    return (
      <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
        <AppHeader title="تفاصيل الحجز" onBack={() => navigate("/account/history")} />

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-6 pb-28 pt-24">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-app-bg rounded-xl text-app-gold">
                <ShoppingBag size={20} />
              </div>
              <span className="text-sm font-bold text-app-text">ملخص الحجز</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-app-textSec">
                <span>رقم الحجز</span>
                <span className="font-bold text-app-text">#{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between text-xs text-app-textSec">
                <span>التاريخ</span>
                <span className="font-medium text-app-text" dir="ltr">
                  {selectedOrder.date}
                </span>
              </div>
              <div className="flex justify-between text-xs text-app-textSec">
                <span>الحالة</span>
                <span className="text-green-600 font-bold">{selectedOrder.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
            <div className="space-y-3">
              <div className="pt-3 flex justify-between">
                <span className="text-sm font-bold text-app-text">الإجمالي الكلي</span>
                <span className="text-lg font-bold text-app-gold">{selectedOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Favorites = () => (
    <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
      <AppHeader title="الخدمات المفضلة" onBack={() => navigate("/account")} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
        {favoriteProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-app-gold/40 border border-app-card/30">
              <Heart size={48} strokeWidth={1.5} className="text-app-gold" />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-6">لا يوجد أي خدمات في المفضلة</h2>
            <button
              onClick={onNavigateToHome}
              className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              تصفح الخدمات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavourite={true}
                onToggleFavourite={onToggleFavourite}
                onBook={onBook}
                onClick={handleProductClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ProductDetails unchanged (same as your version)
  const ProductDetails = () => {
    const { productId } = useParams();
    const selectedProduct = DEMO_PRODUCTS.find((p) => p.id === parseInt(productId || ""));
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

    const priceData = useMemo(() => {
      if (!selectedProduct) return { base: 0, addons: 0, total: 0 };
      const base = parseFloat(selectedProduct.price.replace(/[^\d.]/g, ""));
      let addons = 0;

      if (selectedProduct.addons) {
        selectedProduct.addons.forEach((addon) => {
          if (selectedAddonIds.has(addon.id)) addons += addon.price_kwd;
        });
      }

      if (selectedProduct.addonGroups) {
        selectedProduct.addonGroups.forEach((group) => {
          group.options.forEach((option) => {
            if (selectedAddonIds.has(option.id)) addons += option.price_kwd;
          });
        });
      }

      return { base, addons, total: base + addons };
    }, [selectedProduct, selectedAddonIds]);

    const handleToggleAddon = (addonId: string) => {
      const next = new Set(selectedAddonIds);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      setSelectedAddonIds(next);
    };

    const handleGroupOptionSelect = (groupId: string, optionId: string, type: "single" | "multi") => {
      const next = new Set(selectedAddonIds);

      if (type === "single") {
        const group = selectedProduct?.addonGroups?.find((g) => g.id === groupId);
        if (group) group.options.forEach((opt) => next.delete(opt.id));
        next.add(optionId);
      } else {
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
      }

      setSelectedAddonIds(next);
    };

    const handleAddAction = () => {
      if (!selectedProduct) return;

      if (selectedProduct.addonGroups) {
        for (const group of selectedProduct.addonGroups) {
          if (group.required) {
            const hasSelection = group.options.some((opt) => selectedAddonIds.has(opt.id));
            if (!hasSelection) {
              alert(`يرجى اختيار ${group.title_ar}`);
              return;
            }
          }
        }
      }

      const selectedAddonsList: ServiceAddon[] = [];

      if (selectedProduct.addons) {
        selectedAddonsList.push(...selectedProduct.addons.filter((a) => selectedAddonIds.has(a.id)));
      }

      if (selectedProduct.addonGroups) {
        selectedProduct.addonGroups.forEach((group) => {
          selectedAddonsList.push(...group.options.filter((a) => selectedAddonIds.has(a.id)));
        });
      }

      onBook(selectedProduct, 1, selectedAddonsList);
    };

    if (!selectedProduct) return null;

    return (
      <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
        <AppHeader title="تفاصيل الخدمة" onBack={() => navigate("/account/favorites")} />

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
          <div className="mb-6">
            <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
              <AppImage src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-app-text font-alexandria leading-tight">{selectedProduct.name}</h2>

            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-app-gold">{priceData.total.toFixed(3)} د.ك</span>
              </div>
            </div>
          </div>

          <div className="mb-10 space-y-3">
            <button
              onClick={handleAddAction}
              className="w-full bg-app-gold active:bg-app-goldDark text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <ShoppingBag size={20} />
              <span>حجز جلسة</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-app-bg relative">
      <Routes>
        <Route index element={<Menu />} />
        <Route path="history" element={<History />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="reviews" element={<ReviewsTab />} />
        <Route path="subscriptions" element={<SubscriptionsTab />} />
        <Route path="order/:orderId" element={<OrderDetails />} />
        <Route path="favorites/product/:productId" element={<ProductDetails />} />
      </Routes>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && !isGuest && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl animate-scaleIn text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-base font-bold text-app-text mb-2 font-alexandria">تأكيد حذف الحساب</h2>
            <p className="text-xs text-app-textSec leading-loose mb-6 font-alexandria">
              هل أنتِ متأكدة من حذف حسابك؟ لا يمكن التراجع عن هذه الخطوة.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className={`w-full py-3.5 font-bold rounded-xl text-xs active:scale-95 transition-transform font-alexandria ${deleteLoading ? "bg-red-50 text-red-300" : "bg-red-50 text-red-500"
                  }`}
              >
                {deleteLoading ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="w-full py-3.5 bg-app-bg text-app-text font-bold rounded-xl text-xs active:scale-95 transition-transform font-alexandria"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountTab;