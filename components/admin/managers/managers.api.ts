import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";
import { toast } from "sonner";

export type ApiAdmin = {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    photo: string;
    account_type: string;
    status: string; // "active" | "inactive" etc.
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    roles: string[];
    permissions: string[];
};

export type ApiAdminPagination = {
    current_page: number;
    total_pages: number;
    total_items: number;
    page_size: number;
};

type ApiAdminsResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        admins: ApiAdmin[];
        pagination: ApiAdminPagination;
    };
};

function toastApi(status: boolean, message: string) {
    toast(message || (status ? "Success" : "Something went wrong"), {
        style: {
            background: status ? "#198754" : "#dc3545",
            color: "#fff",
            borderRadius: "10px",
        },
    });
}

export async function getAdmins(params: { lang: Locale; page?: number; per_page?: number }) {
    try {
        const { lang, page = 1, per_page = 10 } = params;
        const res = await http.get<ApiAdminsResponse>(`${DASHBOARD_API_BASE_URL}/admins`, {
            params: { page, per_page },
            headers: { lang, "Accept-Language": lang, Accept: "application/json" },
        });

        // Don't toast on success for list fetches — avoids spam on page change
        if (!res?.data?.status) {
            toastApi(false, res?.data?.message || "Failed to fetch admins");
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        const admins: ApiAdmin[] = res.data.items?.admins ?? [];
        const pagination: ApiAdminPagination = res.data.items?.pagination ?? {
            current_page: 1,
            total_pages: 1,
            total_items: admins.length,
            page_size: per_page,
        };

        return { ok: true as const, data: admins, pagination };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get admins error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export type CreateAdminPayload = {
    name: string;
    username: string;
    email: string;
    password: string;
    account_type: "admin";
    role?: string; // role name from the roles list
};

type ApiSimpleResponse = {
    status: boolean;
    statusCode?: number;
    message: string;
    data?: any;
};

export async function createAdmin(payload: CreateAdminPayload, lang: Locale) {
    try {
        const formData = new FormData();
        formData.append("name", payload.name);
        formData.append("username", payload.username);
        formData.append("email", payload.email);
        formData.append("password", payload.password);
        formData.append("account_type", "admin");
        if (payload.role) {
            formData.append("role", payload.role);
        }

        const res = await http.post<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/admins`,
            formData,
            {
                headers: {
                    lang,
                    "Accept-Language": lang,
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Create failed" };
        }

        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "create admin error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function updateAdmin(id: number, payload: CreateAdminPayload, lang: Locale) {
    try {
        const formData = new FormData();
        formData.append("name", payload.name);
        formData.append("username", payload.username);
        formData.append("email", payload.email);
        if (payload.password.trim()) {
            formData.append("password", payload.password);
        }
        formData.append("account_type", "admin");
        if (payload.role) {
            formData.append("role", payload.role);
        }

        const res = await http.put<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/admins/${id}`,
            formData,
            {
                headers: {
                    lang,
                    "Accept-Language": lang,
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Update failed" };
        }

        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "update admin error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function deleteAdmin(id: number, lang: Locale) {
    try {
        const res = await http.delete<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/admins/${id}`,
            {
                headers: {
                    lang,
                    "Accept-Language": lang,
                    Accept: "application/json",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Delete failed" };
        }

        return { ok: true as const };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "delete admin error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
