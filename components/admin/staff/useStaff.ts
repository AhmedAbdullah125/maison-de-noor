import { useEffect, useState } from "react";
import { Locale } from "../../../services/i18n";
import { getRoles, ApiRole, ApiPaginationMeta } from "./staff.api";

export function useStaff(lang: Locale, perPage: number = 200) {
    const [isLoading, setIsLoading] = useState(true);
    const [apiRows, setApiRows] = useState<ApiRole[]>([]);
    const [meta, setMeta] = useState<ApiPaginationMeta | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        const result = await getRoles(lang, perPage);
        setIsLoading(false);

        if (result.ok) {
            setApiRows(result.data);
            setMeta(result.meta);
        } else {
            setApiRows([]);
            setMeta(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, [lang, perPage]);

    return {
        isLoading,
        apiRows,
        meta,
        refetch: fetchData,
    };
}
