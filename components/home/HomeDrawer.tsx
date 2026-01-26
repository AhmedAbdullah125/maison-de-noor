"use client";

import React, { useMemo, useEffect } from "react";
import { X, ChevronLeft, User, Video, ShoppingBag } from "lucide-react";
import { useGetServices } from "../services/useGetServices";

interface Props {
    open: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    lang: string;
}

export default function HomeDrawer({ open, onClose, onNavigate, lang = "ar" }: Props) {
    const { data, isLoading, isFetching, isError, error } = useGetServices(lang, 1);

    const unauthorized = (error as any)?.isUnauthorized === true;

    useEffect(() => {
        if (unauthorized) {
            onClose();
            onNavigate("/login");
        }
    }, [unauthorized, onClose, onNavigate]);

    // ✅ Extract unique categories from services response (safe default)
    const categories = useMemo(() => {
        const services = data?.items?.services ?? [];
        const map = new Map<number, any>();

        for (const s of services) {
            const c = s?.category;
            if (!c?.id) continue;
            if (!map.has(c.id)) map.set(c.id, c);
        }

        return Array.from(map.values()).sort(
            (a, b) => (a.position ?? 9999) - (b.position ?? 9999)
        );
    }, [data]);

    // ✅ after hooks
    if (!open) return null;
    if (unauthorized) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="absolute right-0 top-0 bottom-0 w-3/4 max-w-[320px] bg-white shadow-2xl animate-slideLeftRtl flex flex-col fixed h-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex items-center justify-between border-b border-app-card/30 bg-white z-10">
                    <span className="text-lg font-bold text-app-text font-alexandria">الأقسام</span>
                    <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">
                    <div className="flex-1">
                        {isLoading || isFetching ? (
                            <div className="px-6 py-4 text-sm text-app-textSec">جاري تحميل الأقسام...</div>
                        ) : isError ? (
                            <div className="px-6 py-4 text-sm text-red-500">حدث خطأ أثناء تحميل الأقسام</div>
                        ) : categories.length === 0 ? (
                            <div className="px-6 py-4 text-sm text-app-textSec">لا توجد أقسام حالياً</div>
                        ) : (
                            categories.map((cat: any) => (
                                <button
                                    key={cat.id}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-app-bg active:bg-app-card/50 transition-colors border-b border-app-card/10 group"
                                    onClick={() => {
                                        onNavigate(`/category/${cat.name}?id=${cat.id}`);
                                        onClose();
                                    }}
                                >
                                    <span className="text-sm font-medium text-app-text font-alexandria">{cat.name}</span>
                                    <ChevronLeft size={18} className="text-app-gold opacity-50 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))
                        )}
                    </div>

                    <div className="px-6 mt-6 space-y-3">
                        <button
                            onClick={() => {
                                onNavigate("/account");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <User size={18} />
                            <span>حسابي</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate("/technician/online");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl bg-app-gold text-white font-bold text-xs sm:text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md shadow-app-gold/20"
                        >
                            <Video size={18} />
                            <span>حجز التكنك أونلاين ( المرة الأولى مجانا )</span>
                        </button>

                        <button
                            onClick={() => {
                                window.open("https://google.com", "_blank", "noreferrer");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <ShoppingBag size={18} />
                            <span>شراء منتجات ترندي هير</span>
                        </button>
                    </div>
                </div>

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
    );
}
