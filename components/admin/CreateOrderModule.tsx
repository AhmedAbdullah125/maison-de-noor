"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Search } from "lucide-react";
import { translations, Locale } from "../../services/i18n";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { toast } from "sonner";
import { http } from "../services/http";
import { getAccessToken } from "../auth/authStorage";


// ─── Types ────────────────────────────────────────────────────────────────────

interface OptionValue {
    id: number;
    title: string;
    option_id: number;
    price: string;
    is_default: number;
}

interface ServiceOption {
    id: number;
    title: string;
    is_required: number;
    is_multiple_choice: number;
    values: OptionValue[];
}

interface Subscription {
    id: number;
    name: string;
    session_count: number;
    fixed_price: string;
    price_per_session: string;
    validity_days: number;
}

interface Service {
    id: number;
    name: string;
    main_image: string;
    current_price: number;
    type: string;
    is_active: boolean;
    options: ServiceOption[];
    subscriptions: Subscription[];
}


// ─── API helpers ──────────────────────────────────────────────────────────────


async function fetchPublicServices(lang: Locale): Promise<Service[]> {
    try {
        const formData = new FormData();
        formData.append("page_size", "100");
        formData.append("page_number", "1");

        const token = getAccessToken();
        const headers: Record<string, string> = {
            "Accept-Language": lang,
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await http.post("/v1/services/index", formData, { headers });
        const data = res.data;
        if (data?.status && data?.items?.services) {
            return (data.items.services as Service[]).filter((s) => s.is_active);
        }
        return [];
    } catch {
        return [];
    }
}



async function createOrder(payload: object, lang: Locale) {
    try {
        const res = await http.post(
            `${DASHBOARD_API_BASE_URL}/admin/requests/store`,
            payload,
            { headers: { "Accept-Language": lang, Accept: "application/json" } }
        );
        return { ok: true as const, data: res.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Error creating order";
        return { ok: false as const, error: msg };
    }
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
    lang: Locale;
}

const CreateOrderModule: React.FC<Props> = ({ lang }) => {
    const t = translations[lang];

    // Services loading
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [search, setSearch] = useState("");

    // Step: "list" | "form"
    const [step, setStep] = useState<"list" | "form">("list");
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<
        { option_id: number; option_value_id: number }[]
    >([]);
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [paymentType, setPaymentType] = useState<"cash" | "knet" | "card">("cash");

    // Submit state
    const [submitting, setSubmitting] = useState(false);
    const [successResult, setSuccessResult] = useState<any>(null);

    // Load services on mount
    useEffect(() => {
        setLoadingServices(true);
        fetchPublicServices(lang).then((data) => {
            setServices(data);
            setLoadingServices(false);
        });
    }, [lang]);

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const handleSelectService = (svc: Service) => {
        setSelectedService(svc);
        setStep("form");
        // Reset form
        setName("");
        setPhone("");
        setSubscriptionId(null);
        setSelectedOptions([]);
        setStartDate("");
        setStartTime("");
        setPaymentType("cash");
        setSuccessResult(null);
    };

    const handleBack = () => {
        setStep("list");
        setSelectedService(null);
        setSuccessResult(null);
    };

    const handleToggleOptionValue = (optionId: number, valueId: number, isMultiple: boolean) => {
        setSelectedOptions((prev) => {
            const exists = prev.find(
                (o) => o.option_id === optionId && o.option_value_id === valueId
            );
            if (exists) {
                // Deselect
                return prev.filter(
                    (o) => !(o.option_id === optionId && o.option_value_id === valueId)
                );
            }
            if (!isMultiple) {
                // Single choice: replace existing for this option
                return [
                    ...prev.filter((o) => o.option_id !== optionId),
                    { option_id: optionId, option_value_id: valueId },
                ];
            }
            // Multi choice: add
            return [...prev, { option_id: optionId, option_value_id: valueId }];
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService) return;
        if (!name.trim() || !phone.trim() || !startDate || !startTime) {
            toast("Please fill in all required fields", {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
            return;
        }

        setSubmitting(true);

        const payload: any = {
            service_id: selectedService.id,
            name: name.trim(),
            phone: phone.trim(),
            start_date: startDate,
            start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
            payment_type: paymentType,
        };

        if (subscriptionId !== null) {
            payload.subscription_id = subscriptionId;
        }

        if (selectedOptions.length > 0) {
            payload.options = selectedOptions;
        }

        const res = await createOrder(payload, lang);
        setSubmitting(false);

        if (res.ok) {
            toast("✅ " + (t.orderCreated || "Order created!"), {
                style: { background: "#198754", color: "#fff", borderRadius: "10px" },
            });
            setSuccessResult(res.data);
        } else {
            toast("❌ " + res.error, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        }
    };

    // ─── Filtered services ──────────────────────────────────────────────────────

    const filteredServices = services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    // ─── Render ─────────────────────────────────────────────────────────────────

    if (loadingServices) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
                <Loader2 className="animate-spin" size={20} />
                <span>{t.loadingServices || "Loading services..."}</span>
            </div>
        );
    }

    // ── Step: list ───────────────────────────────────────────────────────────────
    if (step === "list") {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{t.createOrder}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{t.selectService}</p>
                    </div>
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`${t.service}...`}
                            className={`w-full ${lang === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 bg-white border border-gray-200 rounded-2xl outline-none text-sm`}
                        />
                        <Search
                            size={16}
                            className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-gray-400`}
                        />
                    </div>
                </div>

                {/* Service Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredServices.map((svc) => (
                        <button
                            key={svc.id}
                            onClick={() => handleSelectService(svc)}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#483383]/30 transition-all group text-start overflow-hidden"
                        >
                            <div className="aspect-square overflow-hidden bg-gray-50">
                                <img
                                    src={svc.main_image}
                                    alt={svc.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=S&background=483383&color=fff";
                                    }}
                                />
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                                    {svc.name}
                                </p>
                                <p className="text-xs text-[#483383] font-bold">
                                    {svc.current_price > 0 ? `${svc.current_price} KWD` : "—"}
                                </p>
                            </div>
                        </button>
                    ))}
                    {filteredServices.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                            {t.noContentYet}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Step: form ───────────────────────────────────────────────────────────────
    const svc = selectedService!;

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Back header */}
            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={16} />
                {t.backToServices || "Back to Services"}
            </button>

            {/* Selected service summary */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                    <img
                        src={svc.main_image}
                        alt={svc.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=S&background=483383&color=fff";
                        }}
                    />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                    {svc.current_price > 0 && (
                        <p className="text-xs text-[#483383] font-bold mt-0.5">{svc.current_price} KWD</p>
                    )}
                </div>
            </div>

            {/* Success state */}
            {successResult && (
                <div className="bg-green-50 border border-green-100 rounded-3xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check size={24} className="text-green-600" />
                    </div>
                    <p className="font-bold text-green-800 text-lg">{t.orderCreated}</p>
                    {(successResult?.data?.booking_number || successResult?.booking_number) && (
                        <p className="text-sm text-green-700 font-mono bg-green-100 px-3 py-1 rounded-full inline-block">
                            #{successResult?.data?.booking_number || successResult?.booking_number}
                        </p>
                    )}
                    <div className="flex gap-3 justify-center pt-2">
                        <button
                            onClick={handleBack}
                            className="px-5 py-2.5 rounded-2xl bg-[#483383] text-white text-sm font-semibold hover:bg-[#3a2870] transition-colors"
                        >
                            {t.backToServices}
                        </button>
                        <button
                            onClick={() => setSuccessResult(null)}
                            className="px-5 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {t.createOrder}
                        </button>
                    </div>
                </div>
            )}

            {/* Order form */}
            {!successResult && (
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Customer info */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">{t.customer}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                                    {t.customerName} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl outline-none text-sm focus:border-[#483383] transition-colors"
                                    placeholder={t.customerName}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                                    {t.customerPhone} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl outline-none text-sm focus:border-[#483383] transition-colors"
                                    placeholder="96XXXXXXXX"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <h3 className="text-sm font-bold text-gray-700">{t.selectSubscription}</h3>
                        {svc.subscriptions.length === 0 ? (
                            <p className="text-xs text-gray-400">{t.noSubscriptions}</p>
                        ) : (
                            <div className="space-y-2">
                                {/* none option */}
                                <label className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="subscription"
                                        value=""
                                        checked={subscriptionId === null}
                                        onChange={() => setSubscriptionId(null)}
                                        className="accent-[#483383]"
                                    />
                                    <span className="text-sm text-gray-500 font-medium">{t.noSubscriptions}</span>
                                </label>
                                {svc.subscriptions.map((sub) => (
                                    <label
                                        key={sub.id}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${subscriptionId === sub.id
                                            ? "border-[#483383]/40 bg-[#483383]/5"
                                            : "border-gray-100 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="subscription"
                                            value={sub.id}
                                            checked={subscriptionId === sub.id}
                                            onChange={() => setSubscriptionId(sub.id)}
                                            className="accent-[#483383]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{sub.name}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {sub.session_count} {t.sessions} · {sub.validity_days}d · {sub.fixed_price} KWD
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    {svc.options.length > 0 && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                            <h3 className="text-sm font-bold text-gray-700">{t.selectOptions}</h3>
                            {svc.options.map((opt) => (
                                <div key={opt.id} className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500">{opt.title}</p>
                                    <div className="space-y-1.5">
                                        {opt.values.map((val) => {
                                            const isChecked = selectedOptions.some(
                                                (o) => o.option_id === opt.id && o.option_value_id === val.id
                                            );
                                            return (
                                                <label
                                                    key={val.id}
                                                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${isChecked
                                                        ? "border-[#483383]/40 bg-[#483383]/5"
                                                        : "border-gray-100 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <input
                                                        type={opt.is_multiple_choice ? "checkbox" : "radio"}
                                                        name={`option-${opt.id}`}
                                                        checked={isChecked}
                                                        onChange={() =>
                                                            handleToggleOptionValue(opt.id, val.id, !!opt.is_multiple_choice)
                                                        }
                                                        className="accent-[#483383]"
                                                    />
                                                    <span className="text-sm text-gray-800 flex-1">{val.title}</span>
                                                    {parseFloat(val.price) > 0 && (
                                                        <span className="text-xs font-semibold text-[#483383]">
                                                            +{val.price} KWD
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Date & Time */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="text-sm font-bold text-gray-700">{t.schedule}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                                    {t.startDate} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl outline-none text-sm focus:border-[#483383] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                                    {t.startTime} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl outline-none text-sm focus:border-[#483383] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment type */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <h3 className="text-sm font-bold text-gray-700">{t.paymentType}</h3>
                        <div className="flex gap-2 flex-wrap">
                            {(["cash", "knet", "card"] as const).map((pt) => (
                                <button
                                    key={pt}
                                    type="button"
                                    onClick={() => setPaymentType(pt)}
                                    className={`px-5 py-2 rounded-2xl text-sm font-semibold border transition-colors ${paymentType === pt
                                        ? "bg-[#483383] text-white border-[#483383]"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    {(t as any)[pt] || pt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 bg-[#483383] hover:bg-[#3a2870] text-white font-bold rounded-2xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                {t.submitting}
                            </>
                        ) : (
                            t.submitOrder
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default CreateOrderModule;
