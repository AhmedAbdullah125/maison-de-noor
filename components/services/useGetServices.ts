// src/components/services/useGetServices.ts
import { useQuery } from "@tanstack/react-query";
import { http } from "./http";

const fetchServices = async (lang: string, page: number) => {
  const formData = new FormData();
  formData.append("page_size", "100");
  formData.append("page_number", String(page));

  const res = await http.post("/services/index", formData, { headers: { lang } });
  return res.data;
};

export const useGetServices = (lang: string, page: number) =>
  useQuery({
    queryKey: ["services", lang, page],
    queryFn: () => fetchServices(lang, page),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    keepPreviousData: true,
  });
