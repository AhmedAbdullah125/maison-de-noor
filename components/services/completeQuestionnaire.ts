import { toast } from "sonner";
import { http } from "./http";

export type CompleteResponse = {
    status: boolean;
    statusCode: number;
    message: string;
    items?: any;
};

export async function completeQuestionnaire(
    questionnaireId: number,
    lang: string = "ar"
) {
    try {
        const res = await http.post<CompleteResponse>(
            `/questionnaire/${questionnaireId}/complete`,
            {},
            { headers: { lang } }
        );

        if (!res?.data?.status) {
            const msg = res?.data?.message || "فشل إكمال الاستبيان";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return { ok: false as const, error: msg };
        }

        return { ok: true as const, data: res.data.items };
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "complete questionnaire error";
        toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        return { ok: false as const, error: msg };
    }
}