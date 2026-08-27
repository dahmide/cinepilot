import { API_BASE } from "@/config/api";
import type { ChatDTO } from "@/lib/dto/chat.dto";
import { apiFetch } from "@/lib/api/client";

export async function askChat(id: string, question: string): Promise<ChatDTO> {
    const res = await apiFetch(`${API_BASE}/projects/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, question })
    });
    if (!res.ok) throw new Error("Failed to get chat response");
    return res.json();
}
