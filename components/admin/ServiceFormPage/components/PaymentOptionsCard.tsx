import React from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Locale } from "../../../../services/i18n";
import { Product } from "../../../../types";
import PaymentSwitch from "../../categories/PaymentSwitch";

type Pay = { salon: boolean; online: boolean };

export default function PaymentOptionsCard({
    lang,
    t,
    form,
    setForm,
    categories,
    effectivePay,
}: {
    lang: Locale;
    t: any;
    form: Partial<Product>;
    setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>;
    categories: any[];
    effectivePay: Pay | null;
}) {
    const f = form as any;
    const useCategory: boolean = f.use_category_payment !== false;

    const cat = categories.find((c: any) => c.id === f.category_id);
    // Category flags when known (missing flag = true); otherwise the saved effective values.
    const categoryPay: Pay = cat
        ? { salon: cat.allow_pay_at_salon ?? true, online: cat.allow_pay_online ?? true }
        : effectivePay ?? { salon: true, online: true };

    const shown: Pay = useCategory
        ? categoryPay
        : { salon: !!f.allow_pay_at_salon, online: !!f.allow_pay_online };

    const toggleUseCategory = () => {
        if (useCategory) {
            setForm((p) => ({
                ...p,
                use_category_payment: false,
                allow_pay_at_salon: categoryPay.salon,
                allow_pay_online: categoryPay.online,
            } as any));
        } else {
            setForm((p) => ({
                ...p,
                use_category_payment: true,
                allow_pay_at_salon: null,
                allow_pay_online: null,
            } as any));
        }
    };

    const toggle = (key: "allow_pay_at_salon" | "allow_pay_online") => {
        const next = {
            allow_pay_at_salon: !!f.allow_pay_at_salon,
            allow_pay_online: !!f.allow_pay_online,
        };
        next[key] = !next[key];
        if (!next.allow_pay_at_salon && !next.allow_pay_online) {
            toast(t.atLeastOnePaymentOption);
            return;
        }
        setForm((p) => ({ ...p, ...next } as any));
    };

    const rows = [
        { key: "allow_pay_at_salon" as const, label: t.payAtSalon, checked: shown.salon },
        { key: "allow_pay_online" as const, label: t.payOnline, checked: shown.online },
    ];

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-5">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-[#483383]" />
                {t.paymentOptions}
            </h3>

            <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700">
                <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#483383]"
                    checked={useCategory}
                    onChange={toggleUseCategory}
                />
                {t.useCategoryPaymentSettings}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rows.map((r) => (
                    <div
                        key={r.key}
                        className="flex items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl"
                    >
                        <span className="text-sm font-semibold text-gray-700">{r.label}</span>
                        <PaymentSwitch
                            lang={lang}
                            checked={r.checked}
                            disabled={useCategory}
                            onToggle={() => toggle(r.key)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
