import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type ApiCategory = {
    id: number;
    name_ar: string;
    name_en: string;
    image: string;
    position: number;
    is_active: boolean;
};

type ApiCategoriesResponse = {
    status: boolean;
    data: {
        data: ApiCategory[];
        meta?: any;
        links?: any;
    };
    message: string;
};

export function toastApi(status: boolean, message: string) {
    toast(message || (status ? "Success" : "Something went wrong"), {
        style: {
            background: status ? "#198754" : "#dc3545",
            color: "#fff",
            borderRadius: "10px",
        },
    });
}

export async function getCategoriesSimple(params: { lang: Locale; per_page: number }) {
    try {
        const res = await http.get<ApiCategoriesResponse>(`${DASHBOARD_API_BASE_URL}/categories`, {
            params: { per_page: params.per_page },
            headers: { lang: params.lang },
        });

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed to fetch categories" };
        }

        // ✅ response: data.data = array
        return { ok: true as const, data: res.data.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get categories error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
