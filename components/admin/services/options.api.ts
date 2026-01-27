import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type ApiOptionTranslation = {
    id: number;
    option_id: number;
    language: "ar" | "en";
    title: string;
};

export type ApiOptionValueTranslation = {
    id: number;
    option_value_id: number;
    language: "ar" | "en";
    name: string;
    description: string | null;
};

export type ApiOptionValue = {
    id: number;
    option_id: number;
    price: string;
    is_default: number;
    sort_order: number;
    is_active: number;
    translations: ApiOptionValueTranslation[];
};

export type ApiOption = {
    id: number;
    is_required: number;
    is_multiple_choice: number;
    sort_order: number;
    is_active: number;
    translations: ApiOptionTranslation[];
    values: ApiOptionValue[];
};

export type ApiPaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type ApiOptionsResponse = {
    status: boolean;
    data: { data: ApiOption[]; meta: ApiPaginationMeta };
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

export async function getOptions(params: { lang: Locale; page: number; per_page: number }) {
    try {
        const res = await http.get<ApiOptionsResponse>(`${DASHBOARD_API_BASE_URL}/options`, {
            params: { page: params.page, per_page: params.per_page },
            headers: { lang: params.lang },
        });

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || "Failed" };

        return { ok: true as const, data: res.data.data.data, meta: res.data.data.meta };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get options error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
