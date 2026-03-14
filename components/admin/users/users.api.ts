import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type ApiUser = {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    status: string | null; // null in sample
    created_at: string; // "2026-01-29 10:45:50"
};

export type ApiPaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type ApiUsersResponse = {
    status: boolean;
    data: ApiUser[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
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

export async function getUsers(params: { lang: Locale; page: number; per_page: number }) {
    try {
        const { lang, page, per_page } = params;
        const res = await http.get<ApiUsersResponse>(`${DASHBOARD_API_BASE_URL}/users`, {
            params: { page, per_page },
            headers: { lang, Accept: "application/json" },
        });

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        const users: ApiUser[] = res.data.data || [];
        const pagination = res.data.pagination;

        let meta: ApiPaginationMeta | null = null;
        if (pagination) {
            meta = {
                current_page: pagination.current_page || 1,
                last_page: pagination.last_page || 1,
                total: pagination.total || 0,
                per_page: pagination.per_page || per_page,
                from: null,
                to: null
            };
        }

        return { ok: true as const, data: users, meta };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get users error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
