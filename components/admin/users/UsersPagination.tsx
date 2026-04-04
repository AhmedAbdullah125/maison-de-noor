import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Locale } from "../../../services/i18n";
import { ApiPaginationMeta } from "./users.api";

type Props = {
    lang: Locale;
    meta: ApiPaginationMeta | null;
    canPrev: boolean;
    canNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onGoTo: (page: number) => void;
};

export default function UsersPagination({
    lang,
    meta,
    canPrev,
    canNext,
    onPrev,
    onNext,
    onGoTo,
}: Props) {
    if (!meta) return null;

    // Filter links: skip the first (prev arrow) and last (next arrow) items
    // which are labeled with HTML entities — keep only numbered / ellipsis pages
    const pageLinks = meta.links.slice(1, meta.links.length - 1);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3">
            {/* Summary */}
            <div className="text-xs text-gray-500 shrink-0">
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

            {/* Page buttons */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
                {/* Prev */}
                <button
                    disabled={!canPrev}
                    onClick={onPrev}
                    className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label={lang === "ar" ? "السابق" : "Previous"}
                >
                    <ChevronLeft size={16} className={lang === "ar" ? "rotate-180" : ""} />
                </button>

                {/* Number / ellipsis buttons */}
                {pageLinks.map((link, idx) => {
                    const isEllipsis = link.page === null;

                    if (isEllipsis) {
                        return (
                            <span
                                key={`ellipsis-${idx}`}
                                className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
                            >
                                …
                            </span>
                        );
                    }

                    return (
                        <button
                            key={link.page}
                            onClick={() => link.page !== null && onGoTo(link.page)}
                            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors border
                                ${link.active
                                    ? "bg-[#483383] text-white border-[#483383] shadow-sm"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            aria-current={link.active ? "page" : undefined}
                        >
                            {link.label}
                        </button>
                    );
                })}

                {/* Next */}
                <button
                    disabled={!canNext}
                    onClick={onNext}
                    className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label={lang === "ar" ? "التالي" : "Next"}
                >
                    <ChevronRight size={16} className={lang === "ar" ? "rotate-180" : ""} />
                </button>
            </div>
        </div>
    );
}
