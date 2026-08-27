import { API_BASE } from "@/config/api";
import type {
    CharacterEntityDTO,
    PropEntityDTO,
    LocationEntityDTO
} from "@/lib/dto/story.dto";
import { apiFetch } from "@/lib/api/server";

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
