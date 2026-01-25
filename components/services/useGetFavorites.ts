import { useQuery } from "@tanstack/react-query";
import { getFavoritesRequest } from "./getFavorites";

export function useGetFavorites(lang: string = "ar") {
    return useQuery({
        queryKey: ["favorites", lang],
        queryFn: async () => {
            const res = await getFavoritesRequest(lang);
            if (!res.ok) throw new Error(res.error || "favorites error");
            return res.services;
        },
        staleTime: 30_000,
    });
}
