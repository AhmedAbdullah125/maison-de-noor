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
    services_count?: number;
};

export type ApiPaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type ApiCategoriesResponse = {
    status: boolean;
    data: { data: ApiCategory[]; meta: ApiPaginationMeta };
    message: string;
};

type ApiSimpleResponse = {
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

export function isFullUrl(s: string) {
    return /^https?:\/\//i.test(s) || /^data:/i.test(s);
}

export function resolveImageUrl(img: string) {
    if (!img) return "";
    if (isFullUrl(img)) return img;
    const base = DASHBOARD_API_BASE_URL;
    return `${base}${img.startsWith("/") ? "" : "/"}${img}`;
}

export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(file);
    });
}

export async function getCategories(params: {
    lang: Locale;
    page: number;
    per_page: number;
}) {
    try {
        const res = await http.get<ApiCategoriesResponse>(
            `${DASHBOARD_API_BASE_URL}/categories`,
            {
                params: {
                    page: params.page,
                    per_page: params.per_page,

                },
                headers: { lang: params.lang },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return { ok: true as const, data: res.data.data.data, meta: res.data.data.meta };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get categories error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function createCategory(
    input: {
        name_ar: string;
        name_en: string;
        position: number;
        is_active: boolean;
        imageUrl?: string;
    },
    lang: Locale
) {
    try {
        const fd = new FormData();
        fd.append("name_ar", input.name_ar);
        fd.append("name_en", input.name_en);
        fd.append("position", String(input.position));
        fd.append("is_active", String(input.is_active ? 1 : 0));
        fd.append("image", input.imageUrl || "");

        const res = await http.post<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/categories`,
            fd,
            {
                headers: {
                    lang,
                    Accept: "application/json",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || "Create failed" };

        const created: ApiCategory | undefined =
            res?.data?.data?.data ?? res?.data?.data ?? res?.data?.data?.item;

        return { ok: true as const, created };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Create category error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function updateCategoryPatch(
    id: number,
    input: {
        name_ar: string;
        name_en: string;
        position: number;
        is_active: boolean;
        imageUrl?: string;
    },
    lang: Locale
) {
    try {
        const fd = new FormData();
        fd.append("_method", "PATCH");
        fd.append("name_ar", input.name_ar);
        fd.append("name_en", input.name_en);
        fd.append("position", String(input.position));
        fd.append("is_active", String(input.is_active ? 1 : 0));
        if (input.imageUrl) fd.append("image", input.imageUrl);

        const res = await http.post<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/categories/${id}`,
            fd,
            {
                headers: {
                    lang,
                    Accept: "application/json",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || "Update failed" };

        const updated: ApiCategory | undefined =
            res?.data?.data?.data ?? res?.data?.data ?? res?.data?.data?.item;

        return { ok: true as const, updated };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Update category error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function deleteCategory(id: number, lang: Locale) {
    try {
        const res = await http.delete<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/categories/${id}`,
            { headers: { lang } }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) return { ok: false as const, error: res?.data?.message || "Delete failed" };
        return { ok: true as const };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Delete category error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
