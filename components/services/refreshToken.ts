import axios from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";
import { getRefreshToken, getUser, clearAuth, setAuth } from "../auth/authStorage";

export async function refreshToken(lang: string) {
    const url = `${API_BASE_URL}/refresh-token`;

    const refresh_token = getRefreshToken();
    if (!refresh_token) return { ok: false as const, error: "No refresh token" };

    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refresh_token);
    formData.append("client_id", "a0ea590c-8f71-4350-8c2f-fbd97ec999a2");
    formData.append("client_secret", "VaCSOoD5GeOYi07vbhWlkWMobVvdeLDRmYYEXZf9");

    try {
        const res = await axios.post(url, formData, { headers: { lang } });

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Refresh failed" };
        }

        // ✅ حسب المثال بتاعك: items = { token_type, expires_in, access_token, refresh_token }
        const t = res?.data?.items;
        if (!t?.access_token || !t?.refresh_token) {
            return { ok: false as const, error: "Invalid refresh response" };
        }

        // غالباً السيرفر مش بيرجع user هنا، فهنحتفظ بالـ user الحالي
        const existingUser = getUser() || undefined;

        setAuth(
            {
                access_token: t.access_token,
                refresh_token: t.refresh_token,
                token_type: t.token_type,
                expires_in: t.expires_in,
            },
            existingUser
        );

        return { ok: true as const };
    } catch (e: any) {
        // لو refresh فشل يبقى logout
        clearAuth();
        return { ok: false as const, error: e?.response?.data?.message || e?.message || "Refresh error" };
    }
}
