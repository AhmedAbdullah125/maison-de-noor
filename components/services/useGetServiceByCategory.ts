// src/components/services/useGetServiceByCategory.ts
import { useQuery } from "@tanstack/react-query";
import { http } from "./http";

const fetchServicesByCategory = async (lang: string, id: number | string, page: number) => {
  const formData = new FormData();
  formData.append("page_size", "20");
  formData.append("page_number", String(page));

  const res = await http.post(`/services/by-category/${id}`, formData, { headers: { lang } });

  // success: items = { services: [], pagination: {} }
  return res.data.items;
};

export const useGetServiceByCategory = (lang: string, id?: number | string, page: number = 1) =>
  useQuery({
    queryKey: ["serviceByCategory", lang, id, page],
    queryFn: () => fetchServicesByCategory(lang, id as any, page),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
