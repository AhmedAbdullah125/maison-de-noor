import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Menu, Search, X, ChevronLeft, ArrowRight, Check, AlertCircle, Home, ShoppingBag, User, Video, Store } from 'lucide-react';
import { Product, ServiceAddon, Brand, ServicePackageOption, BookingItem } from '../types';
import ProductCard from './ProductCard';
import AppImage from './AppImage';
import ImageCarousel from './ImageCarousel';
import { cacheService } from '../services/cacheService';
import AppHeader from './AppHeader';

interface HomeTabProps {
  onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[], packageOption?: ServicePackageOption, customFinalPrice?: number) => void;
  favourites: number[];
  onToggleFavourite: (productId: number) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ onBook, favourites, onToggleFavourite }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, categoryName } = useParams();

  const [currentBanner, setCurrentBanner] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Interaction State
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  // Modal State for Package Confirmation
  const [pendingPackage, setPendingPackage] = useState<{ pkg: ServicePackageOption, price: number } | null>(null);

  // Cached Data State
  const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
  const [cachedBrands, setCachedBrands] = useState<Brand[]>([]);
  const [cachedBanners, setCachedBanners] = useState<{ id: number, image: string }[]>([]);
  const [isBannersLoading, setIsBannersLoading] = useState(true);

  // Initialize from cache
  useEffect(() => {
    const data = cacheService.getInitialData();
    setCachedProducts(data.services);
    setCachedBrands(data.categories);
    setCachedBanners(data.banners);
    if (data.banners.length > 0) {
      setIsBannersLoading(false);
    } else {
      setTimeout(() => setIsBannersLoading(false), 2000);
    }
  }, []);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return cachedProducts.find(p => p.id === parseInt(productId)) || null;
  }, [productId, cachedProducts]);

  useEffect(() => {
    setSelectedAddonIds(new Set());
  }, [selectedProduct]);

  const activeCategory = useMemo(() => {
    return categoryName || null;
  }, [categoryName]);

  const priceData = useMemo(() => {
    if (!selectedProduct) return { base: 0, addons: 0, total: 0, display: "0.000", duration: "0" };

    // Fallback for simple type parsing, though we strictly use simple or addons now
    const base = parseFloat(selectedProduct.price.replace(/[^\d.]/g, ''));
    let addons = 0;

    // Legacy Addons
    if (selectedProduct.type === 'addons' && selectedProduct.addons) {
      selectedProduct.addons.forEach(addon => {
        if (selectedAddonIds.has(addon.id)) {
          addons += addon.price_kwd;
        }
      });
    }

    // New Grouped Addons
    if (selectedProduct.addonGroups) {
      selectedProduct.addonGroups.forEach(group => {
        group.options.forEach(option => {
          if (selectedAddonIds.has(option.id)) {
            addons += option.price_kwd;
          }
        });
      });
    }

    const total = base + addons;
    return {
      base,
      addons,
      total,
      display: `${total.toFixed(3)} د.ك`,
      duration: selectedProduct.duration || '0'
    };
  }, [selectedProduct, selectedAddonIds]);

  useEffect(() => {
    if (activeCategory || selectedProduct || cachedBanners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % cachedBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [cachedBanners.length, activeCategory, selectedProduct]);

  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentBanner((prev) => (prev + 1) % cachedBanners.length);
    } else if (isRightSwipe) {
      setCurrentBanner((prev) => (prev - 1 + cachedBanners.length) % cachedBanners.length);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // New Navigation Handlers
  const handleProductClick = (product: Product) => {
    // If we are in category view, we stay in same component but URL changes.
    // If we are in home view, we go to product URL.
    // We pass 'from' state to know where to go back to.
    let fromPath = '/';
    if (activeCategory) {
      fromPath = `/category/${activeCategory}`;
    }

    navigate(`/product/${product.id}`, { state: { from: fromPath } });
  };

  const handleBack = () => {
    if (selectedProduct) {
      // Check if there is a 'from' state
      const fromState = location.state as { from?: string } | undefined;
      if (fromState?.from) {
        navigate(fromState.from);
      } else {
        navigate('/');
      }
    } else if (activeCategory) {
      navigate('/');
    }
  };

  const handleToggleAddon = (addonId: string) => {
    const next = new Set(selectedAddonIds);
    if (next.has(addonId)) {
      next.delete(addonId);
    } else {
      next.add(addonId);
    }
    setSelectedAddonIds(next);
  };

  const handleGroupOptionSelect = (groupId: string, optionId: string, type: 'single' | 'multi') => {
    const next = new Set(selectedAddonIds);

    if (type === 'single') {
      // Find all option IDs in this group to deselect them
      const group = selectedProduct?.addonGroups?.find(g => g.id === groupId);
      if (group) {
        group.options.forEach(opt => next.delete(opt.id));
      }
      // Select new one
      next.add(optionId);
    } else {
      // Multi select
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
    }

    setSelectedAddonIds(next);
  };

  const handleAddAction = (pkgOption?: ServicePackageOption, customPrice?: number) => {
    if (selectedProduct) {
      // Validate Required Groups
      if (selectedProduct.addonGroups) {
        for (const group of selectedProduct.addonGroups) {
          if (group.required) {
            const hasSelection = group.options.some(opt => selectedAddonIds.has(opt.id));
            if (!hasSelection) {
              alert(`يرجى اختيار ${group.title_ar}`);
              return;
            }
          }
        }
      }

      // If this is a package CTA, show the confirmation modal
      if (pkgOption && customPrice !== undefined) {
        setPendingPackage({ pkg: pkgOption, price: customPrice });
        return;
      }

      const selectedAddonsList: ServiceAddon[] = [];

      // Collect Legacy Addons
      if (selectedProduct.addons) {
        selectedAddonsList.push(...selectedProduct.addons.filter(a => selectedAddonIds.has(a.id)));
      }

      // Collect Grouped Addons
      if (selectedProduct.addonGroups) {
        selectedProduct.addonGroups.forEach(group => {
          selectedAddonsList.push(...group.options.filter(a => selectedAddonIds.has(a.id)));
        });
      }

      // Navigate DIRECTLY to booking flow
      // onBook in App.tsx handles navigation, we rely on it to capture current location for return.
      onBook(selectedProduct, 1, selectedAddonsList, pkgOption, customPrice);
    }
  };

  // Handler for Modal "Book Now"
  const handleConfirmPackageBooking = () => {
    if (!selectedProduct || !pendingPackage) return;

    const selectedAddonsList: ServiceAddon[] = [];
    if (selectedProduct.addons) {
      selectedAddonsList.push(...selectedProduct.addons.filter(a => selectedAddonIds.has(a.id)));
    }
    if (selectedProduct.addonGroups) {
      selectedProduct.addonGroups.forEach(group => {
        selectedAddonsList.push(...group.options.filter(a => selectedAddonIds.has(a.id)));
      });
    }

    // Capture the package details before clearing state
    const { pkg, price } = pendingPackage;
    setPendingPackage(null); // Close modal

    onBook(selectedProduct, 1, selectedAddonsList, pkg, price);
  };

  const getProductImages = (product: Product) => {
    if (product.images && product.images.length > 0) return product.images;
    return [product.image];
  };

  return (
    <div className="flex flex-col h-[100vh] bg-app-bg relative font-alexandria overflow-hidden">

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={toggleMenu}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-3/4 max-w-[320px] bg-white shadow-2xl animate-slideLeftRtl flex flex-col fixed h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 flex items-center justify-between border-b border-app-card/30 bg-white z-10">
              <span className="text-lg font-bold text-app-text font-alexandria">الأقسام</span>
              <button onClick={toggleMenu} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">
              {/* Categories List */}
              <div className="flex-1">
                {cachedBrands.map((brand) => (
                  <button
                    key={brand.id}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-app-bg active:bg-app-card/50 transition-colors border-b border-app-card/10 group"
                    onClick={() => {
                      navigate(`/brand/${brand.id}`);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className="text-sm font-medium text-app-text font-alexandria">{brand.name}</span>
                    <ChevronLeft size={18} className="text-app-gold opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              {/* Bottom CTA Buttons Section */}
              <div className="px-6 mt-6 space-y-3">
                {/* Button 1: My Account */}
                <button
                  onClick={() => { navigate('/account'); setIsMenuOpen(false); }}
                  className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <User size={18} />
                  <span>حسابي</span>
                </button>

                {/* Button 2: Online Technician (Primary) */}
                <button
                  onClick={() => { navigate('/technician/online'); setIsMenuOpen(false); }}
                  className="w-full py-3.5 rounded-xl bg-app-gold text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md shadow-app-gold/20"
                >
                  <Video size={18} />
                  <span>حجز التكنك أونلاين ( المرة الأولى مجانا )</span>
                </button>

                {/* Button 3: Buy Products */}
                <button
                  onClick={() => { window.open('https://google.com', '_blank', 'noreferrer'); setIsMenuOpen(false); }}
                  className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ShoppingBag size={18} />
                  <span>شراء منتجات ترندي هير</span>
                </button>
              </div>

              {/* Social Icons Row */}
              <div className="mt-6 px-8 pb-4">
                <div className="flex items-center justify-center gap-6">
                  {/* Instagram */}
                  <a
                    href="https://instagram.com/trandyhair"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-[#f5f1e8] flex items-center justify-center text-app-gold text-lg hover:opacity-80 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  {/* TikTok */}
                  <a
                    href="https://tiktok.com/@trandyhair"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-[#f5f1e8] flex items-center justify-center text-app-gold text-lg hover:opacity-80 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>
                  {/* Snapchat */}
                  <a
                    href="https://snapchat.com/@trandyhairnoor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-[#f5f1e8] flex items-center justify-center text-app-gold text-lg hover:opacity-80 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12.005 1.8c-4.407 0-7.79 2.592-7.79 6.035 0 1.802 1.006 3.18 2.628 4.316.345.242.375.819-.059 1.132-.355.257-1.144.829-1.144 2.41 0 1.233.69 2.016 1.474 2.457.545.307.545.889.15 1.428-1.04 1.427-2.016 3.253-1.04 4.825 1.383.243 4.333.393 5.86-.543.74-.453 1.478-.052 2.217.052.793.111 1.432.553 2.217.052 1.478.936 4.433.82 5.86.543 1-.94.04-2.73-1.04-4.825-.395-.539-.395-1.12.15-1.428.783-.44 1.473-1.224 1.473-2.457 0-1.58-.79-2.153-1.144-2.41-.434-.313-.404-.89.059-1.132 1.622-1.136 2.628-2.514 2.628-4.316 0-3.443-3.383-6.035-7.79-6.035" />
                    </svg>
                  </a>
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/96599007898"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-[#f5f1e8] flex items-center justify-center text-app-gold text-lg hover:opacity-80 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2zM12.05 20.21c-1.5 0-2.98-.4-4.28-1.16l-.3-.18-3.15.82.84-3.07-.19-.31c-.82-1.32-1.26-2.87-1.26-4.43 0-4.51 3.67-8.18 8.18-8.18 2.18 0 4.23.85 5.78 2.39 1.54 1.54 2.39 3.59 2.39 5.78 0 4.51-3.67 8.18-8.18 8.18zm4.52-6.13c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.23.24-.39.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.11-.23-.18-.48-.3z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-app-card/30 bg-app-bg/30">
              <a
                href="https://raiyansoft.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-app-textSec text-center font-alexandria block hover:opacity-70 active:opacity-50 transition-opacity"
              >
                powered by raiyansoft
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Package Confirmation Modal */}
      {pendingPackage && (
        <div
          className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPendingPackage(null)}
        >
          <div
            className="bg-white w-full max-w-[340px] rounded-[24px] p-6 shadow-2xl relative flex flex-col items-center text-center animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPendingPackage(null)}
              className="absolute top-4 left-4 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors active:scale-95"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-app-text mb-6 mt-2">تأكيد الحجز</h2>

            <div className="w-full space-y-3 mb-6">
              <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                <span className="text-xs text-app-textSec font-medium">عدد الجلسات</span>
                <span className="text-sm font-bold text-app-text">{pendingPackage.pkg.sessionsCount}</span>
              </div>
              <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                <span className="text-xs text-app-textSec font-medium">صلاحية الباكج</span>
                <span className="text-sm font-bold text-app-text">{pendingPackage.pkg.validityDays || 30} يوم</span>
              </div>
            </div>

            <p className="text-sm font-bold text-app-text leading-loose mb-8 px-1">
              في حال الالتزام بعدد الجلسات ستحصلين على أروع النتائج بوقت قياسي و تختصري على نفسك الوقت و الجهد
            </p>

            <button
              onClick={handleConfirmPackageBooking}
              className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              الحجز الآن
            </button>
          </div>
        </div>
      )}

      {/* Persistent App Header */}
      <AppHeader
        actionStart={
          <button
            onClick={toggleMenu}
            className="p-2 text-app-text hover:bg-app-card rounded-full transition-colors flex-shrink-0"
          >
            <Menu size={24} />
          </button>
        }
        title={
          <div
            className="flex items-center justify-center gap-2 px-2 cursor-pointer w-full"
            onClick={() => { navigate('/'); }}
          >
            <AppImage
              src="https://raiyansoft.com/wp-content/uploads/2025/12/fav.png"
              alt="Mezo Do Noor logo"
              className="h-7 w-7 object-contain"
            />
            <span className="text-xl font-bold text-app-text font-alexandria truncate">
              ميزو دو نور
            </span>
          </div>
        }
      />

      {/* Main Content with Padding for Header */}
      <main className="flex-1 overflow-y-auto w-full pb-28 pt-24">
        {selectedProduct ? (
          <div className="animate-fadeIn pt-2">
            <div className="px-6 mb-4">
              <button
                onClick={handleBack}
                className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex items-center gap-2"
              >
                <ArrowRight size={20} />
                <span className="text-sm font-medium">العودة</span>
              </button>
            </div>

            {/* Image Carousel Section */}
            <div className="px-6 mb-6">
              <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                <ImageCarousel
                  images={getProductImages(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Title & Price Section */}
            <div className="px-8 mb-4">
              <h2 className="text-2xl font-bold text-app-text font-alexandria leading-tight">
                {selectedProduct.name}
              </h2>

              {/* Type Badge */}
              <div className="mt-2 mb-1 flex flex-wrap gap-2">
                {selectedProduct.type === 'addons' && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">إضافات اختيارية</span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-app-gold">{priceData.display}</span>
                  {selectedProduct.oldPrice && (
                    <span className="text-sm text-app-textSec line-through opacity-60">
                      {selectedProduct.oldPrice}
                    </span>
                  )}
                </div>

                {selectedProduct.type === 'addons' && priceData.addons > 0 && (
                  <div className="text-[10px] text-app-textSec font-medium space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span>السعر الأساسي:</span>
                      <span>{priceData.base.toFixed(3)} د.ك</span>
                    </div>
                    <div className="flex items-center gap-1 text-app-gold">
                      <span>الإضافات:</span>
                      <span>+{priceData.addons.toFixed(3)} د.ك</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- TYPE: ADDONS Section (Legacy) --- */}
            {selectedProduct.type === 'addons' && selectedProduct.addons && selectedProduct.addons.length > 0 && !selectedProduct.addonGroups && (
              <div className="px-6 mb-6">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-app-text">إضافات الخدمة (اختياري)</h3>
                  <p className="text-[10px] text-app-textSec mt-0.5">اختاري الإضافات التي تناسبك وسيتم تحديث السعر تلقائياً</p>
                </div>
                <div className="space-y-3">
                  {selectedProduct.addons.map(addon => {
                    const isSelected = selectedAddonIds.has(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${isSelected
                            ? 'bg-app-gold/5 border-app-gold shadow-sm'
                            : 'bg-white border-app-card/30 hover:border-app-card'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-app-gold border-app-gold' : 'border-app-textSec/30'
                            }`}>
                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isSelected ? 'text-app-gold' : 'text-app-text'}`}>{addon.title_ar}</p>
                            {addon.desc_ar && <p className="text-[10px] text-app-textSec">{addon.desc_ar}</p>}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-app-text">+{addon.price_kwd.toFixed(3)} د.ك</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TYPE: GROUPED ADDONS Section (New) --- */}
            {selectedProduct.addonGroups && selectedProduct.addonGroups.length > 0 && (
              <div className="px-6 mb-6 space-y-6">
                {selectedProduct.addonGroups.map(group => (
                  <div key={group.id}>
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-bold text-app-text">{group.title_ar}</h3>
                      {group.required && (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-bold">مطلوب</span>
                      )}
                      {!group.required && group.type === 'multi' && (
                        <span className="text-[10px] text-app-textSec bg-app-bg px-2 py-0.5 rounded-md">اختياري (متعدد)</span>
                      )}
                      {!group.required && group.type === 'single' && (
                        <span className="text-[10px] text-app-textSec bg-app-bg px-2 py-0.5 rounded-md">اختياري</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.options.map(option => {
                        const isSelected = selectedAddonIds.has(option.id);
                        const isRadio = group.type === 'single';

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleGroupOptionSelect(group.id, option.id, group.type)}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected
                                ? 'bg-app-gold/5 border-app-gold shadow-sm'
                                : 'bg-white border-app-card/30 hover:border-app-card'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {isRadio ? (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-app-gold' : 'border-app-textSec/30'
                                  }`}>
                                  {isSelected && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
                                </div>
                              ) : (
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-app-gold border-app-gold' : 'border-app-textSec/30'
                                  }`}>
                                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                </div>
                              )}

                              <div>
                                <p className={`text-sm font-bold ${isSelected ? 'text-app-gold' : 'text-app-text'}`}>{option.title_ar}</p>
                                {option.desc_ar && <p className="text-[10px] text-app-textSec">{option.desc_ar}</p>}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-app-text">+{option.price_kwd.toFixed(3)} د.ك</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-8 mb-8">
              <h3 className="text-sm font-bold text-app-text mb-2">الوصف</h3>
              <p className="text-sm text-app-textSec leading-relaxed">
                {selectedProduct.description || "لا يوجد وصف متوفر لهذه الخدمة حالياً."}
              </p>
            </div>

            <div className="px-8 mb-10 space-y-3">
              {/* Unified Booking Buttons (Single vs Package State) */}
              {selectedProduct.packageOptions && selectedProduct.packageOptions.length > 0 ? (
                <div className="space-y-4">
                  {selectedProduct.packageOptions
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(pkg => {
                      const originalTotal = priceData.total * pkg.sessionsCount;
                      const discountAmount = originalTotal * (pkg.discountPercent / 100);
                      const finalTotal = originalTotal - discountAmount;

                      return (
                        <div key={pkg.id} className="w-full">
                          {pkg.titleText && (
                            <p className="text-xs font-bold text-app-text mb-1.5 px-1">{pkg.titleText}</p>
                          )}
                          <button
                            onClick={() => handleAddAction(pkg, finalTotal)}
                            className="w-full bg-app-gold text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between"
                          >
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2">
                                <ShoppingBag size={18} />
                                <span className="text-base">حجز {pkg.sessionsCount} جلسات</span>
                              </div>
                              <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium">
                                {pkg.sessionsCount} جلسات
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold">{finalTotal.toFixed(3)} د.ك</span>
                              <span className="text-[10px] line-through opacity-70">{originalTotal.toFixed(3)} د.ك</span>
                              {pkg.discountPercent > 0 && (
                                <span className="text-[9px] font-bold text-yellow-300 mt-0.5">وفري {discountAmount.toFixed(3)} د.ك</span>
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* State A: Single Service Button */
                <button
                  onClick={() => handleAddAction()}
                  className="w-full bg-app-gold text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-app-gold/30 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={20} />
                    <span>حجز جلسة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{priceData.total.toFixed(3)} د.ك</span>
                    <div className="h-6 w-[1px] bg-white/30"></div>
                    <span className="text-[10px] font-medium opacity-90">1 جلسات</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : !activeCategory ? (
          <div className="pt-2 animate-fadeIn">
            {/* 1. Search Bar */}
            <div className="px-6 mb-6">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="بحث عن خدمة"
                  className="w-full bg-white border border-app-card rounded-full py-3.5 pr-6 pl-12 text-right focus:outline-none focus:border-app-gold shadow-sm font-alexandria text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec" size={20} />
              </div>
            </div>

            {/* 2. Banner */}
            <div className="px-6">
              {isBannersLoading ? (
                <div className="w-full h-[200px] rounded-[2rem] bg-gray-200 animate-shimmer overflow-hidden shadow-md border border-app-card/20" />
              ) : (
                <div
                  className="relative w-full h-auto rounded-[2rem] overflow-hidden shadow-md bg-white border border-app-card/20"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div
                    className="flex w-full h-auto transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(${currentBanner * 100}%)` }}
                  >
                    {cachedBanners.map((banner, index) => (
                      <div key={banner.id} className="min-w-full h-auto flex items-center justify-center">
                        <img
                          src={banner.image}
                          alt=""
                          className="w-full h-auto object-cover object-center block"
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {cachedBanners.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === index ? 'w-6 bg-app-gold' : 'w-1.5 bg-app-gold/30'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Categories Grid */}
            <div className="px-6 mt-8">
              <h2 className="text-lg font-bold text-app-text mb-4 text-center sm:text-right">الأقسام</h2>
              <div className="grid grid-cols-3 gap-4 pb-20">
                {cachedBrands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => navigate(`/brand/${brand.id}`)}
                    className="flex flex-col items-center group active:scale-[0.98] transition-transform"
                  >
                    <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-white shadow-sm border border-app-card/30 group-hover:shadow-md transition-all">
                      <AppImage
                        src={brand.image}
                        alt={brand.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <span className="mt-2 text-xs font-bold text-app-text text-center truncate w-full px-1">
                      {brand.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="animate-fadeIn pt-2">
            <div className="px-6 mb-6 flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors"
              >
                <ArrowRight size={20} />
              </button>
              <h2 className="text-lg font-bold text-app-text font-alexandria truncate">
                {activeCategory}
              </h2>
            </div>
            <div className="px-6 grid grid-cols-2 gap-4">
              {cachedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavourite={favourites.includes(product.id)}
                  onToggleFavourite={onToggleFavourite}
                  onBook={onBook}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomeTab;