import React from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Locale } from "../../../../services/i18n";

export default function PageHeader({
    lang,
    isEdit,
    id,
    t,
    onCancel,
    onSave,
}: {
    lang: Locale;
    isEdit: boolean;
    id?: string;
    t: any;
    onCancel: () => void;
    onSave: () => void;
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
                    <h2 className="text-xl font-bold text-gray-900">
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
                    className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-semibold text-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                    <X size={18} />
                    <span>{t.cancel}</span>
                </button>

                <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-[#483383] text-white rounded-2xl font-semibold shadow-lg shadow-[#483383]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                    <Save size={18} />
                    <span>{t.save}</span>
                </button>
            </div>
        </header>
    );
}
