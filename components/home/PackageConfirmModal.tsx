// src/components/home/PackageConfirmModal.tsx
import React from "react";
import { X } from "lucide-react";

interface Props {
    open: boolean;
    packageInfo: { pkg: { sessionsCount: number; validityDays?: number }; price: number } | null;
    onClose: () => void;
    onConfirm: () => void;
}

export default function PackageConfirmModal({ open, packageInfo, onClose, onConfirm }: Props) {
    if (!open || !packageInfo) return null;

    return (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="bg-white w-full max-w-[340px] rounded-[24px] p-6 shadow-2xl relative flex flex-col items-center text-center animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors active:scale-95"
                >
                    <X size={20} />
                </button>

                <h2 className="text-lg font-bold text-app-text mb-6 mt-2">تأكيد الحجز</h2>

                <div className="w-full space-y-3 mb-6">
                    <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                        <span className="text-xs text-app-textSec font-medium">عدد الجلسات</span>
                        <span className="text-sm font-bold text-app-text">{packageInfo.pkg.sessionsCount}</span>
                    </div>
                    <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                        <span className="text-xs text-app-textSec font-medium">صلاحية الباكج</span>
                        <span className="text-sm font-bold text-app-text">{packageInfo.pkg.validityDays || 30} يوم</span>
                    </div>
                </div>

                <p className="text-sm font-bold text-app-text leading-loose mb-8 px-1">
                    في حال الالتزام بعدد الجلسات ستحصلين على أروع النتائج بوقت قياسي و تختصري على نفسك الوقت و الجهد
                </p>

                <button
                    onClick={onConfirm}
                    className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
                >
                    الحجز الآن
                </button>
            </div>
        </div>
    );
}
