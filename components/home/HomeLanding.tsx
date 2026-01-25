import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Brand } from "../../types";
import AppImage from "../AppImage";

interface Props {
    brands: Brand[];
    banners: { id: number; image: string }[];
    isBannersLoading: boolean;
    lookupsError?: boolean;
    onBrandClick: (brandId: number) => void;
}

export default function HomeLanding({
    brands,
    banners,
    isBannersLoading,
    lookupsError,
    onBrandClick,
}: Props) {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // ✅ لو عدد البنرات اتغير، امنع out of range
    useEffect(() => {
        if (currentBanner > banners.length - 1) setCurrentBanner(0);
    }, [banners.length, currentBanner]);

    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const minSwipeDistance = 50;
    const onTouchStartH = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMoveH = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEndH = () => {
        if (!touchStart || !touchEnd || banners.length === 0) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) setCurrentBanner((prev) => (prev + 1) % banners.length);
        else if (distance < -minSwipeDistance) setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
    };

    return (
        <div className="pt-2 animate-fadeIn">
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

            <div className="px-6">
                {isBannersLoading ? (
                    <div className="w-full h-[200px] rounded-[2rem] bg-gray-200 animate-shimmer overflow-hidden shadow-md border border-app-card/20" />
                ) : banners.length === 0 ? (
                    <div className="w-full h-[200px] rounded-[2rem] bg-white shadow-md border border-app-card/20 flex items-center justify-center">
                        <span className="text-sm text-app-textSec font-alexandria">
                            {lookupsError ? "تعذر تحميل البنرات الآن" : "لا توجد بنرات حالياً"}
                        </span>
                    </div>
                ) : (
                    <div
                        className="relative w-full h-auto rounded-[2rem] overflow-hidden shadow-md bg-white border border-app-card/20"
                        onTouchStart={onTouchStartH}
                        onTouchMove={onTouchMoveH}
                        onTouchEnd={onTouchEndH}
                    >
                        <div
                            className="flex w-full h-auto transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(${currentBanner * 100}%)` }}
                        >
                            {banners.map((banner, index) => (
                                <div key={banner.id} className="min-w-full aspect-[3/2] h-auto flex items-center justify-center">
                                    <img
                                        src={banner.image}
                                        alt=""
                                        className="w-full h-full object-cover object-center block"
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
                                    className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === index ? "w-6 bg-app-gold" : "w-1.5 bg-app-gold/30"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 mt-8">
                <h2 className="text-lg font-bold text-app-text mb-4 text-center sm:text-right">الأقسام</h2>

                {brands.length === 0 && !isBannersLoading ? (
                    <div className="text-center text-app-textSec text-sm font-alexandria py-6">
                        {lookupsError ? "تعذر تحميل الأقسام الآن" : "لا توجد أقسام حالياً"}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4 pb-20">
                        {brands.map((brand) => (
                            <button
                                key={brand.id}
                                onClick={() => onBrandClick(brand.id)}
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
                )}
            </div>
        </div>
    );
}
