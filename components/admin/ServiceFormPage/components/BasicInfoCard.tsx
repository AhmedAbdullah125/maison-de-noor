import React from "react";
import { Scissors, ChevronDown } from "lucide-react";
import { Locale } from "../../../../services/i18n";
import { Product } from "../../../../types";

export default function BasicInfoCard({
    lang,
    t,
    form,
    setForm,
    catsLoading,
    categories,
}: {
    lang: Locale;
    t: any;
    form: Partial<Product>;
    setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>;
    catsLoading: boolean;
    categories: any[];
}) {


    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
                <Scissors size={18} className="text-[#483383]" />
                Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* name ar */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t.serviceNameAr}
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                        value={form.name || ""}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="اسم الخدمة بالعربية"
                    />
                </div>

                {/* name en */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t.serviceNameEn}
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all text-left"
                        dir="ltr"
                        value={(form as any).nameEn || ""}
                        onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                        placeholder="Service Name (English)"
                    />
                </div>

                {/* price */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t.price} ({t.currency})
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                        value={String(form.price || "")}
                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    />
                </div>

                {/* duration */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t.duration}
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all"
                        value={String((form as any).duration || "")}
                        onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                    />
                </div>

                {/* Category Dropdown */}
                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t.category ?? (lang === "ar" ? "القسم" : "Category")}
                    </label>

                    <div className="relative">
                        <select
                            className={`w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none
                focus:ring-2 focus:ring-[#483383] transition-all appearance-none
                ${lang === "ar" ? "pr-4 pl-12" : "pl-4 pr-12"}`}
                            value={((form as any).category_id ?? "") as any}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    category_id: e.target.value ? Number(e.target.value) : undefined,
                                }))
                            }
                            disabled={catsLoading}
                        >
                            <option value="">
                                {catsLoading
                                    ? lang === "ar"
                                        ? "جاري تحميل الأقسام..."
                                        : "Loading categories..."
                                    : lang === "ar"
                                        ? "اختر القسم"
                                        : "Select category"}
                            </option>

                            {categories.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {lang === "ar" ? c.name_ar : c.name_en || c.name_ar}
                                </option>
                            ))}
                        </select>

                        <ChevronDown
                            size={18}
                            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none
                ${lang === "ar" ? "left-4" : "right-4"}`}
                        />
                    </div>

                    {!catsLoading && categories.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">
                            {lang === "ar" ? "لا يوجد أقسام متاحة حالياً" : "No categories available"}
                        </p>
                    )}
                </div>

                {/* description */}
                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t.description}
                    </label>
                    <textarea
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all h-32 resize-none"
                        value={String(form.description || "")}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                </div>
            </div>
        </div>
    );
}
