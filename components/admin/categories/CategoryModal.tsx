import React from "react";
import { X } from "lucide-react";
import { Locale, translations } from "../../../services/i18n";
import { fileToDataUrl, resolveImageUrl, toastApi } from "./categories.api";

export type CategoryFormState = { name_ar: string; name_en: string; position: number; is_active: boolean; imageUrl: string; currentImage?: string; };

type Props = {
    lang: Locale;
    open: boolean;
    editingId: number | null;
    form: CategoryFormState;
    setForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
    saving: boolean;
    onClose: () => void;
    onSave: () => void;
};

export default function CategoryModal({
    lang,
    open,
    editingId,
    form,
    setForm,
    saving,
    onClose,
    onSave,
}: Props) {
    const t = translations[lang];
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{editingId ? t.edit : t.addCategory}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {t.categoryNameAr}
                        </label>
                        <input
                            type="text"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383]"
                            value={form.name_ar}
                            onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                            placeholder="مثال: العناية بالشعر"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {t.categoryNameEn}
                        </label>
                        <input
                            type="text"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383] text-left"
                            dir="ltr"
                            value={form.name_en}
                            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                            placeholder="e.g. Hair Care"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383]"
                                value={form.position}
                                onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Active</label>
                            <select
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383]"
                                value={form.is_active ? "1" : "0"}
                                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === "1" }))}
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>

                        {editingId && form.currentImage && !form.imageUrl && (
                            <div className="mb-3 flex items-center gap-3">
                                <img
                                    src={resolveImageUrl(form.currentImage)}
                                    className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100"
                                    alt="current"
                                />
                                <div className="text-xs text-gray-500">الصورة الحالية (اختياري تغييرها)</div>
                            </div>
                        )}

                        {form.imageUrl && (
                            <div className="mb-3 flex items-center gap-3">
                                <img
                                    src={form.imageUrl}
                                    className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100"
                                    alt="new"
                                />
                                <div className="text-xs text-gray-500">تم تحويل الصورة إلى URL نصّي</div>
                            </div>
                        )}

                        <input
                            type="text"
                            accept="image/*"
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#483383]"
                            value={form.imageUrl}
                            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 font-semibold text-gray-500 bg-gray-50 rounded-2xl"
                            disabled={saving}
                        >
                            {t.cancel}
                        </button>

                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex-1 py-4 font-semibold text-white bg-[#483383] rounded-2xl shadow-lg disabled:opacity-60"
                        >
                            {saving ? "جاري الحفظ..." : t.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
