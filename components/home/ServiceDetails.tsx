"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

import ImageCarousel from "../ImageCarousel";
import {
    Product,
    ServiceAddon,
    ServiceAddonGroup,
    ServicePackageOption,
    ServiceSubscription,
} from "../../types";
import { createRequest } from "../services/createRequest";

type Props = {
    product: Product;
    onBack: () => void;
    onCreated?: (data: any) => void;
};

function parsePrice(val: any): number {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const s = String(val);
    const n = parseFloat(s.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getNowTime() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

export default function ServiceDetails({ product, onBack, onCreated }: Props) {
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
    const [pendingPackage, setPendingPackage] = useState<{ pkg: ServicePackageOption; price: number } | null>(null);

    const [paymentType, setPaymentType] = useState<"cash" | "knet" | "wallet">("cash");
    const [startDate, setStartDate] = useState<string>(getTodayDate());
    const [startTime, setStartTime] = useState<string>(getNowTime());
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        setSelectedAddonIds(new Set());
        setPendingPackage(null);
    }, [product?.id]);

    const resolvedAddonGroups: ServiceAddonGroup[] = useMemo(() => {
        return product?.addonGroups ? [...product.addonGroups] : [];
    }, [product]);

    const basePrice = useMemo(() => {
        return parsePrice((product as any)?.price ?? (product as any)?.current_price ?? 0);
    }, [product]);

    const addonsTotal = useMemo(() => {
        let sum = 0;

        const legacyAddons: ServiceAddon[] = (product as any)?.addons ?? [];
        legacyAddons.forEach((a) => {
            if (selectedAddonIds.has(a.id)) sum += parsePrice((a as any).price_kwd ?? 0);
        });

        resolvedAddonGroups.forEach((g) => {
            g.options?.forEach((opt: any) => {
                if (selectedAddonIds.has(opt.id)) sum += parsePrice(opt.price_kwd ?? opt.price ?? 0);
            });
        });

        return sum;
    }, [product, resolvedAddonGroups, selectedAddonIds]);

    const total = useMemo(() => basePrice + addonsTotal, [basePrice, addonsTotal]);

    const priceData = useMemo(
        () => ({
            base: basePrice,
            addons: addonsTotal,
            total,
            display: `${total.toFixed(3)} د.ك`,
            duration: (product as any)?.duration || "0",
        }),
        [basePrice, addonsTotal, total, product]
    );

    const getImages = () => {
        const imgs = (product as any)?.images ?? [];
        if (Array.isArray(imgs) && imgs.length > 0) return imgs;
        const fallback = (product as any)?.image;
        return fallback ? [fallback] : [];
    };

    const handleGroupOptionSelect = (groupId: string, optionId: string, type: "single" | "multi") => {
        setSelectedAddonIds((prev) => {
            const next = new Set(prev);

            if (type === "single") {
                const group = resolvedAddonGroups.find((g) => g.id === groupId);
                group?.options?.forEach((opt) => next.delete(opt.id));
                next.add(optionId);
            } else {
                if (next.has(optionId)) next.delete(optionId);
                else next.add(optionId);
            }

            return next;
        });
    };

    const missingRequiredGroups = useMemo(() => {
        return resolvedAddonGroups
            .filter((g: any) => g?.required)
            .filter((g: any) => !(g.options ?? []).some((opt: any) => selectedAddonIds.has(opt.id)));
    }, [resolvedAddonGroups, selectedAddonIds]);

    const canSubscribe = useMemo(() => missingRequiredGroups.length === 0, [missingRequiredGroups]);

    const validateRequiredGroups = () => {
        if (missingRequiredGroups.length === 0) return true;
        toast(`يرجى اختيار ${missingRequiredGroups[0]?.title_ar}`, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
        return false;
    };

    const buildRequestOptions = () => {
        const out: { option_id: number; option_value_id: number }[] = [];

        resolvedAddonGroups.forEach((group: any) => {
            const selected = (group.options ?? []).filter((opt: any) => selectedAddonIds.has(opt.id));
            selected.forEach((opt: any) => {
                out.push({
                    option_id: Number(group.id),
                    option_value_id: Number(opt.id),
                });
            });
        });

        const legacyAddons: any[] = (product as any)?.addons ?? [];
        legacyAddons.forEach((a: any) => {
            if (selectedAddonIds.has(a.id)) {
                const optionId = Number(a.option_id ?? a.group_id ?? 0);
                const valueId = Number(a.option_value_id ?? a.id);
                if (optionId) out.push({ option_id: optionId, option_value_id: valueId });
            }
        });

        return out;
    };

    const doCreateRequest = async (subscriptionId?: number | null) => {
        if (creating) return;
        if (!validateRequiredGroups()) return;

        setCreating(true);

        const payload = {
            service_id: Number(product.id),
            subscription_id: subscriptionId ?? null,
            options: buildRequestOptions(),
            start_date: startDate,
            start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
            payment_type: paymentType,
        };

        const res = await createRequest(payload, "ar", "json");
        setCreating(false);

        if (!res.ok) return;

        toast("تم إنشاء الطلب بنجاح", { style: { background: "#198754", color: "#fff", borderRadius: "10px" } });
        onCreated?.(res.data);
    };

    const handleSubscriptionClick = (sub: ServiceSubscription) => {
        if (!validateRequiredGroups()) return;

        const sessionsCount = (sub as any).sessionsCount ?? (sub as any).session_count ?? 1;
        const pricePercent = parsePrice((sub as any).pricePercent ?? (sub as any).price_percentage ?? 100);
        const fixedPrice = parsePrice((sub as any).fixedPrice ?? (sub as any).fixed_price ?? 0);

        const originalTotal = priceData.total * sessionsCount;
        const computedFinal = originalTotal * (pricePercent / 100);
        const finalTotal = fixedPrice > 0 ? fixedPrice : computedFinal;

        const mappedPkg: ServicePackageOption = {
            id: String((sub as any).id),
            sessionsCount,
            discountPercent: Math.max(0, 100 - pricePercent),
            titleText: (sub as any).titleText ?? (sub as any).title ?? (sub as any).name ?? "",
            isEnabled: true,
            sortOrder: sessionsCount,
            validityDays: (sub as any).validityDays ?? (sub as any).validity_days ?? 30,
        };

        setPendingPackage({ pkg: mappedPkg, price: finalTotal });
    };

    const handleConfirmPackageBooking = async () => {
        if (!pendingPackage) return;
        const subId = Number(pendingPackage.pkg.id);
        setPendingPackage(null);
        await doCreateRequest(Number.isFinite(subId) ? subId : null);
    };

    return (
        <div className="animate-fadeIn pt-2">
            {pendingPackage && (
                <div
                    className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setPendingPackage(null)}
                >
                    <div
                        className="bg-white w-full max-w-[340px] rounded-[24px] p-6 shadow-2xl relative flex flex-col items-center text-center animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPendingPackage(null)}
                            className="absolute top-4 left-4 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors active:scale-95"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-lg font-bold text-app-text mb-6 mt-2">تأكيد الحجز</h2>

                        <div className="w-full space-y-3 mb-6">
                            <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                <span className="text-xs text-app-textSec font-medium">عدد الجلسات</span>
                                <span className="text-sm font-bold text-app-text">{pendingPackage.pkg.sessionsCount}</span>
                            </div>
                            <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                <span className="text-xs text-app-textSec font-medium">صلاحية الباكج</span>
                                <span className="text-sm font-bold text-app-text">{pendingPackage.pkg.validityDays || 30} يوم</span>
                            </div>
                        </div>

                        <p className="text-sm font-bold text-app-text leading-loose mb-6 px-1">
                            في حال الالتزام بعدد الجلسات ستحصلين على أروع النتائج بوقت قياسي و تختصري على نفسك الوقت و الجهد
                        </p>

                        <button
                            onClick={handleConfirmPackageBooking}
                            disabled={creating}
                            className="w-full bg-app-gold text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform disabled:opacity-60"
                        >
                            {creating ? "جاري الحجز..." : "الحجز الآن"}
                        </button>
                    </div>
                </div>
            )}

            <div className="px-6 mb-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex items-center gap-2"
                >
                    <ArrowRight size={20} />
                    <span className="text-sm font-medium">العودة</span>
                </button>
            </div>

            <div className="px-6 mb-6">
                <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                    <ImageCarousel images={getImages()} alt={product.name} className="w-full h-full" />
                </div>
            </div>

            <div className="px-8 mb-4">
                <h2 className="text-2xl font-bold text-app-text font-alexandria leading-tight">{product.name}</h2>

                <div className="mt-2 mb-1 flex flex-wrap gap-2">
                    {resolvedAddonGroups.length > 0 && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">إضافات اختيارية</span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-app-gold">{priceData.display}</span>
                        {(product as any).oldPrice && (
                            <span className="text-sm text-app-textSec line-through opacity-60">{(product as any).oldPrice}</span>
                        )}
                    </div>

                    {priceData.addons > 0 && (
                        <div className="text-[10px] text-app-textSec font-medium space-y-0.5">
                            <div className="flex items-center gap-1">
                                <span>السعر الأساسي:</span>
                                <span>{priceData.base.toFixed(3)} د.ك</span>
                            </div>
                            <div className="flex items-center gap-1 text-app-gold">
                                <span>الإضافات:</span>
                                <span>+{priceData.addons.toFixed(3)} د.ك</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-8 mb-6 grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-app-card/30 p-3">
                    <label className="block text-[11px] font-bold text-app-text mb-2">التاريخ</label>
                    <input
                        type="date"
                        className="w-full bg-app-bg rounded-xl p-3 text-sm outline-none border border-app-card/30 focus:border-app-gold"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-2xl border border-app-card/30 p-3">
                    <label className="block text-[11px] font-bold text-app-text mb-2">الوقت</label>
                    <input
                        type="time"
                        className="w-full bg-app-bg rounded-xl p-3 text-sm outline-none border border-app-card/30 focus:border-app-gold"
                        value={startTime.slice(0, 5)}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-2xl border border-app-card/30 p-3 col-span-2">
                    <label className="block text-[11px] font-bold text-app-text mb-2">طريقة الدفع</label>
                    <div className="flex gap-2">
                        {(["cash", "knet", "wallet"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPaymentType(p)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${paymentType === p ? "bg-app-gold text-white border-app-gold" : "bg-app-bg text-app-text border-app-card/30"
                                    }`}
                            >
                                {p === "cash" ? "كاش" : p === "knet" ? "كي نت" : "المحفظة"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {resolvedAddonGroups.length > 0 && (
                <div className="px-6 mb-6 space-y-6">
                    {resolvedAddonGroups.map((group) => (
                        <div key={group.id}>
                            <div className="mb-3 flex items-center gap-2">
                                <h3 className="text-sm font-bold text-app-text">{group.title_ar}</h3>
                                {group.required && (
                                    <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-bold">مطلوب</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {(group.options ?? []).map((option: any) => {
                                    const isSelected = selectedAddonIds.has(option.id);
                                    const isRadio = group.type === "single";

                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => handleGroupOptionSelect(group.id, option.id, group.type)}
                                            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected ? "bg-app-gold/5 border-app-gold shadow-sm" : "bg-white border-app-card/30 hover:border-app-card"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isRadio ? (
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-app-gold" : "border-app-textSec/30"
                                                            }`}
                                                    >
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-app-gold border-app-gold" : "border-app-textSec/30"
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                )}

                                                <div>
                                                    <p className={`text-sm font-bold ${isSelected ? "text-app-gold" : "text-app-text"}`}>{option.title_ar}</p>
                                                    {option.desc_ar && <p className="text-[10px] text-app-textSec">{option.desc_ar}</p>}
                                                </div>
                                            </div>

                                            <span className="text-xs font-bold text-app-text">
                                                +{parsePrice(option.price_kwd ?? option.price ?? 0).toFixed(3)} د.ك
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!canSubscribe && (
                <div className="px-8 mb-4">
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3 text-[12px] font-bold">
                        يرجى اختيار الخيارات المطلوبة أولاً
                    </div>
                </div>
            )}

            <div className="px-8 mb-10 space-y-3">
                {product.subscriptions && product.subscriptions.length > 0 ? (
                    <div className="space-y-4">
                        {product.subscriptions.map((sub: any) => {
                            const sessionsCount = sub.sessionsCount ?? sub.session_count ?? 1;
                            const fixedPrice = parsePrice(sub.fixedPrice ?? sub.fixed_price ?? 0);
                            const pricePercent = parsePrice(sub.pricePercent ?? sub.price_percentage ?? 100);

                            const originalTotal = priceData.total * sessionsCount;
                            const computedFinal = originalTotal * (pricePercent / 100);
                            const finalTotal = fixedPrice > 0 ? fixedPrice : computedFinal;

                            return (
                                <div key={sub.id} className="w-full">
                                    {sub.titleText || sub.title || sub.name ? (
                                        <p className="text-xs font-bold text-app-text mb-1.5 px-1">{sub.titleText || sub.title || sub.name}</p>
                                    ) : null}

                                    <button
                                        onClick={() => handleSubscriptionClick(sub)}
                                        disabled={creating || !canSubscribe}
                                        className="w-full bg-app-gold text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag size={18} />
                                                <span className="text-base">حجز {sessionsCount} جلسات</span>
                                            </div>
                                            <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium">{sessionsCount} جلسات</div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold">{finalTotal.toFixed(3)} د.ك</span>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <button
                        onClick={() => doCreateRequest(null)}
                        disabled={creating || !canSubscribe}
                        className="w-full bg-app-gold text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-app-gold/30 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingBag size={20} />
                            <span>{creating ? "جاري الحجز..." : "حجز جلسة"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">{priceData.total.toFixed(3)} د.ك</span>
                            <div className="h-6 w-[1px] bg-white/30" />
                            <span className="text-[10px] font-medium opacity-90">1 جلسة</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
