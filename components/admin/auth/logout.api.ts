import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { clearAuth } from "../../auth/authStorage";

export async function adminLogout() {
    try {
        // Call logout endpoint
        await http.post(`${DASHBOARD_API_BASE_URL}/auth/logout`, {}, {
            headers: {
                Accept: "application/json",
            },
        });

        // Clear all auth data
        clearAuth();
        localStorage.removeItem('salon_admin_session');

        return { ok: true as const };
    } catch (e: any) {
        // Even if API call fails, clear local data
        clearAuth();
        localStorage.removeItem('salon_admin_session');

        return { ok: false as const, error: e?.message || "Logout error" };
    }
}
