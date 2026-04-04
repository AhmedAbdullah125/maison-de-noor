import { useCallback, useEffect, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiAdmin, ApiAdminPagination, getAdmins } from "./managers.api";

export function useAdmins(lang: Locale, perPage: number = 10) {
    const [isLoading, setIsLoading] = useState(true);
    const [admins, setAdmins] = useState<ApiAdmin[]>([]);
    const [pagination, setPagination] = useState<ApiAdminPagination | null>(null);
    const [page, setPage] = useState(1);

    const fetcher = useCallback(async () => {
        setIsLoading(true);
        const res = await getAdmins({ lang, page, per_page: perPage });
        if (res.ok) {
            setAdmins(res.data ?? []);
            setPagination(res.pagination ?? null);
        } else {
            setAdmins([]);
            setPagination(null);
        }
        setIsLoading(false);
    }, [lang, page, perPage]);

    useEffect(() => {
        fetcher();
    }, [fetcher]);

    const currentPage = pagination?.current_page ?? page;
    const totalPages = pagination?.total_pages ?? 1;

    return {
        isLoading,
        admins,
        pagination,
        page,
        setPage,
        currentPage,
        totalPages,
        canPrev: currentPage > 1 && !isLoading,
        canNext: currentPage < totalPages && !isLoading,
        refetch: fetcher,
    };
}
