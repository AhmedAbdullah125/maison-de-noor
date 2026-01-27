import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type ApiServiceTranslation = {
    id: number;
    language: "ar" | "en";
    name: string;
    description: string;
};

export type ApiService = {
    id: number;
    main_image: string | null;
    price: string;
    discounted_price: string | null;
    service_type: string;
    category_id: number;
    service_options_count: number;
    translations: ApiServiceTranslation[];
};

export type ApiServicesResponse = {
    status: boolean;
    data: ApiService[];
    message: string;
};

export type ApiSimpleResponse = {
    status: boolean;
    message: string;
    data?: any;
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

export function pickTranslation(
    translations: ApiServiceTranslation[],
    lang: Locale
) {
    const wanted = lang === "ar" ? "ar" : "en";
    return (
        translations?.find((x) => x.language === wanted) ||
        translations?.[0] || { name: "", description: "" }
    );
}

export async function getServices(params: {
    lang: Locale;
    per_page: number;
    page?: number;
}) {
    try {
        const res = await http.get<ApiServicesResponse>(
            `${DASHBOARD_API_BASE_URL}/services`,
            {
                params: {
                    per_page: params.per_page,
                    ...(params.page ? { page: params.page } : {}),
                },
                headers: { lang: params.lang },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get services error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

/** ✅ DELETE /services/:id (عدّل المسار لو endpoint مختلف عندكم) */
export async function deleteService(id: number, lang: Locale) {
    try {
        const res = await http.delete<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/services/${id}`,
            { headers: { lang } }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Delete failed" };
        }
        return { ok: true as const };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Delete service error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
