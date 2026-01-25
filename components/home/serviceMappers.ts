import type { Brand, Product, ServiceAddonGroup, ServiceSubscription, } from "@/types";

// غيّرها حسب مشروعك (مثلاً: https://maison-de-noor.com/storage/)
const STORAGE_BASE = "https://maison-de-noor.com/storage/";

function resolveAsset(path?: string) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${STORAGE_BASE}${path.replace(/^\/+/, "")}`;
}

export function mapLookupsToUI(items: any) {
    const categories: Brand[] = (items?.categories ?? [])
        .filter((c: any) => c?.is_active)
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((c: any) => ({
            id: c.id,
            name: c.name,
            image: resolveAsset(c.image),
        }));

    const banners = (items?.banners ?? [])
        .filter((b: any) => b?.is_active)
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((b: any) => ({
            id: b.id,
            image: resolveAsset(b.image),
            title: b.title,
            url: b.url,
        }));

    const socialLinks = (items?.social_links ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        link: s.link,
        icon: resolveAsset(s.icon),
    }));

    return { categories, banners, socialLinks };
}

function mapOptionsToAddonGroups(options: any[]): ServiceAddonGroup[] {
    return (options ?? [])
        .filter((o) => o?.is_active)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((opt) => ({
            id: String(opt.id),
            title_ar: opt.title,
            required: !!opt.is_required,
            type: opt.is_multiple_choice ? "multi" : "single",
            options: (opt.values ?? [])
                .filter((v: any) => v?.is_active)
                .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((v: any) => ({
                    id: String(v.id),
                    title_ar: v.title,
                    desc_ar: "",
                    price_kwd: Number(v.price ?? 0),
                    is_active: true,
                })),
        }));
}

function mapSubscriptions(subs: any[]): ServiceSubscription[] {
    return (subs ?? [])
        .filter((s) => s?.is_active)
        .map((s) => ({
            id: s.id,
            title: s.name,
            sessionsCount: Number(s.session_count ?? 1),
            pricePercent: Number(s.price_percentage ?? 100),
            validityDays: Number(s.validity_days ?? 30),
        }));
}

export function mapServicesToProducts(services: any[]): Product[] {
    return (services ?? [])
        .filter((s) => s?.is_active)
        .map((s) => {
            const price = Number(s.current_price ?? s.price ?? 0);

            return {
                id: s.id,
                name: s.name,
                description: s.description,
                image: resolveAsset(s.main_image),
                images: [resolveAsset(s.main_image)],
                price: `${price.toFixed(3)} د.ك`,
                oldPrice: s.has_discount ? `${Number(s.price ?? 0).toFixed(3)} د.ك` : undefined,

                // ✅ أهم حاجة: نخليها compatible مع UI بتاعك
                addonGroups: mapOptionsToAddonGroups(s.options ?? []),
                subscriptions: mapSubscriptions(s.subscriptions ?? []),

                // لو عندك fields تانية في Product خليها هنا…
            } as Product;
        });
}
