import React from "react";
import { AlertTriangle } from "lucide-react";
import { Locale } from "../../../../services/i18n";

export default function ExitPrompt({
    lang,
    open,
    onConfirm,
    onClose,
}: {
    lang: Locale;
    open: boolean;
    onConfirm: () => void;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-scaleIn text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle size={32} />
                </div>

                <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {lang === "ar" ? "تنبيه: تغييرات غير محفوظة" : "Unsaved Changes"}
                </h2>

                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    {lang === "ar"
                        ? "لديك تعديلات غير محفوظة. هل تريد الخروج بدون حفظ؟"
                        : "You have unsaved changes. Are you sure you want to leave without saving?"}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-4 bg-red-50 text-red-600 font-semibold rounded-2xl active:scale-95 transition-transform"
                    >
                        {lang === "ar" ? "نعم، خروج بدون حفظ" : "Yes, Leave without Saving"}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-50 text-gray-700 font-semibold rounded-2xl active:scale-95 transition-transform"
                    >
                        {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
}
