import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Locale } from "../../../services/i18n";

type Props = {
    lang: Locale;
    meta?: { current_page: number; last_page: number; total: number } | null;
    canPrev: boolean;
    canNext: boolean;
    onPrev: () => void;
    onNext: () => void;
};

export default function CategoriesPagination({ lang, meta, canPrev, canNext, onPrev, onNext }: Props) {
    if (!meta) return null;

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
                {lang === "ar" ? (
                    <span>
                        الصفحة {meta.current_page} من {meta.last_page} — الإجمالي {meta.total}
                    </span>
                ) : (
                    <span>
                        Page {meta.current_page} of {meta.last_page} — Total {meta.total}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    disabled={!canPrev}
                    onClick={onPrev}
                    className="px-4 py-2 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <ChevronLeft size={18} className={lang === "ar" ? "rotate-180" : ""} />
                    {lang === "ar" ? "السابق" : "Prev"}
                </button>

                <button
                    disabled={!canNext}
                    onClick={onNext}
                    className="px-4 py-2 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {lang === "ar" ? "التالي" : "Next"}
                    <ChevronRight size={18} className={lang === "ar" ? "rotate-180" : ""} />
                </button>
            </div>
        </div>
    );
}
