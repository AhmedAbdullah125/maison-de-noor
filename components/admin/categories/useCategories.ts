import { useEffect, useMemo, useState } from "react";
import { Locale } from "../../../services/i18n";
import {
    ApiCategory,
    ApiPaginationMeta,
    createCategory,
    deleteCategory,
    getCategories,
    updateCategoryPatch,
} from "./categories.api";

export function useCategories(lang: Locale, perPage: number) {
    const [isLoading, setIsLoading] = useState(true);
    const [apiRows, setApiRows] = useState<ApiCategory[]>([]);
    const [meta, setMeta] = useState<ApiPaginationMeta | null>(null);
    const [page, setPage] = useState(1);

    const currentPage = meta?.current_page ?? page;
    const lastPage = meta?.last_page ?? 1;

    const servicesCountById = useMemo(() => {
        const m = new Map<number, number>();
        apiRows.forEach((r) => m.set(r.id, Number(r.services_count || 0)));
        return m;
    }, [apiRows]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setIsLoading(true);
            const res = await getCategories({ lang, page, per_page: perPage });
            if (!mounted) return;

            if (!res.ok) {
                setApiRows([]);
                setMeta(null);
                setIsLoading(false);
                return;
            }

            setApiRows(res.data);
            setMeta(res.meta);
            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [lang, page, perPage]);

    function upsertRowLocal(row: ApiCategory) {
        setApiRows((prev) => {
            const idx = prev.findIndex((x) => x.id === row.id);
            if (idx === -1) return [row, ...prev];
            const copy = prev.slice();
            copy[idx] = row;
            return copy;
        });
    }

    function patchRowLocal(id: number, patch: Partial<ApiCategory>) {
        setApiRows((prev) => prev.map((x) => (x.id === id ? ({ ...x, ...patch } as ApiCategory) : x)));
    }

    async function create(input: {
        name_ar: string;
        name_en: string;
        position: number;
        is_active: boolean;
        imageUrl?: string;
    }) {
        const res = await createCategory(input, lang);
        if (res.ok && res.created) {
            upsertRowLocal(res.created);
            setMeta((m) => (m ? { ...m, total: (m.total || 0) + 1 } : m));
        }
        return res;
    }

    async function update(id: number, input: {
        name_ar: string;
        name_en: string;
        position: number;
        is_active: boolean;
        imageUrl?: string;
    }) {
        const prevSnapshot = apiRows;

        patchRowLocal(id, {
            name_ar: input.name_ar,
            name_en: input.name_en,
            position: input.position,
            is_active: input.is_active,
            ...(input.imageUrl ? { image: input.imageUrl } : {}),
        });

        const res = await updateCategoryPatch(id, input, lang);
        if (!res.ok) {
            setApiRows(prevSnapshot);
            return res;
        }

        if (res.updated) upsertRowLocal(res.updated);
        return res;
    }

    async function remove(id: number) {
        const prev = apiRows;
        const prevMeta = meta;

        setApiRows((rows) => rows.filter((r) => r.id !== id));
        setMeta((m) => (m ? { ...m, total: Math.max(0, (m.total || 0) - 1) } : m));

        const res = await deleteCategory(id, lang);
        if (!res.ok) {
            setApiRows(prev);
            setMeta(prevMeta);
        }
        return res;
    }

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
        servicesCountById,
        create,
        update,
        remove,
    };
}
