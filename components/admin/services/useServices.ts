import { useEffect, useMemo, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiService, deleteService, getServices, pickTranslation } from "./services.api";

export type UiServiceRow = {
    id: number;
    name: string;
    description: string;
    image: string;
    price: string;
    duration: string;
    categoryId: number;
};

export function useServices(lang: Locale, perPage: number, categoryId?: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<ApiService[]>([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setIsLoading(true);
            const res = await getServices({ 
                lang, 
                per_page: perPage, 
                page,
                ...(categoryId ? { category_id: categoryId } : {})
            });
            if (!mounted) return;

            if (!res.ok) {
                setRows([]);
                setIsLoading(false);
                return;
            }

            setRows(res.data);
            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [lang, perPage, page, categoryId]);

    const uiRows: UiServiceRow[] = useMemo(() => {
        return rows.map((s) => {
            const tr = pickTranslation(s.translations, lang);
            return {
                id: s.id,
                name: tr.name || "",
                description: tr.description || "",
                image: s.main_image || "",
                price: s.discounted_price ?? s.price,
                duration: "-",
                categoryId: s.category_id,
            };
        });
    }, [rows, lang]);

    async function remove(id: number) {
        const prev = rows;
        // optimistic remove
        setRows((r) => r.filter((x) => x.id !== id));
        const res = await deleteService(id, lang);
        if (!res.ok) setRows(prev);
        return res;
    }

    return {
        isLoading,
        page,
        setPage,
        uiRows,
        remove,
        // pagination placeholders (لما الباك يبعت meta هنزبطهم)
        canPrev: page > 1 && !isLoading,
        canNext: false,
    };
}
