import { toast } from "sonner";
import { http } from "./http";

type FavoriteServiceApi = {
    id: number;
    type: string;
    name: string;
    description?: string;
    main_image?: string;
    price: number | string;
    discounted_price?: number | string | null;
    current_price?: number | string;
    has_discount?: boolean;
    is_favorite?: boolean;
    options?: any[];
    subscriptions?: any[];
};

type FavoritesResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: {
        services?: FavoriteServiceApi[];
        pagination?: any;
    };
};

export async function getFavoritesRequest(lang: string = "ar") {
    try {
        const res = await http.post<FavoritesResponse>(`/services/favorites`, {
            headers: { lang },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحميل المفضلة";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        const services = res?.data?.items?.services ?? [];
        return { ok: true as const, services };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get favorites error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}
