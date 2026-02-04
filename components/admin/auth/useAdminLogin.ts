import { useState } from "react";
import { adminLogin, LoginCredentials } from "./auth.api";
import { Locale } from "../../../services/i18n";

export function useAdminLogin(lang: Locale) {
    const [isLoading, setIsLoading] = useState(false);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const result = await adminLogin(credentials, lang);
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading };
}
