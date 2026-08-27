import { API_BASE } from "@/config/api";
import type { ProjectDTO } from "@/lib/dto/project.dto";
import { apiFetch } from "@/lib/api/server";

export async function getProjects(): Promise<ProjectDTO[]> {
    const url = `${API_BASE}/projects`;
    const res = await apiFetch(url);

    if (!res.ok) {
        throw new Error("Failed to load projects");
    }
    return res.json();
}
