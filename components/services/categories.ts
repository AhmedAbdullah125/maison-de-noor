// services/categories.ts
import { http } from "../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import type { Locale } from "../../services/i18n";

type CreateCategoryInput = {
    name_ar: string;
    name_en: string;
    position: number;
    is_active: boolean;
    imageFile?: File | null;   // ✅ file upload
    imageUrl?: string;         // ✅ optional fallback (لو API بتقبل url كنص)
};

export async function createCategory(input: CreateCategoryInput, lang: Locale) {
    try {
        const fd = new FormData();
        fd.append("name_ar", input.name_ar);
        fd.append("name_en", input.name_en);
        fd.append("position", String(input.position));
        fd.append("is_active", input.is_active ? "1" : "0");

        // ✅ لو فيه File ارفعه
        if (input.imageFile) {
            fd.append("image", input.imageFile);
        } else if (input.imageUrl) {
            // ✅ لو الـ backend بيسمح url كنص
            fd.append("image", input.imageUrl);
        }

        const res = await http.post(`${DASHBOARD_API_BASE_URL}/categories`, fd, {
            headers: {
                lang,
                // سيبها كده أو احذفها؛ axios غالباً يضبط boundary تلقائياً
                "Content-Type": "multipart/form-data",
            },
        });

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Create category failed" };
        }
        return { ok: true as const, data: res.data };
    } catch (e: any) {
        return { ok: false as const, error: e?.response?.data?.message || e?.message || "Create category error" };
    }
}
