import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, clearAuth } from "../auth/authStorage";
import { refreshToken } from "./refreshToken";
import { API_BASE_URL } from "@/lib/apiConfig";

export const http = axios.create({
    baseURL: API_BASE_URL,
});

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
    queue.forEach((cb) => cb(token));
    queue = [];
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<any>) => {
        const original = error.config as any;
        const status = error.response?.status;

        if (status === 401 && !original?._retry) {
            original._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    queue.push((newToken) => {
                        original.headers.Authorization = `Bearer ${newToken}`;
                        resolve(http(original));
                    });
                });
            }

            isRefreshing = true;
            const lang = (original?.headers?.lang as string) || "ar";

            const r = await refreshToken(lang);
            isRefreshing = false;

            if (!r.ok) {
                clearAuth();
                return Promise.reject(error);
            }

            const newToken = getAccessToken();
            flushQueue(newToken);

            original.headers.Authorization = `Bearer ${newToken}`;
            return http(original);
        }

        return Promise.reject(error);
    }
);
