"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE } from "@/config/api";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/config/auth";
import {
    AuthSchema,
    AuthFormInput as FormInput,
    AuthFormState as FormState
} from "@/lib/schemas/auth";
import { zodParse } from "@/utils/functions/zod";

export async function signin(state: FormState, formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
        const out = zodParse(AuthSchema, { username, password });
        if (!out.success) {
            console.log(out.errors);
            throw { message: "", errors: [] };
        }
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw { message: "", errors: [] };
        }

        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            const cookieStore = await cookies();
            cookieStore.set(
                AUTH_COOKIE_NAME,
                setCookie.split(`${AUTH_COOKIE_NAME}=`)[1].split(";")[0],
                {
                    httpOnly: true,
                    sameSite: "strict",
                    maxAge: AUTH_COOKIE_MAX_AGE,
                    path: "/"
                }
            );
        }

        redirect("/app/projects/new");
    } catch (e) {
        return { success: false, message: e.message };
    }
}

export async function signup(state: FormState, formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
        const out = zodParse(AuthSchema, { username, password });
        if (!out.success) {
            console.log(out.errors);
            throw { message: "", errors: [] };
        }
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw { message: "", errors: [] };
        }

        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            const cookieStore = await cookies();
            cookieStore.set(
                AUTH_COOKIE_NAME,
                setCookie.split(`${AUTH_COOKIE_NAME}=`)[1].split(";")[0],
                {
                    httpOnly: true,
                    sameSite: "strict",
                    maxAge: AUTH_COOKIE_MAX_AGE,
                    path: "/"
                }
            );
        }

        redirect("/app/projects/new");
    } catch (e) {
        return { success: false, message: e.message };
    }
}

export async function logout() {
    await fetch(`${API_BASE}/auth/logout`, {
        method: "POST"
    });
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    redirect("/login");
}
