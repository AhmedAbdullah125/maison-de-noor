import React from "react";
import { ArrowLeft, Save, X, Loader2 } from "lucide-react";
import { Locale } from "../../../../services/i18n";

export default function PageHeader({
    lang,
    isEdit,
    id,
    t,
    onCancel,
    onSave,
    saving,
}: {
    lang: Locale;
    isEdit: boolean;
    id?: string;
    t: any;
    onCancel: () => void;
    onSave: () => void;
    saving?: boolean;
}) {
    const handleCancel = () => {
        if (isEdit) {
            localStorage.removeItem('editServiceData');
        }
        onCancel();
    };

    const handleSave = () => {
        if (isEdit) {
            localStorage.removeItem('editServiceData');
        }
        onSave();
    };

    return (
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={handleCancel}
                    className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#483383] hover:shadow-sm transition-all"
                >
                    <ArrowLeft size={20} className={lang === "ar" ? "rotate-180" : ""} />
                </button>

                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEdit ? t.edit : t.addService}
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
                        {isEdit ? `${t.service} ID: ${id}` : "Create new service offering"}
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-semibold text-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <X size={18} />
                    <span>{t.cancel}</span>
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-[#483383] text-white rounded-2xl font-semibold shadow-lg shadow-[#483383]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : t.save}</span>
                </button>
            </div>
        </header>
    );
}
