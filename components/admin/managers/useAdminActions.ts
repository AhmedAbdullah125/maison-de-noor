import { useState } from "react";
import { Locale } from "../../../services/i18n";
import { CreateAdminPayload, createAdmin, updateAdmin, deleteAdmin } from "./managers.api";

type ActionState = {
    isSaving: boolean;
    isDeleting: boolean;
    error: string | null;
};

export function useAdminActions(lang: Locale) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async (
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

    const update = async (
        id: number,
        payload: CreateAdminPayload,
        onSuccess?: () => void,
    ): Promise<boolean> => {
        setError(null);
        setIsSaving(true);
        const result = await updateAdmin(id, payload, lang);
        setIsSaving(false);
        if (result.ok) {
            onSuccess?.();
            return true;
        }
        setError(result.error ?? null);
        return false;
    };

    const remove = async (
        id: number,
        onSuccess?: () => void,
    ): Promise<boolean> => {
        setError(null);
        setIsDeleting(true);
        const result = await deleteAdmin(id, lang);
        setIsDeleting(false);
        if (result.ok) {
            onSuccess?.();
            return true;
        }
        setError(result.error ?? null);
        return false;
    };

    return { isSaving, isDeleting, error, create, update, remove };
}
