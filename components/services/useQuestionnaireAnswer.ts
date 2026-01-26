// src/components/requests/useQuestionnaireAnswer.ts
import axios from "axios";
import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";

export const usePostAnswer = (lang: string, questionnaireId: number) => {
    return useMutation({
        mutationFn: async (payload: { question_id: number; answer_id?: number; text_answer?: string }) => {
            const token = Cookies.get("token");
            const fd = new FormData();
            fd.append("question_id", String(payload.question_id));
            if (payload.answer_id != null) fd.append("answer_id", String(payload.answer_id));
            if (payload.text_answer != null) fd.append("text_answer", payload.text_answer);

            const { data } = await axios.post(`${API_BASE_URL}/questionnaire/${questionnaireId}/answer`, fd, {
                headers: {
                    lang,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            return data;
        },
    });
};

export const useDeleteAnswer = (lang: string, questionnaireId: number) => {
    return useMutation({
        mutationFn: async (answerRecordId: number) => {
            const token = Cookies.get("token");
            const { data } = await axios.delete(`${API_BASE_URL}/questionnaire/${questionnaireId}/answer/${answerRecordId}`, {
                headers: {
                    lang,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            return data;
        },
    });
};

export const useCompleteQuestionnaire = (lang: string, questionnaireId: number) => {
    return useMutation({
        mutationFn: async () => {
            const token = Cookies.get("token");
            const { data } = await axios.post(`${API_BASE_URL}/questionnaire/${questionnaireId}/complete`, null, {
                headers: {
                    lang,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            return data;
        },
    });
};
