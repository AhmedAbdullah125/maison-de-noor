// src/components/requests/useGetQuestions.ts
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";

export const useGetQuestions = (lang: string, enabled: boolean) => {
    return useQuery({
        queryKey: ["hairQuestions", lang],
        enabled,
        queryFn: async () => {
            const { data } = await axios.get(`${API_BASE_URL}/questions`, {
                headers: { lang },
            });
            return data?.items ?? [];
        },
        staleTime: 60_000,
    });
};
