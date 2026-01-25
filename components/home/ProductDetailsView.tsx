// src/components/home/ProductDetailsView.tsx
import React, { useMemo } from "react";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import ImageCarousel from "../ImageCarousel";
import { ServicePackageOption, Product } from "@/types";

type Props = {
    product: Product;
    selectedAddonIds: Set<string>;
    onBack: () => void;

    // legacy addons
    onToggleAddon: (addonId: string) => void;

    // grouped addons
    onGroupOptionSelect: (groupId: string, optionId: string, type: "single" | "multi") => void;

    // booking CTA (single or package)
    onBookNow: (pkgOption?: ServicePackageOption, customFinalPrice?: number) => void;
};

export default function ProductDetailsView({
    product,
    selectedAddonIds,
    onBack,
    onToggleAddon,
    onGroupOptionSelect,
    onBookNow,
}: Props) {
    const getProductImages = (p: Product) => {
        if (p.images && p.images.length > 0) return p.images;
        return [p.image];
    };

    const priceData = useMemo(() => {
        const base = parseFloat((product.price || "0").replace(/[^\d.]/g, ""));
        let addons = 0;

        // Legacy addons
        if (product.type === "addons" && product.addons) {
            product.addons.forEach((addon) => {
                if (selectedAddonIds.has(addon.id)) addons += addon.price_kwd;
            });
        }

        // Grouped addons
        if (product.addonGroups) {
            product.addonGroups.forEach((group) => {
                group.options.forEach((opt) => {
                    if (selectedAddonIds.has(opt.id)) addons += opt.price_kwd;
                });
            });
        }

        const total = base + addons;

        return {
            base,
            addons,
            total,
            display: `${total.toFixed(3)} د.ك`,
        };
    }, [product, selectedAddonIds]);

    return (
        <div className="animate-fadeIn pt-2">
            {/* Back */}
            <div className="px-6 mb-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex items-center gap-2"
                >
                    <ArrowRight size={20} />
                    <span className="text-sm font-medium">العودة</span>
                </button>
            </div>

            {/* Image Carousel */}
            <div className="px-6 mb-6">
                <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                    <ImageCarousel images={getProductImages(product)} alt={product.name} className="w-full h-full" />
                </div>
            </div>

            {/* Title & Price */}
            <div className="px-8 mb-4">
                <h2 className="text-2xl font-bold text-app-text font-alexandria leading-tight">{product.name}</h2>

                {/* Type Badge */}
                <div className="mt-2 mb-1 flex flex-wrap gap-2">
                    {product.type === "addons" && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
                            إضافات اختيارية
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-app-gold">{priceData.display}</span>
                        {product.oldPrice && (
                            <span className="text-sm text-app-textSec line-through opacity-60">{product.oldPrice}</span>
                        )}
                    </div>

                    {product.type === "addons" && priceData.addons > 0 && (
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

            {/* Legacy Addons (type addons + no addonGroups) */}
            {product.type === "addons" && product.addons && product.addons.length > 0 && !product.addonGroups && (
                <div className="px-6 mb-6">
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-app-text">إضافات الخدمة (اختياري)</h3>
                        <p className="text-[10px] text-app-textSec mt-0.5">اختاري الإضافات التي تناسبك وسيتم تحديث السعر تلقائياً</p>
                    </div>

                    <div className="space-y-3">
                        {product.addons.map((addon) => {
                            const isSelected = selectedAddonIds.has(addon.id);
                            return (
                                <div
                                    key={addon.id}
                                    onClick={() => onToggleAddon(addon.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${isSelected
                                        ? "bg-app-gold/5 border-app-gold shadow-sm"
                                        : "bg-white border-app-card/30 hover:border-app-card"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-app-gold border-app-gold" : "border-app-textSec/30"
                                                }`}
                                        >
                                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isSelected ? "text-app-gold" : "text-app-text"}`}>
                                                {addon.title_ar}
                                            </p>
                                            {addon.desc_ar && <p className="text-[10px] text-app-textSec">{addon.desc_ar}</p>}
                                        </div>
                                    </div>

                                    <span className="text-xs font-bold text-app-text">+{addon.price_kwd.toFixed(3)} د.ك</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Grouped Addons */}
            {product.addonGroups && product.addonGroups.length > 0 && (
                <div className="px-6 mb-6 space-y-6">
                    {product.addonGroups.map((group) => (
                        <div key={group.id}>
                            <div className="mb-3 flex items-center gap-2">
                                <h3 className="text-sm font-bold text-app-text">{group.title_ar}</h3>

                                {group.required && (
                                    <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-bold">
                                        مطلوب
                                    </span>
                                )}

                                {!group.required && group.type === "multi" && (
                                    <span className="text-[10px] text-app-textSec bg-app-bg px-2 py-0.5 rounded-md">
                                        اختياري (متعدد)
                                    </span>
                                )}

                                {!group.required && group.type === "single" && (
                                    <span className="text-[10px] text-app-textSec bg-app-bg px-2 py-0.5 rounded-md">اختياري</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {group.options.map((option) => {
                                    const isSelected = selectedAddonIds.has(option.id);
                                    const isRadio = group.type === "single";

                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => onGroupOptionSelect(group.id, option.id, group.type)}
                                            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected
                                                ? "bg-app-gold/5 border-app-gold shadow-sm"
                                                : "bg-white border-app-card/30 hover:border-app-card"
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
                                                    <p className={`text-sm font-bold ${isSelected ? "text-app-gold" : "text-app-text"}`}>
                                                        {option.title_ar}
                                                    </p>
                                                    {option.desc_ar && <p className="text-[10px] text-app-textSec">{option.desc_ar}</p>}
                                                </div>
                                            </div>

                                            <span className="text-xs font-bold text-app-text">+{option.price_kwd.toFixed(3)} د.ك</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Description */}
            <div className="px-8 mb-8">
                <h3 className="text-sm font-bold text-app-text mb-2">الوصف</h3>
                <p className="text-sm text-app-textSec leading-relaxed">
                    {product.description || "لا يوجد وصف متوفر لهذه الخدمة حالياً."}
                </p>
            </div>

            {/* Booking Buttons */}
            <div className="px-8 mb-10 space-y-3">
                {product.packageOptions && product.packageOptions.length > 0 ? (
                    <div className="space-y-4">
                        {product.packageOptions
                            .slice()
                            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                            .map((pkg) => {
                                const originalTotal = priceData.total * pkg.sessionsCount;
                                const discountAmount = originalTotal * ((pkg.discountPercent || 0) / 100);
                                const finalTotal = originalTotal - discountAmount;

                                return (
                                    <div key={pkg.id} className="w-full">
                                        {pkg.titleText && <p className="text-xs font-bold text-app-text mb-1.5 px-1">{pkg.titleText}</p>}

                                        <button
                                            onClick={() => onBookNow(pkg, finalTotal)}
                                            className="w-full bg-app-gold text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag size={18} />
                                                    <span className="text-base">حجز {pkg.sessionsCount} جلسات</span>
                                                </div>
                                                <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium">
                                                    {pkg.sessionsCount} جلسات
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold">{finalTotal.toFixed(3)} د.ك</span>
                                                <span className="text-[10px] line-through opacity-70">{originalTotal.toFixed(3)} د.ك</span>
                                                {(pkg.discountPercent || 0) > 0 && (
                                                    <span className="text-[9px] font-bold text-yellow-300 mt-0.5">
                                                        وفري {discountAmount.toFixed(3)} د.ك
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <button
                        onClick={() => onBookNow()}
                        className="w-full bg-app-gold text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-app-gold/30 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingBag size={20} />
                            <span>حجز جلسة</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">{priceData.total.toFixed(3)} د.ك</span>
                            <div className="h-6 w-[1px] bg-white/30"></div>
                            <span className="text-[10px] font-medium opacity-90">1 جلسات</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}