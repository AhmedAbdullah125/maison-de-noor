import { toast } from "sonner";
import { http } from "../../services/http";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { Locale } from "../../../services/i18n";

export type BookingType = "upcoming" | "completed";

// ✅ statuses اللي هنشتغل بيها في الـ UI
export type BookingStatus = "upcoming" | "completed" | "cancelled";

export type ApiBooking = {
    id: number;
    booking_number: string;
    service: string;
    start_date: string;
    start_time: string;
    status?: BookingStatus;
};

export type ApiPaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type ApiBookingsResponse = {
    status: boolean;
    data: {
        data: ApiBooking[];
        links?: any;
        meta: ApiPaginationMeta;
    };
    message: string;
};

type ApiSimpleResponse = {
    status: boolean;
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

export async function getBookings(params: {
    lang: Locale;
    type: BookingType;
    page: number;
    per_page: number;
}) {
    try {
        const res = await http.get<ApiBookingsResponse>(
            `${DASHBOARD_API_BASE_URL}/bookings`,
            {
                params: {
                    type: params.type,
                    page: params.page,
                    per_page: params.per_page,
                },
                headers: { "Accept-Language": params.lang, Accept: "application/json" },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Failed" };
        }

        return { ok: true as const, data: res.data.data.data, meta: res.data.data.meta };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get bookings error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

// ✅ POST /bookings/change-status/:id
export async function changeBookingStatus(
    id: number,
    status: BookingStatus,
    lang: Locale
) {
    try {
        const res = await http.post<ApiSimpleResponse>(
            `${DASHBOARD_API_BASE_URL}/bookings/change-status/${id}`,
            { status },
            {
                headers: { lang, Accept: "application/json" },
            }
        );

        toastApi(!!res?.data?.status, res?.data?.message);

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Change status failed" };
        }

        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Change status error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}
