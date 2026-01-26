import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { http } from "./http";

// ✅ غيّر الاسم لو تحب
const QUESTIONNAIRE_ID_KEY = "questionnaire_id";

export type QuestionnaireStartResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: {
        questionnaire_id: number;
        total_questions: number;
        progress: {
            answered: number;
            total: number;
            percentage: number;
            status: "incomplete" | "complete" | string;
            completed_at: string | null;
            is_complete: boolean;
        };
    };
};

export type UseGetQuestionnaireResult = {
    data: QuestionnaireStartResponse["items"] | null;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: string | null;

    questionnaireId: number | null;
    progress: QuestionnaireStartResponse["items"]["progress"] | null;
    isComplete: boolean;
    refetch: () => Promise<void>;
};

export function saveQuestionnaireId(id: number) {
    try {
        localStorage.setItem(QUESTIONNAIRE_ID_KEY, String(id));
    } catch { }
}

export function getSavedQuestionnaireId(): number | null {
    try {
        const v = localStorage.getItem(QUESTIONNAIRE_ID_KEY);
        if (!v) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    } catch {
        return null;
    }
}

async function startQuestionnaire(lang: string = "ar") {
    const res = await http.post<QuestionnaireStartResponse>(
        `/questionnaire/start`,
        {},
        { headers: { lang } }
    );
    return res?.data;
}

export function useGetQuestionnaire(lang: string = "ar", enabled: boolean = true): UseGetQuestionnaireResult {
    const [data, setData] = useState<QuestionnaireStartResponse["items"] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        if (!enabled) return;

        setIsError(false);
        setError(null);

        // أول مرة Loading، بعدها Fetching
        setIsLoading((prev) => (data ? prev : true));
        setIsFetching(true);

        try {
            const payload = await startQuestionnaire(lang);

            if (!payload?.status) {
                const msg = payload?.message || "فشل تحميل الاستبيان";
                toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
                setIsError(true);
                setError(msg);
                return;
            }

            const items = payload?.items ?? null;
            setData(items);

            const qid = items?.questionnaire_id;
            if (typeof qid === "number") saveQuestionnaireId(qid);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || "get questionnaire error";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            setIsError(true);
            setError(msg);
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    };

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, enabled]);

    const questionnaireId = useMemo(() => {
        const id = data?.questionnaire_id;
        return typeof id === "number" ? id : getSavedQuestionnaireId();
    }, [data]);

    const progress = data?.progress ?? null;
    const isComplete = !!progress?.is_complete;

    return {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        questionnaireId,
        progress,
        isComplete,
        refetch,
    };
}
