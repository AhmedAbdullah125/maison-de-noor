// src/components/requests/useQuestionnaireStart.ts
import axios from "axios";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";

export const useQuestionnaireStart = (lang: string, enabled: boolean) => {
    return useQuery({
        queryKey: ["questionnaireStart", lang],
        enabled,
        queryFn: async () => {
            const token = Cookies.get("token");
            const { data } = await axios.post(`${API_BASE_URL}/questionnaire/start`, null, {
                headers: {
                    lang,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            return data?.items;
        },
        staleTime: 10_000,
    });
};
