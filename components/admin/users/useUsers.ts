import { useCallback, useEffect, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiUser, getUsers } from "./users.api";

export function useUsers(lang: Locale) {
    const [isLoading, setIsLoading] = useState(true);
    const [apiRows, setApiRows] = useState<ApiUser[]>([]);

    const fetcher = useCallback(async () => {
        setIsLoading(true);
        const res = await getUsers(lang);
        if (res.ok) setApiRows(res.data ?? []);
        else setApiRows([]);
        setIsLoading(false);
    }, [lang]);

    useEffect(() => {
        fetcher();
    }, [fetcher]);

    return { isLoading, apiRows, refetch: fetcher };
}
