import React from "react";
import { LayoutGrid, ChevronDown, Check } from "lucide-react";
import { Locale } from "../../../../services/i18n";

export default function AddonsCard({
    lang,
    t,
    expanded,
    onToggleExpanded,
    optionsLoading,
    options,
    selectedOptionIds,
    onToggleOption,
}: {
    lang: Locale;
    t: any;
    expanded: boolean;
    onToggleExpanded: () => void;
    optionsLoading: boolean;
    options: any[];
    selectedOptionIds: number[];
    onToggleOption: (id: number) => void;
}) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all">
            <div
                className="p-8 flex items-center justify-between cursor-pointer hover:bg-gray-50/30 transition-colors"
                onClick={onToggleExpanded}
            >
                <div className="flex items-center gap-3">
                    <LayoutGrid size={20} className="text-[#483383]" />
                    <h3 className="text-base font-semibold text-gray-900">{t.serviceAddons}</h3>
                    <span className="text-[10px] font-bold text-white bg-[#483383] px-2 py-0.5 rounded-lg ml-2">
                        {selectedOptionIds.length} Selected
                    </span>
                </div>

                <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                />
            </div>

            {expanded && (
                <div className="px-8 pb-8 pt-0 animate-fadeIn">
                    <div className="h-px w-full bg-gray-50 mb-6" />

                    {optionsLoading ? (
                        <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 font-semibold">
                                {lang === "ar" ? "جاري تحميل الخيارات..." : "Loading options..."}
                            </p>
                        </div>
                    ) : options.length === 0 ? (
                        <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-400 font-semibold">
                                {lang === "ar" ? "لا يوجد خيارات حالياً" : "No options available"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {options.map((opt) => {
                                const isSelected = selectedOptionIds.includes(opt.id);

                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => onToggleOption(opt.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected
                                                ? "border-[#483383] bg-violet-50"
                                                : "border-gray-100 bg-white hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${isSelected
                                                        ? "bg-[#483383] border-[#483383] text-white"
                                                        : "bg-gray-50 border-gray-200 text-transparent"
                                                    }`}
                                            >
                                                <Check size={14} strokeWidth={4} />
                                            </div>

                                            <div>
                                                <p
                                                    className={`text-sm font-bold ${isSelected ? "text-[#483383]" : "text-gray-900"
                                                        }`}
                                                >
                                                    {lang === "ar" ? opt.title_ar : opt.title_en}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-semibold uppercase">
                                                    {opt.values_count} {lang === "ar" ? "اختيارات" : "Options"}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${opt.is_required
                                                    ? "bg-red-100 text-red-600"
                                                    : "bg-gray-100 text-gray-400"
                                                }`}
                                        >
                                            {opt.is_required ? t.required : t.optional}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
