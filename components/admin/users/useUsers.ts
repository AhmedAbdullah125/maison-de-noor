import { useCallback, useEffect, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiUser, ApiPaginationMeta, getUsers } from "./users.api";

export function useUsers(lang: Locale, perPage: number = 10) {
    const [isLoading, setIsLoading] = useState(true);
    const [apiRows, setApiRows] = useState<ApiUser[]>([]);
    const [meta, setMeta] = useState<ApiPaginationMeta | null>(null);
    const [page, setPage] = useState(1);

    const fetcher = useCallback(async () => {
        setIsLoading(true);
        const res = await getUsers({ lang, page, per_page: perPage });
        if (res.ok) {
            setApiRows(res.data ?? []);
            setMeta(res.meta ?? null);
        } else {
            setApiRows([]);
            setMeta(null);
        }
        setIsLoading(false);
    }, [lang, page, perPage]);

    useEffect(() => {
        fetcher();
    }, [fetcher]);

    const currentPage = meta?.current_page ?? page;
    const lastPage = meta?.last_page ?? 1;

    return { 
        isLoading, 
        apiRows, 
        meta,
        page,
        setPage,
        currentPage,
        lastPage,
        canPrev: currentPage > 1 && !isLoading,
        canNext: currentPage < lastPage && !isLoading,
        refetch: fetcher 
    };
}
