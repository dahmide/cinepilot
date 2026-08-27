import { API_BASE } from "@/config/api";
import type {
    StageEvent,
    UploadCompletePayload,
    UploadErrorPayload
} from "@/lib/dto/upload.dto";

interface UploadCallbacks {
    onStage: (event: StageEvent) => void;
    onComplete: (payload: UploadCompletePayload) => void;
    onError: (payload: UploadErrorPayload) => void;
}

async function processStream(response: Response, callbacks: UploadCallbacks) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
            const eventLine = part.match(/^event: (.+)$/m)?.[1];
            const dataLine = part.match(/^data: (.+)$/m)?.[1];
            if (!eventLine || !dataLine) continue;

            try {
                const data = JSON.parse(dataLine);
                if (eventLine === "stage") callbacks.onStage(data);
                if (eventLine === "complete") callbacks.onComplete(data);
                if (eventLine === "error") callbacks.onError(data);
            } catch {
                callbacks.onError({
                    message: "Failed to parse server response"
                });
            }
        }
    }
}

export async function uploadScreenplay(
    file: File,
    pageCount: number,
    callbacks: UploadCallbacks
): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
        "title",
        file.name.replace(/\.pdf$/i, "").replace(/-/g, " ")
    );
    formData.append("genre", "Unknown");
    formData.append("page_count", String(pageCount));

    try {
        const response = await fetch(`${API_BASE}/upload`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (!response.ok) {
            callbacks.onError({ message: "Upload failed" });
            return;
        }

        await processStream(response, callbacks);
    } catch {
        callbacks.onError({
            message: "Network error — is the server running?"
        });
    }
}

export async function uploadDemo(callbacks: UploadCallbacks): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/upload/demo`, {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            callbacks.onError({ message: "Demo upload failed" });
            return;
        }

        await processStream(response, callbacks);
    } catch {
        callbacks.onError({
            message: "Network error — is the server running?"
        });
    }
}
