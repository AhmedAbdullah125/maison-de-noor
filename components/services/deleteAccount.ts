// src/services/deleteAccount.ts
import { toast } from "sonner";
import { http } from "./http";

export async function deleteAccountRequest(lang: string = "ar") {
    try {
        const res = await http.post(
            "/soft-delete",
            null,
            { headers: { lang } } // http.ts already attaches Authorization Bearer
        );

        // حسب اللي ارسلته: status: true, items: null
        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل حذف الحساب";
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
            return { ok: false as const, error: msg };
        }

        toast("تم حذف الحساب بنجاح", {
            style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
        });

        return { ok: true as const };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Delete account error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
        return { ok: false as const, error: msg };
    }
}
