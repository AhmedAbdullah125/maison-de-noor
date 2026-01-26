import { toast } from "sonner";
import { http } from "./http";

export type CreateRequestPayload = {
    service_id: number;
    subscription_id?: number | null;
    options?: { option_id: number; option_value_id: number }[];
    start_date: string;   // YYYY-MM-DD
    start_time: string;   // HH:mm:ss
    payment_type: "cash" | "knet" | "wallet" | string;
};

type CreateRequestResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: any;
};

function toFormData(payload: CreateRequestPayload) {
    const fd = new FormData();
    fd.append("service_id", String(payload.service_id));
    if (payload.subscription_id != null) fd.append("subscription_id", String(payload.subscription_id));
    fd.append("start_date", payload.start_date);
    fd.append("start_time", payload.start_time);
    fd.append("payment_type", payload.payment_type);

    (payload.options ?? []).forEach((opt, idx) => {
        fd.append(`options[${idx}][option_id]`, String(opt.option_id));
        fd.append(`options[${idx}][option_value_id]`, String(opt.option_value_id));
    });

    return fd;
}

export async function createRequest(
    payload: CreateRequestPayload,
    lang: string = "ar",
    mode: "json" | "form" = "json"
) {
    try {
        const body = mode === "form" ? toFormData(payload) : payload;

        const res = await http.post<CreateRequestResponse>(
            `/requests/create`,
            body,
            {
                headers: {
                    lang,
                    ...(mode === "form" ? { "Content-Type": "multipart/form-data" } : {}),
                },
            }
        );

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل إنشاء الطلب";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        return { ok: true as const, data: res.data.items };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "create request error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}
