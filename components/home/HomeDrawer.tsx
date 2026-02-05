"use client";

import React from "react";
import { X, ChevronLeft, User, Video, ShoppingBag } from "lucide-react";
import type { Brand } from "@/types";

interface Props {
    open: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    lang: string;
    categories: Brand[];
    isLoading?: boolean;
}

export default function HomeDrawer({ open, onClose, onNavigate, lang = "ar", categories, isLoading = false }: Props) {
    if (!open) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="absolute right-0 top-0 bottom-0 w-3/4 max-w-[320px] bg-white shadow-2xl animate-slideLeftRtl flex flex-col fixed h-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex items-center justify-between border-b border-app-card/30 bg-white z-10">
                    <span className="text-base font-semibold text-app-text font-alexandria">الأقسام</span>
                    <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="px-6 py-4 text-sm text-app-textSec">جاري تحميل الأقسام...</div>
                        ) : categories.length === 0 ? (
                            <div className="px-6 py-4 text-sm text-app-textSec">لا توجد أقسام حالياً</div>
                        ) : (
                            categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-app-bg active:bg-app-card/50 transition-colors border-b border-app-card/10 group"
                                    onClick={() => {
                                        onNavigate(`/category/${cat.name}?id=${cat.id}`);
                                        onClose();
                                    }}
                                >
                                    <span className="text-sm font-normal text-app-text font-alexandria">{cat.name}</span>
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
                            className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <User size={18} />
                            <span>حسابي</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate("/technician/online");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl bg-app-gold text-white font-semibold text-xs sm:text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md shadow-app-gold/20"
                        >
                            <Video size={18} />
                            <span>حجز التكنك أونلاين ( المرة الأولى مجانا )</span>
                        </button>

                        <button
                            onClick={() => {
                                window.open("https://google.com", "_blank", "noreferrer");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold text-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
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
