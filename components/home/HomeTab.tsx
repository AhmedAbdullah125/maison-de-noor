import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Product, ServiceAddon, Brand, ServicePackageOption } from "@/types";
import { cacheService } from "../../services/cacheService";

import HomeHeader from "./HomeHeader";
import HomeDrawer from "./HomeDrawer";
import PackageConfirmModal from "./PackageConfirmModal";
import HomeLanding from "./HomeLanding";
import CategoryProductsView from "./CategoryProductsView";
import ProductDetailsView from "./ProductDetailsView";
import { useGetLookups } from "../services/useGetLookups";

// ✅ لو عندك API_BASE_URL/storage pattern مختلف غيّر هنا بس
const resolveImage = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    // حسب الريسبونس: image = "categories/xxx.png" أو "banners/xxx.png"
    return img;
};

interface HomeTabProps {
    onBook: (
        product: Product,
        quantity: number,
        selectedAddons?: ServiceAddon[],
        packageOption?: ServicePackageOption,
        customFinalPrice?: number
    ) => void;
    favourites: number[];
    onToggleFavourite: (productId: number) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ onBook, favourites, onToggleFavourite }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productId, categoryName } = useParams();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const lang = "ar";

    // ✅ lookups returns: { categories, banners, social_links, ... }
    const { data: lookups, isLoading: lookupsLoading, isError: lookupsError } = useGetLookups(lang);

    // addons selection state (for product details)
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

    // package confirm modal state
    const [pendingPackage, setPendingPackage] = useState<{ pkg: ServicePackageOption; price: number } | null>(null);

    // cached data (services + categories + banners)
    const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
    const [cachedBrands, setCachedBrands] = useState<Brand[]>([]);
    const [cachedBanners, setCachedBanners] = useState<{ id: number; image: string }[]>([]);
    const [isBannersLoading, setIsBannersLoading] = useState(true);

    // ✅ init from cache first (fast UI)
    useEffect(() => {
        const data = cacheService.getInitialData();
        setCachedProducts(data.services);
        setCachedBrands(data.categories);
        setCachedBanners(data.banners);

        if (data.banners.length > 0) setIsBannersLoading(false);
        else setTimeout(() => setIsBannersLoading(false), 1500);
    }, []);

    // ✅ when lookups arrive → replace categories + banners in UI
    useEffect(() => {
        if (!lookups) return;

        const brandsFromLookups: Brand[] = (lookups.categories ?? [])
            .filter((c: any) => c?.is_active === 1)
            .sort((a: any, b: any) => (a?.position ?? 0) - (b?.position ?? 0))
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                image: resolveImage(c.image),
            }));

        const bannersFromLookups = (lookups.banners ?? [])
            .filter((b: any) => b?.is_active === 1)
            .sort((a: any, b: any) => (a?.position ?? 0) - (b?.position ?? 0))
            .map((b: any) => ({
                id: b.id,
                image: resolveImage(b.image),
            }));

        // ✅ update state
        if (brandsFromLookups.length) setCachedBrands(brandsFromLookups);
        if (bannersFromLookups.length) setCachedBanners(bannersFromLookups);

        setIsBannersLoading(false);
    }, [lookups]);

    const selectedProduct = useMemo(() => {
        if (!productId) return null;
        return cachedProducts.find((p) => p.id === parseInt(productId)) || null;
    }, [productId, cachedProducts]);

    const activeCategory = useMemo(() => categoryName || null, [categoryName]);

    useEffect(() => {
        setSelectedAddonIds(new Set());
    }, [selectedProduct?.id]);

    const toggleMenu = () => setIsMenuOpen((v) => !v);

    const handleProductClick = (product: Product) => {
        let fromPath = "/";
        if (activeCategory) fromPath = `/category/${activeCategory}`;
        navigate(`/product/${product.id}`, { state: { from: fromPath } });
    };

    const handleBack = () => {
        if (selectedProduct) {
            const fromState = location.state as { from?: string } | undefined;
            if (fromState?.from) navigate(fromState.from);
            else navigate("/");
            return;
        }
        if (activeCategory) navigate("/");
    };

    const handleToggleAddon = (addonId: string) => {
        setSelectedAddonIds((prev) => {
            const next = new Set(prev);
            if (next.has(addonId)) next.delete(addonId);
            else next.add(addonId);
            return next;
        });
    };

    const handleGroupOptionSelect = (groupId: string, optionId: string, type: "single" | "multi") => {
        setSelectedAddonIds((prev) => {
            const next = new Set(prev);

            if (type === "single") {
                const group = selectedProduct?.addonGroups?.find((g) => g.id === groupId);
                if (group) group.options.forEach((opt) => next.delete(opt.id));
                next.add(optionId);
            } else {
                if (next.has(optionId)) next.delete(optionId);
                else next.add(optionId);
            }

            return next;
        });
    };

    const buildSelectedAddonsList = () => {
        const list: ServiceAddon[] = [];
        if (!selectedProduct) return list;

        if (selectedProduct.addons) list.push(...selectedProduct.addons.filter((a) => selectedAddonIds.has(a.id)));

        if (selectedProduct.addonGroups) {
            selectedProduct.addonGroups.forEach((group) => {
                list.push(...group.options.filter((a) => selectedAddonIds.has(a.id)));
            });
        }

        return list;
    };

    const validateRequiredGroups = (): boolean => {
        if (!selectedProduct?.addonGroups) return true;

        for (const group of selectedProduct.addonGroups) {
            if (group.required) {
                const hasSelection = group.options.some((opt) => selectedAddonIds.has(opt.id));
                if (!hasSelection) {
                    alert(`يرجى اختيار ${group.title_ar}`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleAddAction = (pkgOption?: ServicePackageOption, customPrice?: number) => {
        if (!selectedProduct) return;
        if (!validateRequiredGroups()) return;

        if (pkgOption && customPrice !== undefined) {
            setPendingPackage({ pkg: pkgOption, price: customPrice });
            return;
        }

        const addonsList = buildSelectedAddonsList();
        onBook(selectedProduct, 1, addonsList, pkgOption, customPrice);
    };

    const handleConfirmPackageBooking = () => {
        if (!selectedProduct || !pendingPackage) return;
        if (!validateRequiredGroups()) return;

        const addonsList = buildSelectedAddonsList();
        const { pkg, price } = pendingPackage;

        setPendingPackage(null);
        onBook(selectedProduct, 1, addonsList, pkg, price);
    };

    return (
        <div className="flex flex-col h-[100vh] bg-app-bg relative font-alexandria overflow-hidden">
            {/* Drawer (unchanged — uses services pagination) */}
            <HomeDrawer
                open={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(path) => {
                    navigate(path);
                    setIsMenuOpen(false);
                }}
                lang={lang}
            />

            {/* Package Confirm Modal */}
            <PackageConfirmModal
                open={!!pendingPackage}
                packageInfo={pendingPackage}
                onClose={() => setPendingPackage(null)}
                onConfirm={handleConfirmPackageBooking}
            />

            {/* Header */}
            <HomeHeader onMenuClick={toggleMenu} onTitleClick={() => navigate("/")} />

            {/* Content */}
            <main className="flex-1 overflow-y-auto w-full pb-28 pt-24">
                {selectedProduct ? (
                    <ProductDetailsView
                        product={selectedProduct}
                        selectedAddonIds={selectedAddonIds}
                        onBack={handleBack}
                        onToggleAddon={handleToggleAddon}
                        onGroupOptionSelect={handleGroupOptionSelect}
                        onBookNow={handleAddAction}
                    />
                ) : !activeCategory ? (
                    <HomeLanding
                        brands={cachedBrands}
                        banners={cachedBanners}
                        isBannersLoading={isBannersLoading || lookupsLoading}
                        lookupsError={!!lookupsError}
                        onBrandClick={(brandId) => navigate(`/brand/${brandId}`)}
                    />
                ) : (
                    <CategoryProductsView
                        title={activeCategory}
                        products={cachedProducts}
                        favourites={favourites}
                        onBack={handleBack}
                        onToggleFavourite={onToggleFavourite}
                        onBook={onBook}
                        onProductClick={handleProductClick}
                    />
                )}
            </main>
        </div>
    );
};

export default HomeTab;
