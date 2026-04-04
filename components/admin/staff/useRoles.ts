import { useCallback, useEffect, useState } from "react";
import { Locale } from "../../../services/i18n";
import { getRoles, ApiRole, ApiPaginationMeta } from "./staff.api";

export function useRoles(lang: Locale, perPage: number = 200) {
    const [isLoading, setIsLoading] = useState(true);
    const [roles, setRoles] = useState<ApiRole[]>([]);
    const [meta, setMeta] = useState<ApiPaginationMeta | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const result = await getRoles(lang, perPage);
        if (result.ok) {
            setRoles(result.data);
            setMeta(result.meta);
        } else {
            setRoles([]);
            setMeta(null);
            setError(result.error);
        }
        setIsLoading(false);
    }, [lang, perPage]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    return {
        isLoading,
        roles,
        meta,
        error,
        refetch: fetchRoles,
    };
}
