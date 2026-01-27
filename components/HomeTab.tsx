
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Menu, Search, X, ChevronLeft, ArrowRight, Check, ShoppingBag, User, Video } from 'lucide-react';
import { Product, ServiceAddon, Brand, ServicePackageOption, ServiceSubscription, ServiceAddonGroup } from '../types';
import ProductCard from './ProductCard';
import AppImage from './AppImage';
import ImageCarousel from './ImageCarousel';
import { cacheService } from '../services/cacheService';
import AppHeader from './AppHeader';
import { db } from '../services/db'; // Unified Data Source

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
  const [pendingPackage, setPendingPackage] = useState<{ pkg: ServicePackageOption, price: number } | null>(null);

  // Data State - Loaded from Shared DB
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<{ id: number, image: string }[]>([]);
  const [isBannersLoading, setIsBannersLoading] = useState(true);

  // Initialize from Unified DB
  useEffect(() => {
    const loadData = () => {
      const dbData = db.getData();
      setProducts(dbData.services);
      setBrands(dbData.categories);
      // Banners still from cache/constants for now as they aren't in DB main schema yet, 
      // but let's keep cacheService for banners or move them to DB later.
      const cached = cacheService.getInitialData();
      setBanners(cached.banners);
      if (cached.banners.length > 0) setIsBannersLoading(false);
      else setTimeout(() => setIsBannersLoading(false), 2000);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find(p => p.id === parseInt(productId)) || null;
  }, [productId, products]);

  // Resolve Add-ons: Merge inline addonGroups (legacy) with globalAddonIds (new)
  const resolvedAddonGroups = useMemo(() => {
    if (!selectedProduct) return [];

    let groups: ServiceAddonGroup[] = selectedProduct.addonGroups ? [...selectedProduct.addonGroups] : [];

    // Merge Global Addons
    if (selectedProduct.globalAddonIds && selectedProduct.globalAddonIds.length > 0) {
      const dbData = db.getData();
      const globals = dbData.serviceAddons.filter(ga => selectedProduct.globalAddonIds?.includes(ga.id));

      const mappedGlobals: ServiceAddonGroup[] = globals.map(ga => ({
        id: ga.id,
        title_ar: ga.titleAr, // Assuming AR for app view
        type: ga.selectionType === 'single' ? 'single' : 'multi',
        required: ga.required,
        options: ga.items.map(item => ({
          id: item.id,
          title_ar: item.labelAr,
          price_kwd: item.price,
          is_active: true
        }))
      }));

      groups = [...groups, ...mappedGlobals];
    }
    return groups;
  }, [selectedProduct]);

  useEffect(() => {
    setSelectedAddonIds(new Set());
  }, [selectedProduct]);

  const activeCategory = useMemo(() => {
    return categoryName || null;
  }, [categoryName]);

  const priceData = useMemo(() => {
    if (!selectedProduct) return { base: 0, addons: 0, total: 0, display: "0.000", duration: "0" };

    const base = parseFloat(selectedProduct.price.replace(/[^\d.]/g, ''));
    let addons = 0;

    // Legacy Addons
    if (selectedProduct.addons) {
      selectedProduct.addons.forEach(addon => {
        if (selectedAddonIds.has(addon.id)) {
          addons += addon.price_kwd;
        }
      });
    }

    // Resolved Grouped Addons (Inline + Global)
    resolvedAddonGroups.forEach(group => {
      group.options.forEach(option => {
        if (selectedAddonIds.has(option.id)) {
          addons += option.price_kwd;
        }
      });
    });

    const total = base + addons;
    return {
      base,
      addons,
      total,
      display: `${total.toFixed(3)} د.ك`,
      duration: selectedProduct.duration || '0'
    };
  }, [selectedProduct, selectedAddonIds, resolvedAddonGroups]);

  // Auto-play banners logic...
  useEffect(() => {
    if (activeCategory || selectedProduct || banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length, activeCategory, selectedProduct]);

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
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe) {
      setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleProductClick = (product: Product) => {
    let fromPath = '/';
    if (activeCategory) {
      fromPath = `/category/${activeCategory}`;
    }
    navigate(`/product/${product.id}`, { state: { from: fromPath } });
  };

  const handleBack = () => {
    if (selectedProduct) {
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
      // Find group in resolved list
      const group = resolvedAddonGroups.find(g => g.id === groupId);
      if (group) {
        group.options.forEach(opt => next.delete(opt.id));
      }
      next.add(optionId);
    } else {
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
    }

    setSelectedAddonIds(next);
  };

  const handleAddAction = (pkgOption?: ServicePackageOption, customPrice?: number) => {
    if (selectedProduct) {
      // Validate Required Groups
      for (const group of resolvedAddonGroups) {
        if (group.required) {
          const hasSelection = group.options.some(opt => selectedAddonIds.has(opt.id));
          if (!hasSelection) {
            alert(`يرجى اختيار ${group.title_ar}`);
            return;
          }
        }
      }

      if (pkgOption && customPrice !== undefined) {
        setPendingPackage({ pkg: pkgOption, price: customPrice });
        return;
      }

      const selectedAddonsList: ServiceAddon[] = [];

      if (selectedProduct.addons) {
        selectedAddonsList.push(...selectedProduct.addons.filter(a => selectedAddonIds.has(a.id)));
      }

      resolvedAddonGroups.forEach(group => {
        selectedAddonsList.push(...group.options.filter(a => selectedAddonIds.has(a.id)));
      });

      onBook(selectedProduct, 1, selectedAddonsList, pkgOption, customPrice);
    }
  };

  const handleSubscriptionClick = (sub: ServiceSubscription) => {
    const originalTotal = priceData.total * sub.sessionsCount;
    const finalTotal = originalTotal * (sub.pricePercent / 100);

    const mappedPkg: ServicePackageOption = {
      id: sub.id,
      sessionsCount: sub.sessionsCount,
      discountPercent: 100 - sub.pricePercent,
      titleText: sub.title,
      isEnabled: true,
      sortOrder: sub.sessionsCount,
      validityDays: sub.validityDays
    };

    handleAddAction(mappedPkg, finalTotal);
  };

  const handleConfirmPackageBooking = () => {
    if (!selectedProduct || !pendingPackage) return;

    const selectedAddonsList: ServiceAddon[] = [];
    if (selectedProduct.addons) {
      selectedAddonsList.push(...selectedProduct.addons.filter(a => selectedAddonIds.has(a.id)));
    }
    resolvedAddonGroups.forEach(group => {
      selectedAddonsList.push(...group.options.filter(a => selectedAddonIds.has(a.id)));
    });

    const { pkg, price } = pendingPackage;
    setPendingPackage(null);

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
              <span className="text-base font-bold text-app-text font-alexandria">الأقسام</span>
              <button onClick={toggleMenu} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">
              <div className="flex-1">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-app-bg active:bg-app-card/50 transition-colors border-b border-app-card/10 group"
                    onClick={() => {
                      navigate(`/brand/${brand.id}`);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span className="text-sm font-normal text-app-text font-alexandria">{brand.name}</span>
                    <ChevronLeft size={18} className="text-app-gold opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              {/* Bottom CTA Buttons */}
              <div className="px-6 mt-6 space-y-3">
                <button
                  onClick={() => { navigate('/account'); setIsMenuOpen(false); }}
                  className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <User size={18} />
                  <span>حسابي</span>
                </button>

                <button
                  onClick={() => { navigate('/technician/online'); setIsMenuOpen(false); }}
                  className="w-full py-3.5 rounded-xl bg-app-gold text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md shadow-app-gold/20"
                >
                  <Video size={18} />
                  <span>حجز التكنك أونلاين ( المرة الأولى مجانا )</span>
                </button>

                <button
                  onClick={() => { window.open('https://google.com', '_blank', 'noreferrer'); setIsMenuOpen(false); }}
                  className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ShoppingBag size={18} />
                  <span>شراء منتجات ترندي هير</span>
                </button>
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

            <h2 className="text-base font-bold text-app-text mb-6 mt-2">تأكيد الحجز</h2>

            <div className="w-full space-y-3 mb-6">
              <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                <span className="text-xs text-app-textSec font-normal">عدد الجلسات</span>
                <span className="text-sm font-bold text-app-text">{pendingPackage.pkg.sessionsCount}</span>
              </div>
              <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                <span className="text-xs text-app-textSec font-normal">صلاحية الباكج</span>
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
            <span className="text-lg font-bold text-app-text font-alexandria truncate">
              ميزو دو نور
            </span>
          </div>
        }
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pb-28 pt-24">
        {selectedProduct ? (
          <div className="animate-fadeIn pt-2">
            <div className="px-6 mb-4">
              <button
                onClick={handleBack}
                className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex items-center gap-2"
              >
                <ArrowRight size={20} />
                <span className="text-sm font-normal">العودة</span>
              </button>
            </div>

            {/* Image Carousel */}
            <div className="px-6 mb-6">
              <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                <ImageCarousel
                  images={getProductImages(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Title & Price */}
            <div className="px-8 mb-4">
              <h2 className="text-xl font-bold text-app-text font-alexandria leading-tight">
                {selectedProduct.name}
              </h2>

              <div className="mt-2 mb-1 flex flex-wrap gap-2">
                {(selectedProduct.addons && selectedProduct.addons.length > 0) && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">إضافات اختيارية</span>
                )}
                {(resolvedAddonGroups && resolvedAddonGroups.length > 0) && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">إضافات اختيارية</span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-app-gold">{priceData.display}</span>
                  {selectedProduct.oldPrice && (
                    <span className="text-sm text-app-textSec line-through opacity-60">
                      {selectedProduct.oldPrice}
                    </span>
                  )}
                </div>

                {priceData.addons > 0 && (
                  <div className="text-[10px] text-app-textSec font-normal space-y-0.5">
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

            {/* --- Legacy Addons --- */}
            {selectedProduct.addons && selectedProduct.addons.length > 0 && (
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

            {/* --- Resolved Addons Groups --- */}
            {resolvedAddonGroups.length > 0 && (
              <div className="px-6 mb-6 space-y-6">
                {resolvedAddonGroups.map(group => (
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
              {/* Unified Booking Buttons (Subscriptions vs Packages vs Single) */}
              {(selectedProduct.subscriptions && selectedProduct.subscriptions.length > 0) ? (
                <div className="space-y-4">
                  {selectedProduct.subscriptions.map(sub => {
                    const originalTotal = priceData.total * sub.sessionsCount;
                    const finalTotal = originalTotal * (sub.pricePercent / 100);

                    return (
                      <div key={sub.id} className="w-full">
                        {sub.title && (
                          <p className="text-xs font-bold text-app-text mb-1.5 px-1">{sub.title}</p>
                        )}
                        <button
                          onClick={() => handleSubscriptionClick(sub)}
                          className="w-full bg-app-gold text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={18} />
                              <span className="text-sm">حجز {sub.sessionsCount} جلسات</span>
                            </div>
                            <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-normal">
                              {sub.sessionsCount} جلسات
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold">{finalTotal.toFixed(3)} د.ك</span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : selectedProduct.packageOptions && selectedProduct.packageOptions.length > 0 ? (
                /* Legacy packageOptions fallback */
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
                                <span className="text-sm">حجز {pkg.sessionsCount} جلسات</span>
                              </div>
                              <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-normal">
                                {pkg.sessionsCount} جلسات
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold">{finalTotal.toFixed(3)} د.ك</span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Single Service Button */
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
                    <span className="text-[10px] font-normal opacity-90">1 جلسات</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : !activeCategory ? (
          <div className="pt-2 animate-fadeIn">
            {/* Search Bar */}
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

            {/* Banner */}
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
                    {banners.map((banner, index) => (
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
                    {banners.map((_, index) => (
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

            {/* Categories */}
            <div className="px-6 mt-8">
              <h2 className="text-base font-bold text-app-text mb-4 text-center sm:text-right">الأقسام</h2>
              <div className="grid grid-cols-3 gap-4 pb-20">
                {brands.map((brand) => (
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
              <h2 className="text-base font-bold text-app-text font-alexandria truncate">
                {activeCategory}
              </h2>
            </div>
            <div className="px-6 grid grid-cols-2 gap-4">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavourite={favourites.includes(product.id)}
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
