// src/services/toggleFavorite.ts
import { toast } from "sonner";
import { http } from "./http";

export async function toggleFavoriteRequest(serviceId: number, lang: string = "ar") {
    try {
        const res = await http.post(`/services/toggle-favorite/${serviceId}`, null, {
            headers: { lang },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحديث المفضلة";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        // response: { status:true, ... }
        return { ok: true as const };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "toggle favorite error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}
