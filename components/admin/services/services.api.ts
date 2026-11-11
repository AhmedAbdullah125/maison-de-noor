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
    /** The service's own payment switches; null = follows its category. */
    allow_pay_at_salon?: boolean | null;
    allow_pay_online?: boolean | null;
    uses_category_payment_options?: boolean;
    /** What the service actually allows after falling back to its category. */
    effective_allow_pay_at_salon?: boolean;
    effective_allow_pay_online?: boolean;
};

export type ApiServicesResponse = {
    data: ApiService[];
    meta?: { pagination?: { page: number; per_page: number; total: number; last_page: number; has_more: boolean } };
};

export type ApiServicesPagination = NonNullable<ApiServicesResponse["meta"]>["pagination"];

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
    category_id?: string;
}) {
    try {
        const res = await http.get<ApiServicesResponse>(
            `${DASHBOARD_API_BASE_URL}/v2/dashboard/services`,
            {
                params: {
                    per_page: params.per_page,
                    ...(params.page ? { page: params.page } : {}),
                    ...(params.category_id ? { category_id: params.category_id } : {}),
                },
                headers: { lang: params.lang },
            }
        );

        if (!Array.isArray(res?.data?.data)) {
            return { ok: false as const, error: (res.data as any)?.error?.message || "Failed" };
        }

        return {
            ok: true as const,
            data: res.data.data.map((service: any) => ({
                id: service.id,
                main_image: service.image?.url ?? null,
                price: service.price?.amount ?? "0",
                discounted_price: service.discounted_price?.amount ?? null,
                service_type: service.type,
                category_id: service.category_id,
                service_options_count: service.option_count,
                translations: service.translations,
                allow_pay_at_salon: service.allow_pay_at_salon ?? null,
                allow_pay_online: service.allow_pay_online ?? null,
                uses_category_payment_options: service.uses_category_payment_options ?? true,
                effective_allow_pay_at_salon: service.effective_allow_pay_at_salon ?? true,
                effective_allow_pay_online: service.effective_allow_pay_online ?? true,
            })),
            meta: res.data.meta,
        };
    } catch (e: any) {
        const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "get services error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

/**
 * PUT /services/:id with only the payment switches (other fields are left as they are).
 * Both null = follow the category; both booleans = override it.
 */
export async function updateServicePaymentOptions(
    id: number,
    input: { allow_pay_at_salon: boolean | null; allow_pay_online: boolean | null },
    lang: Locale
) {
    try {
        const fd = new FormData();
        fd.append("_method", "PUT");
        fd.append("allow_pay_at_salon", input.allow_pay_at_salon === null ? "" : input.allow_pay_at_salon ? "1" : "0");
        fd.append("allow_pay_online", input.allow_pay_online === null ? "" : input.allow_pay_online ? "1" : "0");

        const res = await http.post<any>(`${DASHBOARD_API_BASE_URL}/services/${id}`, fd, {
            headers: { lang, Accept: "application/json" },
        });

        const data = res?.data?.data;
        if (!res?.data?.status || !data) {
            const msg = res?.data?.message || "Update failed";
            toastApi(false, msg);
            return { ok: false as const, error: msg };
        }
        return {
            ok: true as const,
            data: {
                allow_pay_at_salon: data.allow_pay_at_salon ?? null,
                allow_pay_online: data.allow_pay_online ?? null,
                uses_category_payment_options: data.uses_category_payment_options ?? true,
                effective_allow_pay_at_salon: data.effective_allow_pay_at_salon ?? true,
                effective_allow_pay_online: data.effective_allow_pay_online ?? true,
            },
        };
    } catch (e: any) {
        const msg =
            e?.response?.data?.errors?.allow_pay_online?.[0] ||
            e?.response?.data?.message ||
            e?.message ||
            "Update payment options error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

/** ✅ DELETE /services/:id */
export async function deleteService(id: number, lang: Locale) {
    try {
        const token = localStorage.getItem("token");
        const res = await http.delete<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/services/${id}`,
            {
                headers: {
                    lang,
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Delete failed" };
        }
        return { ok: true as const, msg: res?.data?.message };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Delete service error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
