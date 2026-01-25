'use client';
import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../../lib/apiConfig";
import { useQuery } from "@tanstack/react-query";

const fetchLookups = async (lang: string) => {
    const token = Cookies.get("token");
    const headers: Record<string, string> = { lang };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await axios.post(`${API_BASE_URL}/lookups`, { headers });

    return response.data.items;
};

export const useGetLookups = (lang: string) =>
    useQuery({
        queryKey: ["lookups", lang],
        queryFn: () => fetchLookups(lang),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
    });
