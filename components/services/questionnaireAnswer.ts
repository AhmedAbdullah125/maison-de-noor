import { toast } from "sonner";
import { http } from "./http";

export type QuestionnaireProgress = {
    answered: number;
    total: number;
    percentage: number;
    status: string;
    completed_at: string | null;
    is_complete: boolean;
};

export type AnswerResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: {
        questionnaire_id: number;
        progress: QuestionnaireProgress;
        is_complete: boolean;
    };
};

type AnswerPayload =
    | { question_id: number; answer_id: number; text_answer?: never }
    | { question_id: number; text_answer: string; answer_id?: never };

export async function postQuestionnaireAnswer(
    questionnaireId: number,
    payload: AnswerPayload,
    lang: string = "ar"
) {
    try {
        const fd = new FormData();
        fd.append("question_id", String(payload.question_id));

        if ("answer_id" in payload) {
            fd.append("answer_id", String(payload.answer_id));
        } else {
            fd.append("text_answer", payload.text_answer);
        }

        const res = await http.post<AnswerResponse>(
            `/questionnaire/${questionnaireId}/answer`,
            fd,
            {
                headers: { lang, "Content-Type": "multipart/form-data" },
            }
        );

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل حفظ الإجابة";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        return { ok: true as const, data: res.data.items! };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "answer submit error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}
