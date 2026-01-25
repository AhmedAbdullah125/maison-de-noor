'use client';

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import AppImage from "../AppImage";
import type { Brand } from "@/types";

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
};

export default function HomeLanding({
    isLoading,
    banners,
    categories,
    onCategoryClick,
    onBannerClick,
}: Props) {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
                <h2 className="text-lg font-bold text-app-text mb-4 text-center sm:text-right">الأقسام</h2>
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
                            <span className="mt-2 text-xs font-bold text-app-text text-center truncate w-full px-1">
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
