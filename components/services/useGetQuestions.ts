import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { http } from "./http";

export type ApiAnswer = {
    id: number;
    answer: string;
    question_id: number;
    order: number;
};

export type ApiQuestion = {
    id: number;
    type: "multiple_choice" | "text" | string;
    question: string;
    is_required: 0 | 1;
    is_active: 0 | 1;
    sort_order: number;
    answers: ApiAnswer[];
};

type QuestionsResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: ApiQuestion[];
};

export function useGetQuestions(lang: string = "ar", enabled: boolean = true) {
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuestions = async () => {
        if (!enabled) return;

        setIsError(false);
        setError(null);
        setIsLoading((prev) => (questions.length ? prev : true));
        setIsFetching(true);

        try {
            const res = await http.get<QuestionsResponse>(`/questions`, {
                headers: { lang },
            });

            const payload = res?.data;

            if (!payload?.status) {
                const msg = payload?.message || "فشل تحميل الأسئلة";
                toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
                setIsError(true);
                setError(msg);
                return;
            }

            const list = payload?.items ?? [];
            // ✅ active + ترتيب
            const cleaned = list
                .filter((q) => q?.is_active === 1)
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

            setQuestions(cleaned);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || "get questions error";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            setIsError(true);
            setError(msg);
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, enabled]);

    const requiredIds = useMemo(
        () => questions.filter((q) => q.is_required === 1).map((q) => q.id),
        [questions]
    );

    return { questions, requiredIds, isLoading, isFetching, isError, error, refetch: fetchQuestions };
}
