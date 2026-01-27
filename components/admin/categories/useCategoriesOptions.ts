import { useEffect, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiCategory, getCategoriesSimple } from "./categories2.api";

export function useCategoriesOptions(lang: Locale) {
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<ApiCategory[]>([]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setIsLoading(true);
            const res = await getCategoriesSimple({ lang, per_page: 1000 });

            if (!mounted) return;

            if (res.ok) setRows(res.data);
            else setRows([]);

            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [lang]);

    return { isLoading, rows };
}
