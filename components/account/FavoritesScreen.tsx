import React, { useMemo } from "react";
import { Heart } from "lucide-react";
import AppHeader from "../AppHeader";
import ProductCard from "../ProductCard";
import { Product, ServiceAddon } from "../../types";
import { useGetFavorites } from "../services/useGetFavorites";

function mapFavoriteApiToProduct(s: any): Product {
    const current = s?.current_price ?? s?.price ?? 0;
    const old = s?.has_discount ? s?.price : null;

    return {
        id: s.id,
        type: s.type,
        name: s.name,
        description: s.description,
        image: s.main_image,
        images: s.main_image ? [s.main_image] : [],
        price: current,
        oldPrice: old,
        options: s.options ?? [],
        subscriptions: s.subscriptions ?? [],
        isFavorite: true,
    } as any;
}

export default function FavoritesScreen({
    onBack,
    onNavigateToHome,
    onBook,
    onOpenProduct,
    lang = "ar",
}: {
    onBack: () => void;
    onNavigateToHome: () => void;
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[]) => void;
    onOpenProduct: (id: number) => void;
    lang?: string;
}) {
    const favQuery = useGetFavorites(lang);

    const products: Product[] = useMemo(() => {
        const list = favQuery.data ?? [];
        return list.map(mapFavoriteApiToProduct);
    }, [favQuery.data]);

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
            <AppHeader title="الخدمات المفضلة" onBack={onBack} />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
                {/* Loading */}
                {favQuery.isLoading && (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-app-card/50 border-t-app-gold rounded-full animate-spin" />
                    </div>
                )}
                {favQuery.isError && !favQuery.isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-red-400 border border-app-card/30">
                            <Heart size={48} strokeWidth={1.5} className="text-red-400" />
                        </div>
                        <h2 className="text-lg font-bold text-app-text mb-2">حدث خطأ أثناء تحميل المفضلة</h2>
                        <button
                            onClick={() => favQuery.refetch()}
                            className="mt-4 w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                )}
                {!favQuery.isLoading && !favQuery.isError && products.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-app-gold/40 border border-app-card/30">
                            <Heart size={48} strokeWidth={1.5} className="text-app-gold" />
                        </div>
                        <h2 className="text-lg font-bold text-app-text mb-6">لا يوجد أي خدمات في المفضلة</h2>
                        <button onClick={onNavigateToHome} className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform">
                            تصفح الخدمات
                        </button>
                    </div>
                )}
                {!favQuery.isLoading && !favQuery.isError && products.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} isFavourite={true} onBook={onBook} onClick={() => onOpenProduct(product.id)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
