import { toast } from "sonner";
import { http } from "./http";

export type BookingItem = {
    id: number;
    request_number: string;
    service: string;
    status: string;
    is_confirmed: boolean;
    payment_type: string;
    payment_status: string;
    start_date: string;
    start_time: string;
    base_price: string;
    options_price: string;
    final_price: string;
};

type GetBookingsResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: BookingItem[];
};

export async function getBookings(lang: string = "ar") {
    try {
        const res = await http.get<GetBookingsResponse>(`/requests?type=bookings`, {
            headers: { lang },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحميل الحجوزات";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        return { ok: true as const, data: res.data.items ?? [] };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get bookings error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}
