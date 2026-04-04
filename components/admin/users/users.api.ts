import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type ApiUser = {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    status: string | null;
    created_at: string; // "YYYY-MM-DD HH:mm:ss"
};

export type ApiPaginationLink = {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
};

export type ApiPaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: ApiPaginationLink[];
};

export type ApiPaginationLinks = {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
};

type ApiUsersResponse = {
    status: boolean;
    data: ApiUser[];
    links?: ApiPaginationLinks;
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        links: ApiPaginationLink[];
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
        const rawMeta = res.data.meta;

        let meta: ApiPaginationMeta | null = null;
        if (rawMeta) {
            meta = {
                current_page: rawMeta.current_page || 1,
                last_page: rawMeta.last_page || 1,
                total: rawMeta.total || 0,
                per_page: rawMeta.per_page || per_page,
                from: rawMeta.from ?? null,
                to: rawMeta.to ?? null,
                links: rawMeta.links || [],
            };
        }

        return { ok: true as const, data: users, meta };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get users error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
