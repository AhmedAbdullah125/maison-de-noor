'use client';
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../../lib/apiConfig";
import { useQuery } from "@tanstack/react-query";

const fetchServices = async (lang: string, page: number) => {
  const token = Cookies.get("token");

  const formData = new FormData();
  formData.append("page_size", "100");
  formData.append("page_number", String(page));

  const headers: Record<string, string> = { lang };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await axios.post(`${API_BASE_URL}/services/index`, formData, { headers });

  return response.data;
};

export const useGetServices = (lang: string, page: number) =>
  useQuery({
    queryKey: ["services", lang, page],
    queryFn: () => fetchServices(lang, page),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
