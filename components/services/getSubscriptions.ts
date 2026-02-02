import { toast } from "sonner";
import { http } from "./http";

export type SubscriptionItem = {
    id: number;
    request_number: string;
    service: string;
    subscription_name: string;
    subscription_description: string | null;
    status: string;
    is_confirmed: boolean;
    payment_type: string;
    payment_status: string;
    session_count: number;
    completed_sessions: number;
    remaining_sessions: number;
    start_date: string;
    start_time: string;
    base_price: string;
    options_price: string;
    final_price: string;
};

type PaginationLinks = {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
};

type PaginationMeta = {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        page: number | null;
        active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
};

type GetSubscriptionsResponse = {
    status: boolean;
    data: {
        data: SubscriptionItem[];
        links: PaginationLinks;
        meta: PaginationMeta;
    };
    message: string;
};

export async function getSubscriptions(
    type: "active" | "inactive",
    lang: string = "ar",
    page: number = 1
) {
    try {
        const res = await http.get<GetSubscriptionsResponse>(
            `/subscriptions?type=${type}&page=${page}`,
            {
                headers: { lang },
            }
        );

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحميل الاشتراكات";
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
            });
            return { ok: false as const, error: msg };
        }

        return {
            ok: true as const,
            data: res.data.data.data,
            pagination: {
                links: res.data.data.links,
                meta: res.data.data.meta
            }
        };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get subscriptions error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
        });
        return { ok: false as const, error: msg };
    }
}
