'use client';

import { useMemo } from "react";
import { useGetLookups } from "../services/useGetLookups";
import { useGetServices } from "../services/useGetServices";
import { mapLookupsToUI, mapServicesToProducts } from "./serviceMappers";

export function useHomeData(lang: string, page: number = 1) {
    const lookupsQ = useGetLookups(lang);
    const servicesQ = useGetServices(lang, page);

    const ui = useMemo(() => {
        const lookups = lookupsQ.data;
        const servicesResp = servicesQ.data;

        const mappedLookups = mapLookupsToUI(lookups);
        const mappedProducts = mapServicesToProducts(servicesResp?.items?.services ?? []);

        return {
            categories: mappedLookups.categories,
            banners: mappedLookups.banners,
            socialLinks: mappedLookups.socialLinks,
            products: mappedProducts,
        };
    }, [lookupsQ.data, servicesQ.data]);

    return {
        ...ui,
        isLoading: lookupsQ.isLoading || servicesQ.isLoading,
        isError: lookupsQ.isError || servicesQ.isError,
        refetchAll: () => {
            lookupsQ.refetch();
            servicesQ.refetch();
        },
    };
}
