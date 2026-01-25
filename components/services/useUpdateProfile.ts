// src/services/useUpdateProfile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfileRequest, UpdateProfilePayload } from "./updateProfile";

export function useUpdateProfile(lang: string = "ar") {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) => updateProfileRequest(payload, lang),

        onSuccess: (data: any) => {
            if (!data?.status) {
                const msg = data?.message || "فشل تحديث الحساب";
                toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
                return;
            }

            toast("تم تحديث الحساب بنجاح", {
                style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
            });

            // ✅ اعمل refetch للـ profile
            qc.invalidateQueries({ queryKey: ["profile", lang] });
        },

        onError: (e: any) => {
            const msg = e?.response?.data?.message || e?.message || "Update profile error";
            toast(msg, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
        },
    });
}
