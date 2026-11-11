import React from "react";
import { Loader2 } from "lucide-react";
import { Locale } from "../../../services/i18n";

type Props = {
    lang: Locale;
    checked: boolean;
    saving?: boolean;
    disabled?: boolean;
    onToggle: () => void;
    title?: string;
};

export default function PaymentSwitch({ lang, checked, saving, disabled, onToggle, title }: Props) {
    if (saving) return <Loader2 size={22} className="animate-spin text-[#483383]" />;

    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onToggle}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-60 ${checked ? "bg-[#483383]" : "bg-gray-200"}`}
        >
            <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${lang === "ar"
                    ? (checked ? "right-1" : "right-7")
                    : (checked ? "left-7" : "left-1")
                    }`}
            />
        </button>
    );
}
