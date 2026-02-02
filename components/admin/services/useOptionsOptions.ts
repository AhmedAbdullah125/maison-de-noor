import { useEffect, useMemo, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiOption, getOptions } from "./options.api";

export type GlobalAddonItem = {
    id: string;
    labelEn: string;
    labelAr: string;
    price: number;
};

export type GlobalAddon = {
    id: number;
    titleEn: string;
    titleAr: string;
    required: boolean;
    selectionType: "single" | "multiple";
    items: GlobalAddonItem[];
};

// Helper to get translation
const getTr = <T extends { language: "ar" | "en" }>(
    arr: T[] | undefined,
    lang: "ar" | "en"
) => (arr || []).find((x) => x.language === lang);

// Helper to convert to number
const toNum = (x: any) => {
    const n = Number.parseFloat(String(x ?? "0"));
    return Number.isFinite(n) ? n : 0;
};

function mapApiOptionToAddon(opt: ApiOption): GlobalAddon {
    const trEn = getTr(opt.translations, "en");
    const trAr = getTr(opt.translations, "ar");

    const items = (opt.values || [])
        .slice()
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((v) => {
            const vEn = getTr(v.translations as any, "en");
            const vAr = getTr(v.translations as any, "ar");
            return {
                id: String(v.id),
                labelEn: (vEn as any)?.name || "",
                labelAr: (vAr as any)?.name || "",
                price: toNum(v.price),
            };
        });

    return {
        id: opt.id,
        titleEn: (trEn as any)?.title || "",
        titleAr: (trAr as any)?.title || "",
        required: !!opt.is_required,
        selectionType: opt.is_multiple_choice ? "multiple" : "single",
        items,
    };
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

    const rows: GlobalAddon[] = useMemo(() => {
        return (apiRows || [])
            .filter((o) => !!o && (o.is_active === 1 || o.is_active === true))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map(mapApiOptionToAddon);
    }, [apiRows]);

    return { isLoading, rows };
}
