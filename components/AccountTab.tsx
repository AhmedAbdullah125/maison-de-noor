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
  UserCog,
  Save,
  Camera,
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

import { useGetProfile } from "./services/useGetProfile";
import { useUpdateProfile } from "./services/useUpdateProfile";
import { deleteAccountRequest } from "./services/deleteAccount";
import { clearAuth, isLoggedIn } from "./auth/authStorage";

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
  lang?: string;
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
  lang = "ar",
}) => {
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isHairProfileComplete, setIsHairProfileComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Load profile only if authenticated & not guest
  const shouldLoadProfile = !isGuest && isLoggedIn();
  const profileQuery = useGetProfile(lang);
  const profile = shouldLoadProfile ? profileQuery.data : null;

  const updateMut = useUpdateProfile(lang);

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
    const p = localStorage.getItem("mezo_hair_profile");
    setIsHairProfileComplete(!!p);
  }, []);

  const favoriteProducts = useMemo(() => {
    return DEMO_PRODUCTS.filter((p) => favourites.includes(p.id));
  }, [favourites]);

  const handleProductClick = (product: Product) => {
    navigate(`/account/favorites/product/${product.id}`);
  };

  const handleAuthButton = () => {
    if (isGuest || !isLoggedIn()) {
      navigate("/login");
      return;
    }
    clearAuth();
    onLogout?.();
    navigate("/login", { replace: true });
  };

  // ✅ Delete account flow
  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    const res = await deleteAccountRequest(lang);

    setIsDeleting(false);

    if (res.ok) {
      setShowDeleteModal(false);
      clearAuth();
      onLogout?.();
      navigate("/login", { replace: true });
    }
  };

  const EditProfile = () => {
    const [name, setName] = useState(profile?.name || "");
    const [email, setEmail] = useState(profile?.email || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    // preview
    const [photoPreview, setPhotoPreview] = useState<string>(profile?.photo || "");

    useEffect(() => {
      setName(profile?.name || "");
      setEmail(profile?.email || "");
      setPhone(profile?.phone || "");
      setPhotoPreview(profile?.photo || "");
      setPhotoFile(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.name, profile?.email, profile?.phone, profile?.photo]);

    useEffect(() => {
      if (!photoFile) return;
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }, [photoFile]);

    const handleSave = async () => {
      if (!name.trim()) return;

      await updateMut.mutateAsync({
        name,
        email,
        phone,
        photo: photoFile,
      });

      // لو success هيعمل invalidate للـ profile
      // نرجع للـ account
      if (!updateMut.isError) navigate("/account");
    };

    return (
      <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
        <AppHeader title="تعديل الحساب" onBack={() => navigate("/account")} />

        <div className="overflow-y-auto no-scrollbar px-6 pt-24 pb-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30 space-y-6">
            {/* Photo */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-app-text">الصورة</span>
                <span className="text-[11px] text-app-textSec">اختياري</span>
              </div>

              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-app-gold/15 bg-app-bg flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={22} className="text-app-gold" />
                  )}
                </div>
                <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-app-gold text-white flex items-center justify-center shadow-lg">
                  <Camera size={14} />
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-app-text mb-2">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-right font-bold text-app-text"
                placeholder="الاسم"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-app-text mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-right font-bold text-app-text"
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-app-text mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-right font-bold text-app-text"
                dir="ltr"
                placeholder="رقم الهاتف"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-app-card/30">
          <button
            onClick={handleSave}
            disabled={updateMut.isPending}
            className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {updateMut.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const Menu = () => {
    const userName = isGuest ? "زائر" : profile?.name || "—";
    const userPhone = isGuest ? "" : profile?.phone || "";
    const userPhoto = isGuest ? "" : profile?.photo || "https://maison-de-noor.com/assets/img/unknown.svg";
    const wallet = isGuest ? "0.00" : profile?.wallet || "0.00";

    return (
      <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
        <AppHeader title="الحساب" />

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
          {/* Profile Card */}
          <div className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm mb-6 border border-app-card/30">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-app-gold/10 flex-shrink-0 shadow-inner bg-gray-100">
                {isGuest ? (
                  <div className="w-full h-full flex items-center justify-center text-app-textSec">
                    <ShoppingBag size={24} />
                  </div>
                ) : (
                  <AppImage src={userPhoto} alt="Profile Avatar" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex flex-col text-right">
                <span className="font-bold text-base text-app-text">
                  {!isGuest && profileQuery.isLoading ? "..." : userName}
                </span>
                {!isGuest && <span className="text-xs text-app-textSec font-medium" dir="ltr">{userPhone}</span>}
              </div>
            </div>

            <button
              onClick={handleAuthButton}
              className="flex items-center gap-1.5 text-red-500 font-bold text-xs hover:bg-red-50 px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <span className="mt-0.5">{isGuest ? "تسجيل الدخول" : "تسجيل الخروج"}</span>
              {isGuest ? <LogOut size={18} className="text-red-500 rotate-180" /> : <XCircle size={18} className="text-red-500" />}
            </button>
          </div>

          {/* Hair Profile */}
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

          {/* QR & Wallet */}
          {!isGuest && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-app-card/30 flex flex-col items-center justify-center text-center">
                <h2 className="text-xs font-bold text-app-text mb-3">QR الحساب</h2>
                <div className="p-2 bg-white rounded-xl border border-app-card/20 shadow-sm mb-3">
                  <QRCodeSVG
                    value={`mezo://account/${userPhone}`}
                    size={100}
                    fgColor={APP_COLORS.gold}
                    bgColor="#ffffff"
                    level="M"
                  />
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
                      <span className="text-2xl font-bold text-app-gold font-alexandria tracking-tight">{wallet}</span>
                      <span className="text-[10px] font-medium text-app-textSec">د.ك</span>
                    </div>

                    <p className="text-[12px] text-app-textSec leading-snug opacity-90 font-medium">
                      رصيدك الحالي في المحفظة
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-app-card/30 mb-8">
            {!isGuest && (
              <div
                onClick={() => navigate("/account/edit")}
                className="flex items-center justify-between p-3.5 border-b border-app-bg active:bg-app-bg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                    <UserCog size={20} />
                  </div>
                  <span className="text-sm font-bold text-app-text">تعديل الحساب</span>
                </div>
                <ChevronLeft className="text-app-textSec opacity-40" size={18} />
              </div>
            )}

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
  };

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
            <div className="pt-3 flex justify-between">
              <span className="text-sm font-bold text-app-text">الإجمالي الكلي</span>
              <span className="text-lg font-bold text-app-gold">{selectedOrder.total}</span>
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

  // ProductDetails — سيبناه زي ما هو (اختصار)
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

    const handleAddAction = () => {
      if (!selectedProduct) return;

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
          <div className="mb-10 space-y-3">
            <button
              onClick={handleAddAction}
              className="w-full bg-app-gold active:bg-app-goldDark text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <ShoppingBag size={20} />
              <span>
                حجز جلسة {priceData.total > priceData.base ? `(${priceData.total.toFixed(3)} د.ك)` : ""}
              </span>
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
        <Route path="edit" element={<EditProfile />} />
        <Route path="history" element={<History />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="reviews" element={<ReviewsTab />} />
        <Route path="subscriptions" element={<SubscriptionsTab />} />
        <Route path="order/:orderId" element={<OrderDetails />} />
        <Route path="favorites/product/:productId" element={<ProductDetails />} />
      </Routes>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                disabled={isDeleting}
                className="w-full py-3.5 bg-red-50 text-red-500 font-bold rounded-xl text-xs active:scale-95 transition-transform font-alexandria disabled:opacity-70"
              >
                {isDeleting ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
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
