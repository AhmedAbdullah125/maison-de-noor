import React, { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import AppHeader from "../AppHeader";
import { Product, ServiceAddon } from "../../types";

export default function ProductDetailsScreen({
    product,
    onBack,
    onBook,
}: {
    product: Product | null;
    onBack: () => void;
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[]) => void;
}) {
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

    const priceData = useMemo(() => {
        if (!product) return { base: 0, addons: 0, total: 0 };

        const base = parseFloat(product.price.replace(/[^\d.]/g, ""));
        let addons = 0;

        if (product.addons) {
            product.addons.forEach((addon) => {
                if (selectedAddonIds.has(addon.id)) addons += addon.price_kwd;
            });
        }

        if (product.addonGroups) {
            product.addonGroups.forEach((group) => {
                group.options.forEach((option) => {
                    if (selectedAddonIds.has(option.id)) addons += option.price_kwd;
                });
            });
        }

        return { base, addons, total: base + addons };
    }, [product, selectedAddonIds]);

    const handleAddAction = () => {
        if (!product) return;

        const selectedAddonsList: ServiceAddon[] = [];
        if (product.addons) {
            selectedAddonsList.push(...product.addons.filter((a) => selectedAddonIds.has(a.id)));
        }
        if (product.addonGroups) {
            product.addonGroups.forEach((group) => {
                selectedAddonsList.push(...group.options.filter((a) => selectedAddonIds.has(a.id)));
            });
        }

        onBook(product, 1, selectedAddonsList);
    };

    if (!product) return null;

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg">
            <AppHeader title="تفاصيل الخدمة" onBack={onBack} />
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
                <div className="mb-10 space-y-3">
                    <button
                        onClick={handleAddAction}
                        className="w-full bg-app-gold active:bg-app-goldDark text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-gold/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <ShoppingBag size={20} />
                        <span>
                            حجز جلسة {priceData.total > priceData.base ? `(${priceData.total.toFixed(3)} د.ك)` : ""}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
