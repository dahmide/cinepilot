import { API_BASE } from "@/config/api";
import type { ProjectOverviewDTO } from "@/lib/dto/overview.dto";
import { apiFetch } from "@/lib/api/server";
/*
const placeholderOverview: ProjectOverviewDTO = {
    id: "1",
    title: "Forrest Gump",
    genre: "Drama",
    pageCount: 104,
    analyzedAt: "2026-08-02",
    stats: {
        scenes: 20,
        characters: 20,
        props: 29,
        flags: 3
    }
};

export async function getProjectOverview(
    projectId: string
): Promise<ProjectOverviewDTO> {
    return placeholderOverview;
}
*/

export async function getProjectOverview(
    projectId: string
): Promise<ProjectOverviewDTO> {
    const [xRes, yRes] = await Promise.all([
        apiFetch(`${API_BASE}/projects/${projectId}`),
        apiFetch(`${API_BASE}/projects/${projectId}/dashboard`)
    ]);

    if (!xRes.ok) throw new Error("Failed to load x");
    if (!yRes.ok) throw new Error("Failed to load y");

    const x = await xRes.json();
    const y = await yRes.json();

    return {
        projectId: x.projectId,
        title: x.title,
        genre: x.genre,
        pageCount: x.pageCount,
        analyzedAt: x.analyzedAt,
        stats: {
            scenes: y.scenes,
            characters: y.characters,
            props: y.props,
            flags: y.flags
        }
    };
}
