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
    user?: any;
    request?: any;
    subscription?: any;
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
    data: ApiBooking[];
    meta: { pagination: { page: number; last_page: number; per_page: number; total: number; has_more: boolean } };
};

type ApiBookingDetailResponse = { data: any };

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

function adaptBooking(booking: any): ApiBooking {
    return {
        ...booking,
        user: booking.user ?? booking.customer,
        service: typeof booking.service === "string" ? booking.service : (booking.service?.name ?? ""),
    };
}

export async function getBookings(params: {
    lang: Locale;
    type: BookingType;
    page: number;
    per_page: number;
    payment_status?: "paid" | "unpaid";
    search?: string;
}) {
    try {
        const res = await http.get<ApiBookingsResponse>(
            `${DASHBOARD_API_BASE_URL}/v2/dashboard/bookings`,
            {
                params: {
                    type: params.type,
                    page: params.page,
                    per_page: params.per_page,
                    ...(params.payment_status ? { payment_status: params.payment_status } : {}),
                    ...(params.search ? { search: params.search } : {}),
                },
                headers: { "Accept-Language": params.lang, Accept: "application/json" },
            }
        );

        if (!Array.isArray(res?.data?.data)) {
            return { ok: false as const, error: (res.data as any)?.error?.message || "Failed" };
        }

        const pagination = res.data.meta.pagination;
        return {
            ok: true as const,
            data: res.data.data.map(adaptBooking),
            meta: { current_page: pagination.page, last_page: pagination.last_page, per_page: pagination.per_page, total: pagination.total, from: null, to: null },
        };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get bookings error";
        toastApi(false, msg);
        return { ok: false as const, error: msg };
    }
}

export async function getBooking(id: number, lang: Locale) {
    try {
        const res = await http.get<ApiBookingDetailResponse>(
            `${DASHBOARD_API_BASE_URL}/v2/dashboard/bookings/${id}`,
            { headers: { "Accept-Language": lang, Accept: "application/json" } }
        );

        if (!res.data?.data) {
            return { ok: false as const, error: (res.data as any)?.error?.message || "Failed" };
        }

        return { ok: true as const, data: adaptBooking(res.data.data) };
    } catch (e: any) {
        const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "get booking error";
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
