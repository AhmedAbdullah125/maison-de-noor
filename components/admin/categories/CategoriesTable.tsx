import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Brand } from "../../../types";
import { Locale, translations } from "../../../services/i18n";
import { resolveImageUrl } from "./categories.api";

type Props = {
    lang: Locale;
    rows: Brand[];
    servicesCountById: Map<number, number>;
    onEdit: (cat: Brand) => void;
    onDelete: (id: number) => void;
};

export default function CategoriesTable({ lang, rows, servicesCountById, onEdit, onDelete }: Props) {
    const t = translations[lang];

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-auto">
            <table className="w-full text-start">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                            {t.image}
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                            {t.name}
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-start">
                            {t.services}
                        </th>
                        <th
                            className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase ${lang === "ar" ? "text-start" : "text-end"
                                }`}
                        >
                            {t.actions}
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                    {rows.map((cat) => (
                        <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <img
                                    src={resolveImageUrl(cat.image)}
                                    className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                    alt={cat.name}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                            "data:image/svg+xml;charset=UTF-8," +
                                            encodeURIComponent(
                                                `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='12'>IMG</text></svg>`
                                            );
                                    }}
                                />
                            </td>

                            <td className="px-6 py-4 font-semibold text-gray-900">
                                <p>{cat.name}</p>
                                {cat.nameEn && <p className="text-xs text-gray-400 font-normal">{cat.nameEn}</p>}
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-500">
                                {servicesCountById.get(Number(cat.id)) ?? 0}
                            </td>

                            <td className={`px-6 py-4 ${lang === "ar" ? "text-start" : "text-end"}`}>
                                <div className={`flex items-center gap-2 ${lang === "ar" ? "justify-start" : "justify-end"}`}>
                                    <button
                                        onClick={() => onEdit(cat)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                        title={t.edit}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(Number(cat.id))}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title={t.delete}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                                {t.noResults ?? "لا توجد نتائج"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
