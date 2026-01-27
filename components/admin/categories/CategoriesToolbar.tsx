import React from "react";
import { Plus, Search } from "lucide-react";
import { Locale, translations } from "../../../services/i18n";

type Props = {
    lang: Locale;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onAdd: () => void;
};

export default function CategoriesToolbar({ lang, searchTerm, onSearchChange, onAdd }: Props) {
    const t = translations[lang];

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
                <input
                    type="text"
                    className={`w-full ${lang === "ar" ? "pr-11 pl-4" : "pl-11 pr-4"} py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#483383] transition-all`}
                    placeholder={t.searchCategories}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <Search
                    className={`absolute ${lang === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400`}
                    size={18}
                />
            </div>

            <button
                onClick={onAdd}
                className="bg-[#483383] text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-[#483383]/20"
            >
                <Plus size={20} />
                <span>{t.addCategory}</span>
            </button>
        </div>
    );
}
