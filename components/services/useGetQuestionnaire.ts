// src/components/hairProfile/requests/useGetQuestionnaire.ts
import axios from "axios";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";

export const useGetQuestionnaire = (
    lang: string,
    questionnaireId: number | null,
    enabled = true
) => {
    return useQuery({
        queryKey: ["questionnaire", questionnaireId, lang],
        enabled: enabled && !!questionnaireId,
        queryFn: async () => {
            const token = Cookies.get("token");

            const { data } = await axios.get(
                `${API_BASE_URL}/questionnaire/${questionnaireId}`,
                {
                    headers: {
                        lang,
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            // returns: { id, status, progress, answers, ... }
            return data?.items ?? null;
        },
        staleTime: 10_000,
    });
};
