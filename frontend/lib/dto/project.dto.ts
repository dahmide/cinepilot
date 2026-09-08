export interface ProjectDTO {
    projectId: string;
    title: string;
    genre: string | null;
    pages: number | null;
    analyzedAt: string;
}
