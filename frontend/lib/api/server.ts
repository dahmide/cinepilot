import "server-only";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/config/auth";

async function getAuthHeaders(): Promise<HeadersInit> {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!cookieToken) return {};
    return {
        Cookie: `${AUTH_COOKIE_NAME}=${cookieToken}`
    };
}

export const apiFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const headers = await getAuthHeaders();
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
            ...headers
        }
    });
    return response;
};
