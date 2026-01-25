'use client';

import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import AppHeader from "../AppHeader";
import AppImage from "../AppImage";
import HomeDrawer from "./HomeDrawer";
import { useHomeData } from "./useHomeData";
import type { Product, ServiceAddon, ServicePackageOption } from "@/types";
import { Menu } from "lucide-react";
import HomeLanding from "./HomeLanding";
import CategoryServicesGrid from "./CategoryServicesGrid";
import ServiceDetails from "./ServiceDetails";

type Props = {
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[], packageOption?: ServicePackageOption, customFinalPrice?: number) => void;
    favourites: number[];
    onToggleFavourite: (productId: number) => void;
};

export default function HomeTab({ onBook, favourites, onToggleFavourite }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { productId, categoryName } = useParams();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const lang = "ar"; // خليه من state/localStorage زي عندك
    const { categories, banners, products, isLoading } = useHomeData(lang, 1);

    const selectedProduct = useMemo(() => {
        if (!productId) return null;
        return products.find((p) => p.id === Number(productId)) ?? null;
    }, [productId, products]);

    const activeCategory = categoryName || null;

    return (
        <div className="flex flex-col h-[100vh] bg-app-bg relative font-alexandria overflow-hidden">
            <HomeDrawer
                open={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                categories={categories}
                onNavigate={(path) => navigate(path)}
            />

            <AppHeader
                actionStart={
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 text-app-text hover:bg-app-card rounded-full transition-colors flex-shrink-0"
                    >
                        <Menu size={24} />
                    </button>
                }
                title={
                    <div className="flex items-center justify-center gap-2 px-2 cursor-pointer w-full" onClick={() => navigate("/")}>
                        <AppImage src="https://raiyansoft.com/wp-content/uploads/2025/12/fav.png" alt="Mezo Do Noor logo" className="h-7 w-7 object-contain" />
                        <span className="text-xl font-bold text-app-text font-alexandria truncate">ميزو دو نور</span>
                    </div>
                }
            />

            <main className="flex-1 overflow-y-auto w-full pb-28 pt-24">
                {selectedProduct ? (
                    <ServiceDetails
                        product={selectedProduct}
                        onBook={onBook}
                        onBack={() => {
                            const fromState = location.state as { from?: string } | undefined;
                            navigate(fromState?.from || "/");
                        }}
                    />
                ) : !activeCategory ? (
                    <HomeLanding
                        isLoading={isLoading}
                        banners={banners}
                        categories={categories}
                        onCategoryClick={(id) => navigate(`/brand/${id}`)}
                    />
                ) : (
                    <CategoryServicesGrid
                        title={activeCategory}
                        products={products /* هنا فلتر حسب categoryName لو محتاج */}
                        favourites={favourites}
                        onToggleFavourite={onToggleFavourite}
                        onBook={onBook}
                        onBack={() => navigate("/")}
                        onProductClick={(p) => navigate(`/product/${p.id}`, { state: { from: `/category/${activeCategory}` } })}
                    />
                )}
            </main>
        </div>
    );
}
