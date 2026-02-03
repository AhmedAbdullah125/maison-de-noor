import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type ApiPermission = {
    id: number;
    name: string;
    category: string | null;
    parent_id: number;
    in_menu: number;
    icon: string | null;
    link: string | null;
    guard_name: string;
    created_at: string;
    updated_at: string;
    pivot?: {
        role_id: number;
        permission_id: number;
    };
};

export type ApiRole = {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    phone?: string; // optional, in case it's added later
    permissions?: ApiPermission[];
};

export type ApiPaginationMeta = {
    current_page: number;
    total_pages: number;
    total_items: number;
    page_size: number;
};

type ApiRolesResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        roles: ApiRole[];
        pagination: ApiPaginationMeta;
    };
};

type ApiRoleDetailsResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        role: ApiRole;
        permissions: ApiPermission[];
        rolePermissions: string[];
    };
};

type ApiSimpleResponse = {
    status: boolean;
    statusCode?: number;
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

export async function getRoles(lang: Locale, perPage: number = 200) {
    try {
        const res = await http.get<ApiRolesResponse>(
            `${DASHBOARD_API_BASE_URL}/roles`,
            {
                params: {
                    per_page: perPage,
                },
                headers: { "Accept-Language": lang, Accept: "application/json" },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return {
            ok: true as const,
            data: res.data.items.roles,
            meta: res.data.items.pagination,
        };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get roles error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function getRoleDetails(roleId: number, lang: Locale) {
    try {
        const res = await http.get<ApiRoleDetailsResponse>(
            `${DASHBOARD_API_BASE_URL}/roles/${roleId}`,
            {
                headers: { "Accept-Language": lang, Accept: "application/json" },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return {
            ok: true as const,
            role: res.data.items.role,
            permissions: res.data.items.permissions,
            rolePermissions: res.data.items.rolePermissions,
        };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get role details error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function getAllPermissions(lang: Locale) {
    try {
        const res = await http.get<{
            status: boolean;
            statusCode: number;
            message: string;
            items: {
                permissions: ApiPermission[];
            };
        }>(
            `${DASHBOARD_API_BASE_URL}/roles/permissions/all`,
            {
                headers: { "Accept-Language": lang, Accept: "application/json" },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return {
            ok: true as const,
            permissions: res.data.items.permissions,
        };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get permissions error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function createRole(
    name: string,
    permissions: string[],
    lang: Locale
) {
    try {
        const formData = new FormData();
        formData.append("name", name);

        // Add each permission as permission[]
        permissions.forEach((permission) => {
            formData.append("permission[]", permission);
        });

        const res = await http.post<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/roles`,
            formData,
            {
                headers: {
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
        const msg = e?.response?.data?.message || e?.message || "create role error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function updateRole(
    roleId: number,
    name: string,
    permissions: string[],
    lang: Locale
) {
    try {
        const formData = new FormData();
        formData.append("name", name);

        // Add each permission as permission[]
        permissions.forEach((permission) => {
            formData.append("permission[]", permission);
        });

        const res = await http.put<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/roles/${roleId}`,
            formData,
            {
                headers: {
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
        const msg = e?.response?.data?.message || e?.message || "update role error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function deleteRole(roleId: number, lang: Locale) {
    try {
        const res = await http.delete<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/roles/${roleId}`,
            {
                headers: {
                    "Accept-Language": lang,
                    Accept: "application/json",
                },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Delete failed" };
        }

        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "delete role error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
