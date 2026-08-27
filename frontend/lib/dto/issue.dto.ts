export type IssueDTO = {
    issueId: number;
    issueType: "prop" | "character_detail" | "timeline" | "plot_thread";
    introducedScene: number;
    missingByScene: number;
    title: string;
    description: string;
    characters: string[];
};

export type IssueFindingsDTO = {
    establishedLabel: string;
    established: string;
    contradictedLabel: string;
    contradicted: string;
    stakes: string | null;
};

export type IssueDetailDTO = IssueDTO & {
    characterIds: string[];
    propId: string;
    findings: IssueFindingsDTO;
    relatedEntities: string[];
    relatedScenes: number[];
};
