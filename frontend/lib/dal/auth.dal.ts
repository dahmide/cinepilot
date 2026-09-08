import { API_BASE } from "@/config/api";
import type { AuthResponseDTO, UserDTO } from "@/lib/dto/auth.dto";

export async function signup(
    username: string,
    password: string
): Promise<AuthResponseDTO> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail ?? "Signup failed");
    }
    return res.json();
}

export async function signin(
    username: string,
    password: string
): Promise<AuthResponseDTO> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail ?? "Login failed");
    }
    return res.json();
}

export async function logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include"
    });
}

export async function getMe(): Promise<UserDTO | null> {
    const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include"
    });
    if (!res.ok) return null;
    return res.json();
}
