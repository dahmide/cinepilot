export interface ProjectOverviewDTO {
    projectId: string;
    title: string;
    genre: string;
    pageCount: number;
    analyzedAt: string;
    stats: {
        scenes: number;
        characters: number;
        props: number;
        flags: number;
    };
}
