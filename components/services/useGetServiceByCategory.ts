'use client';
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../../lib/apiConfig";
import { useQuery } from "@tanstack/react-query";

const fetchServicesByCategory = async (lang: string, id: number | string, page: number) => {
  const token = Cookies.get("token");
  const headers: Record<string, string> = { lang };
  if (token) headers.Authorization = `Bearer ${token}`;

  const formData = new FormData();
  formData.append("page_size", "20");          // خليها زي اللي عندك في الباك
  formData.append("page_number", String(page));

  const response = await axios.post(
    `${API_BASE_URL}/services/by-category/${id}`,
    formData,
    { headers }
  );

  // response.data.items = { services: [], pagination: {} }
  return response.data.items;
};

export const useGetServiceByCategory = (lang: string, id?: number | string, page: number = 1) =>
  useQuery({
    queryKey: ["serviceByCategory", lang, id, page],
    queryFn: () => fetchServicesByCategory(lang, id as number, page),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
