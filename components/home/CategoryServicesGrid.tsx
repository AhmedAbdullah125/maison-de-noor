'use client';

import React, { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import ProductCard from "../ProductCard";
import type { Product, ServiceAddon, ServicePackageOption } from "@/types";
import { useGetService } from "../services/useGetService";
import { useSearchParams } from "react-router-dom";

type Props = {
    title: string;
    products: Product[]; // هنسيبه موجود عشان ما نكسرش أي مكان بيناديه
    favourites: number[];
    onToggleFavourite: (productId: number) => void;

    onBook: (
        product: Product,
        quantity: number,
        selectedAddons?: ServiceAddon[],
        packageOption?: ServicePackageOption,
        customFinalPrice?: number
    ) => void;

    onBack: () => void;
    onProductClick: (product: Product) => void;

    categoryId?: number;     // ✅ هنستخدمها كـ serviceId
    categoryName?: string;   // optional
};

export default function CategoryServicesGrid({
    title,
    products,
    favourites,
    onToggleFavourite,
    onBook,
    onBack,
    onProductClick,
    categoryId,
    categoryName,
}: Props) {
    const [searchParams] = useSearchParams();

    // ✅ اعتبر categoryId هو الـ serviceId اللي جاي من HomeDrawer (?id=...)
    const serviceId = Number(searchParams.get("id"));
    const {
        data: service,
        isLoading,
        isFetching,
        isError,
    } = useGetService("ar", serviceId); // لو عندك lang في صفحة أعلى ومش عايز تثبيت "ar" قولي

    // ✅ خريطة بسيطة لتحويل service response إلى Product مناسب لـ ProductCard
    const mappedFromService: Product[] = useMemo(() => {
        if (!service) return [];

        const currentPrice =
            typeof service.current_price === "number"
                ? service.current_price
                : Number(service.current_price ?? service.price ?? 0);

        const oldPrice =
            service.has_discount && service.price
                ? `${Number(service.price).toFixed(3)} د.ك`
                : undefined;

        const mapped: any = {
            id: service.id,
            name: service.name,
            description: service.description,
            image: service.main_image,
            images: service.main_image ? [service.main_image] : [],
            price: `${Number(currentPrice).toFixed(3)} د.ك`,
            oldPrice,
            duration: service.duration ? String(service.duration) : undefined,
            category: service.category,

            // (اختياري) لو عندك UI بتستخدم addons/options/subscriptions في تفاصيل المنتج
            // هنسيبهم زي ما هما لو موجودين في الـ Product type عندك
            options: service.options ?? [],
            subscriptions: service.subscriptions ?? [],
            isFavorite: !!service.is_favorite,
        };

        return [mapped as Product];
    }, [service]);

    // ✅ fallback: لو مفيش serviceId (مثلاً فتح الصفحة من مكان تاني)، استخدم الفلترة القديمة
    const fallbackFiltered = useMemo(() => {
        if (serviceId) return [];
        if (categoryId) return products.filter((p: any) => p?.category?.id === categoryId);
        if (categoryName) return products.filter((p: any) => (p?.category?.name || "").includes(categoryName));
        return products;
    }, [products, categoryId, categoryName, serviceId]);

    const listToRender = serviceId ? mappedFromService : fallbackFiltered;

    return (
        <div className="animate-fadeIn pt-2">
            <div className="px-6 mb-6 flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors"
                >
                    <ArrowRight size={20} />
                </button>
                <h2 className="text-base font-semibold text-app-text font-amiri truncate">{title}</h2>
            </div>

            {/* حالات التحميل/الخطأ فقط لما يكون فيه serviceId */}
            {serviceId && (isLoading || isFetching) ? (
                <div className="px-6 text-sm text-app-textSec">جاري تحميل...</div>
            ) : null}

            {serviceId && isError && !(isLoading || isFetching) ? (
                <div className="px-6 text-sm text-red-500">حدث خطأ أثناء تحميل البيانات</div>
            ) : null}

            <div className="px-6 grid grid-cols-2 gap-4 pb-10">
                {listToRender.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isFavourite={favourites.includes(product.id)}
                        onBook={onBook}
                        onClick={onProductClick}
                    />
                ))}
            </div>
        </div>
    );
}
