export interface ProjectDTO {
    id: string;
    title: string;
    genre: string | null;
    pages: number | null;
    analyzedAt: string | null; // ISO date string, null while still processing
    status: "processing" | "complete";
    sceneCount: number;
    flagCount: number;
}
