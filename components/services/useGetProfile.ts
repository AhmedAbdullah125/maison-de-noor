// src/services/profile/useGetProfile.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { http, UnauthorizedError, authEvents } from "./http";
import { isLoggedIn, clearAuth } from "../auth/authStorage";

type Profile = {
  id: number;
  name: string;
  photo?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: number;
  is_verify?: number;
  lang?: string;
  wallet?: string;
  created_at?: string;
  [k: string]: any;
};

let redirecting = false;

async function fetchProfile(lang: string): Promise<Profile> {
  if (!isLoggedIn()) {
    throw new UnauthorizedError("no_access_token");
  }

  const res = await http.get("/profile", { headers: { lang } });

  const body = res.data;
  if (body?.status === false && body?.statusCode === 401) {
    throw new UnauthorizedError("session_expired_body");
  }
  return body?.items as Profile;
}

export function useGetProfile(lang: string) {
  const query = useQuery({
    queryKey: ["profile", lang],
    queryFn: () => fetchProfile(lang),
    enabled: isLoggedIn(),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: (count, err: any) => {
      if (err?.isUnauthorized) return false;
      return count < 2;
    },
  });

  useEffect(() => {
    if (query.error && (query.error as any)?.isUnauthorized && !redirecting) {
      redirecting = true;
      clearAuth();
      authEvents.onLogout?.("unauthorized_profile");
    }
  }, [query.error]);

  return query;
}
