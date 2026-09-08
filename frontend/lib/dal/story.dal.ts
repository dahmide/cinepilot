import { API_BASE } from "@/config/api";
import type {
    CharacterEntityDTO,
    PropEntityDTO,
    LocationEntityDTO,
    StoryEntityDetailDTO,
} from "@/lib/dto/story.dto";
import { apiFetch } from "@/lib/api/server";
import { Entity } from "@/types";

export async function getStory(projectId: string): Promise<{
    characters: CharacterEntityDTO[];
    props: PropEntityDTO[];
    locations: LocationEntityDTO[];
}> {
    const url = `${API_BASE}/projects/${projectId}/story`;
    const res = await apiFetch(url);

    if (!res.ok) throw new Error("Failed to load story data");
    return res.json();
}

export async function getStoryEntityDetail(
    projectId: string,
    entityType: Entity["type"],
    entityId: string
): Promise<StoryEntityDetailDTO> {
    const url = `${API_BASE}/projects/${projectId}/story/${entityType}/${entityId}`;
    const res = await apiFetch(url);

    if (!res.ok) throw new Error("Failed to load entity detail");
    return res.json();
}
