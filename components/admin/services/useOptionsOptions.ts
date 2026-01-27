import { useEffect, useMemo, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiOption, getOptions } from "./options.api";

export type UiOptionRow = {
    id: number;
    title_ar: string;
    title_en: string;
    is_required: boolean;
    is_multiple_choice: boolean;
    values_count: number;
};

function pickTitle(option: ApiOption, lang: "ar" | "en") {
    const t = option.translations?.find((x) => x.language === lang)?.title;
    if (t) return t;
    // fallback: any title
    return option.translations?.[0]?.title || "";
}

export function useOptionsOptions(lang: Locale) {
    const [isLoading, setIsLoading] = useState(true);
    const [apiRows, setApiRows] = useState<ApiOption[]>([]);

    useEffect(() => {
        let mounted = true;
        async function run() {
            setIsLoading(true);

            // ✅ you can increase per_page if you want all at once
            const res = await getOptions({ lang, page: 1, per_page: 200 });

            if (!mounted) return;

            if (res.ok) setApiRows(res.data || []);
            else setApiRows([]);

            setIsLoading(false);
        }
        run();
        return () => {
            mounted = false;
        };
    }, [lang]);

    const rows: UiOptionRow[] = useMemo(() => {
        return (apiRows || [])
            .filter((o) => !!o && (o.is_active === 1 || o.is_active === true))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((o) => ({
                id: o.id,
                title_ar: pickTitle(o, "ar"),
                title_en: pickTitle(o, "en"),
                is_required: Number(o.is_required) === 1,
                is_multiple_choice: Number(o.is_multiple_choice) === 1,
                values_count: Array.isArray(o.values) ? o.values.length : 0,
            }));
    }, [apiRows]);

    return { isLoading, rows };
}
