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

type ApiUsersResponse = {
    status: boolean;
    data: ApiUser[];
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

export async function getUsers(lang: Locale) {
    try {
        const res = await http.get<ApiUsersResponse>(`${DASHBOARD_API_BASE_URL}/users`, {
            headers: { lang, Accept: "application/json" },
        });

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get users error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
