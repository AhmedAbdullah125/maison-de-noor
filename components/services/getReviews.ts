import { toast } from "sonner";
import { http } from "./http";
import { API_BASE_URL } from "@/lib/apiConfig";


export type ReviewApi = {
    id: number;
    title?: string;
    video: string;
};

type ReviewsResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: {
        reviews?: ReviewApi[];
        pagination?: any;
    };
};

const toAbsUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL.replace(/\/$/, "")}/storage/${path.replace(/^\//, "")}`;
};

export async function getReviewsRequest(lang: string = "ar", page: number = 1) {
    try {
        const res = await http.post<ReviewsResponse>(`/reviews`, {
            headers: { lang },
            params: { page },
        });

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل تحميل المراجعات";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        const reviews = res?.data?.items?.reviews ?? [];
        const mapped = reviews.map((r) => ({
            id: String(r.id),
            clientName: r.title || "مراجعة عميلة",
            videoUrl: toAbsUrl(r.video),
            thumbnailUrl: "",
        }));

        return {
            ok: true as const,
            reviews: mapped,
            pagination: res?.data?.items?.pagination,
        };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "get reviews error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}
