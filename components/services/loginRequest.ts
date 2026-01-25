import axios from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";
import { toast } from "sonner";
import { setAuth } from "../auth/authStorage";

type LoginPayload = { phone: string; password: string };

export async function loginRequest(
  data: LoginPayload,
  setLoading: (v: boolean) => void,
  lang: string
) {
  setLoading(true);

  const url = `${API_BASE_URL}/login`;
  const formData = new FormData();
  formData.append("phone", data.phone);
  formData.append("password", data.password);
  formData.append("client_id", "a0ebbcdd-f4d7-4b9b-9ac0-752d55d6d2be");
  formData.append("client_secret", "ZsifN3q9uKXTLPDIIUnMVFQVAFP7umZ7pGCc8VUF");
  formData.append("grant_type", "password");

  const headers = { lang };

  try {
    const response = await axios.post(url, formData, { headers });
    const message = response?.data?.message;

    setLoading(false);

    if (!response?.data?.status) {
      toast(message || "Login failed", {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
      return { ok: false as const, error: message || "Login failed" };
    }

    const tokenData = response?.data?.items?.token;
    const userData = response?.data?.items?.user;

    if (!tokenData?.access_token || !tokenData?.refresh_token) {
      toast(message || "Invalid token response", {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
      return { ok: false as const, error: "Invalid token response" };
    }

    setAuth(
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
      },
      userData
    );

    toast(message || "Success", {
      style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
      description: userData?.name ? `مرحباً ${userData.name}` : undefined,
    });

    return { ok: true as const, user: userData };
  } catch (error: any) {
    setLoading(false);
    const errorMessage = error?.response?.data?.message || error?.message || "Error";
    toast(errorMessage, {
      style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
    });
    return { ok: false as const, error: errorMessage };
  }
}
