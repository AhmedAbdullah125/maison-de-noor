import { useEffect, useMemo, useState } from "react";
import { Locale } from "../../../services/i18n";
import { ApiService, ApiServicesPagination, deleteService, getServices, pickTranslation, updateServicePaymentOptions } from "./services.api";

export type UiServiceRow = {
    id: number;
    name: string;
    description: string;
    image: string;
    price: string;
    duration: string;
    categoryId: number;
    usesCategoryPayment: boolean;
    payAtSalon: boolean;
    payOnline: boolean;
};

export function useServices(lang: Locale, perPage: number, categoryId?: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<ApiService[]>([]);
    const [pagination, setPagination] = useState<ApiServicesPagination | undefined>();
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
                setPagination(undefined);
                setIsLoading(false);
                return;
            }

            setRows(res.data);
            setPagination(res.meta?.pagination);
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
                booking_limit_per_time: s.booking_limit_per_time,
                categoryId: s.category_id,
                usesCategoryPayment: s.uses_category_payment_options ?? true,
                payAtSalon: s.effective_allow_pay_at_salon ?? true,
                payOnline: s.effective_allow_pay_online ?? true,
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

    /** Override (both booleans) or reset to the category (both null); the row updates from the server's answer. */
    async function setPaymentOptions(id: number, opts: { allow_pay_at_salon: boolean | null; allow_pay_online: boolean | null }) {
        const res = await updateServicePaymentOptions(id, opts, lang);
        if (res.ok) {
            setRows((r) => r.map((x) => (x.id === id ? { ...x, ...res.data } : x)));
        }
        return res;
    }

    return {
        isLoading,
        setPaymentOptions,
        page,
        setPage,
        uiRows,
        remove,
        canPrev: page > 1 && !isLoading,
        canNext: Boolean(pagination?.has_more) && !isLoading,
    };
}
