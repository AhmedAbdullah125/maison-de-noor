import { useState } from "react";
import { Locale } from "../../../services/i18n";
import { CreateAdminPayload, createAdmin } from "./managers.api";

export type CreateAdminState = {
    isSaving: boolean;
    error: string | null;
};

export function useCreateAdmin(lang: Locale) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (
        payload: CreateAdminPayload,
        onSuccess?: () => void,
    ): Promise<boolean> => {
        setError(null);
        setIsSaving(true);

        const result = await createAdmin(payload, lang);

        setIsSaving(false);

        if (result.ok) {
            onSuccess?.();
            return true;
        }

        setError(result.error ?? null);
        return false;
    };

    return { isSaving, error, submit };
}
