// src/components/services/useGetService.ts
'use client';
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../../lib/apiConfig";
import { useQuery } from "@tanstack/react-query";

const fetchService = async (lang: string, id: number | string) => {
  const token = Cookies.get("token");
  const headers: Record<string, string> = { lang };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await axios.get(`${API_BASE_URL}/services/${id}`, { headers });

  // ✅ items: { id, name, main_image, sub_services: [...] ... }
  return response.data.items;
};

export const useGetService = (lang: string, id?: number | string) =>
  useQuery({
    queryKey: ["service", lang, id],
    queryFn: () => fetchService(lang, id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
