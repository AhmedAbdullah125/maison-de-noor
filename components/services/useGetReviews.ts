import { useQuery } from "@tanstack/react-query";
import { getReviewsRequest } from "./getReviews";

export function useGetReviews(lang: string = "ar", page: number = 1) {
    return useQuery({
        queryKey: ["reviews", lang, page],
        queryFn: async () => {
            const res = await getReviewsRequest(lang, page);
            if (!res.ok) throw new Error(res.error || "reviews error");
            return res; // { reviews, pagination }
        },
        staleTime: 30_000,
    });
}
