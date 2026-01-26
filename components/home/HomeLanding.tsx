'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import AppImage from "../AppImage";
import type { Brand } from "@/types";
import { useNavigate } from "react-router-dom";
import { useGetServices } from "../services/useGetServices";

type BannerUI = {
    id: number;
    image: string;
    title?: string;
    url?: string;
};

type Props = {
    isLoading: boolean;
    banners: BannerUI[];
    categories: Brand[];
    onCategoryClick: (id: number) => void;
    onBannerClick?: (banner: BannerUI) => void;
    lang?: string; // ✅ add if you have it
};

export default function HomeLanding({
    isLoading,
    banners,
    categories,
    onCategoryClick,
    onBannerClick,
    lang = "ar",
}: Props) {
    const navigate = useNavigate();

    // Banner slider
    const [currentBanner, setCurrentBanner] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // ✅ Search
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [showResults, setShowResults] = useState(false);

    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // debounce
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
        return () => clearTimeout(t);
    }, [query]);

    // call API only when user types
    const shouldSearch = debouncedQuery.length >= 2;

    // ⚠️ adjust signature to match your hook:
    // if your hook is (lang, page, search) use:
    const servicesQuery = useGetServices(lang, 1, shouldSearch ? debouncedQuery : "");
    const services = servicesQuery?.data?.items?.services ?? [];

    const results = useMemo(() => {
        if (!shouldSearch) return [];
        // لو السيرفر بيرجع already filtered، ممكن تسيبها كده
        // ولو بيرجع list كبيرة، اعمل filter client-side:
        return services.slice(0, 8);
    }, [services, shouldSearch]);

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const onSelectService = (id: number) => {
        setShowResults(false);
        setQuery("");
        setDebouncedQuery("");
        navigate(`/product/${id}`);
    };

    // autoplay
    useEffect(() => {
        if (isLoading) return;
        if (!banners || banners.length === 0) return;

        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 4000);

        return () => clearInterval(timer);
    }, [banners?.length, isLoading]);

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

        if (banners.length === 0) return;

        if (isLeftSwipe) setCurrentBanner((prev) => (prev + 1) % banners.length);
        if (isRightSwipe) setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
    };

    return (
        <div className="pt-2 animate-fadeIn">
            {/* Search Bar + Results */}
            <div className="px-6 mb-6" ref={wrapperRef}>
                <div className="relative w-full">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={() => {
                            if (query.trim().length > 0) setShowResults(true);
                        }}
                        placeholder="بحث عن خدمة"
                        className="w-full bg-white border border-app-card rounded-full py-3.5 pr-6 pl-12 text-right focus:outline-none focus:border-app-gold shadow-sm font-alexandria text-sm"
                    />

                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec" size={20} />

                    {query.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setDebouncedQuery("");
                                setShowResults(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-app-bg active:scale-95 transition"
                            aria-label="clear"
                        >
                            <X size={16} className="text-app-textSec" />
                        </button>
                    )}

                    {/* Dropdown */}
                    {showResults && (
                        <div className="absolute z-50 mt-2 w-full bg-white rounded-[1.5rem] shadow-lg border border-app-card/30 overflow-hidden">
                            {/* states */}
                            {!shouldSearch && (
                                <div className="p-4 text-sm text-app-textSec text-right">
                                    اكتب حرفين أو أكثر للبحث
                                </div>
                            )}

                            {shouldSearch && servicesQuery.isLoading && (
                                <div className="p-4 text-sm text-app-textSec text-right">
                                    جاري البحث...
                                </div>
                            )}

                            {shouldSearch && !servicesQuery.isLoading && results.length === 0 && (
                                <div className="p-4 text-sm text-app-textSec text-right">
                                    لا توجد نتائج
                                </div>
                            )}

                            {/* results */}
                            {results.length > 0 && (
                                <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                                    {results.map((s: any) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => onSelectService(s.id)}
                                            className="w-full flex items-center gap-3 p-3.5 hover:bg-app-bg active:bg-app-bg transition text-right"
                                        >
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-app-bg border border-app-card/20 flex-shrink-0">
                                                <img
                                                    src={s.main_image}
                                                    alt={s.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-app-text truncate">
                                                    {s.name}
                                                </div>
                                                <div className="text-[11px] text-app-textSec truncate">
                                                    {s.category?.name ? `قسم: ${s.category.name}` : s.description}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-semibold text-app-gold">
                                                    {s.current_price} د.ك
                                                </span>
                                                {s.has_discount && (
                                                    <span className="text-[10px] text-app-textSec line-through">
                                                        {s.price} د.ك
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Banner */}
            <div className="px-6">
                {isLoading ? (
                    <div className="w-full h-[200px] rounded-[2rem] bg-gray-200 animate-shimmer overflow-hidden shadow-md border border-app-card/20" />
                ) : (
                    <div
                        className="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden shadow-md bg-white border border-app-card/20"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="flex w-full h-full transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(${currentBanner * 100}%)` }}
                        >
                            {banners.map((banner, index) => (
                                <button
                                    key={banner.id}
                                    className="min-w-full h-full flex items-center justify-center"
                                    onClick={() => onBannerClick?.(banner)}
                                    type="button"
                                >
                                    <img
                                        src={banner.image}
                                        alt={banner.title || ""}
                                        className="w-full h-full object-cover object-center block"
                                        loading={index === 0 ? "eager" : "lazy"}
                                        fetchPriority={index === 0 ? "high" : "auto"}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            {banners.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === index ? "w-6 bg-app-gold" : "w-1.5 bg-app-gold/30"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Categories */}
            <div className="px-6 mt-8">
                <h2 className="text-base font-semibold text-app-text mb-4 text-center sm:text-right">الأقسام</h2>
                <div className="grid grid-cols-3 gap-4 pb-20">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryClick(cat.id)}
                            className="flex flex-col items-center group active:scale-[0.98] transition-transform"
                        >
                            <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-white shadow-sm border border-app-card/30 group-hover:shadow-md transition-all">
                                <AppImage
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                            <span className="mt-2 text-xs font-semibold text-app-text text-center truncate w-full px-1">
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
