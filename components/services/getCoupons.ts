import { toast } from "sonner";
import { http } from "./http";

export type CouponService = {
    id: number;
    name: string;
};

export type CouponItem = {
    id: number;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: string;
    start_date: string;
    end_date: string;
    is_active: number;
    services: CouponService[];
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

type GetCouponsResponse = {
    status: boolean;
    data: {
        data: CouponItem[];
        links: PaginationLinks;
        meta: PaginationMeta;
    };
    message: string;
};

export async function getCoupons(
    lang: string = "ar",
    page: number = 1,
    perPage: number = 10,
    isActive: number = 1
) {
    try {
        const res = await http.get<GetCouponsResponse>(
            `/coupons?per_page=${perPage}&is_active=${isActive}&page=${page}`,
            {
                headers: { lang },
            }
        );

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحميل الكوبونات";
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
        const msg = e?.response?.data?.message || e?.message || "get coupons error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
        });
        return { ok: false as const, error: msg };
    }
}

export async function deleteCoupon(id: number, lang: string = "ar") {
    try {
        const res = await http.delete(`/coupons/${id}`, {
            headers: { lang },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل حذف الكوبون";
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
            });
            return { ok: false as const, error: msg };
        }

        toast(res.data.message || "تم حذف الكوبون بنجاح", {
            style: { background: "#28a745", color: "#fff", borderRadius: "10px" }
        });
        return { ok: true as const };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "delete coupon error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
        });
        return { ok: false as const, error: msg };
    }
}

export async function addCoupon(data: any, lang: string = "ar") {
    try {
        const res = await http.post("/coupons", data, {
            headers: { lang },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل إضافة الكوبون";
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
            });
            return { ok: false as const, error: msg };
        }

        toast(res.data.message || "تم إضافة الكوبون بنجاح", {
            style: { background: "#28a745", color: "#fff", borderRadius: "10px" }
        });
        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "add coupon error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
        });
        return { ok: false as const, error: msg };
    }
}

export async function updateCoupon(id: number, data: any, lang: string = "ar") {
    try {
        const res = await http.patch(`/coupons/${id}`, data, {
            headers: { lang },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحديث الكوبون";
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
            });
            return { ok: false as const, error: msg };
        }

        toast(res.data.message || "تم تحديث الكوبون بنجاح", {
            style: { background: "#28a745", color: "#fff", borderRadius: "10px" }
        });
        return { ok: true as const, data: res.data.data };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "update coupon error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
        });
        return { ok: false as const, error: msg };
    }
}

