import { Entity } from "@/types";
interface FindingDetail {
    scene: number;
    heading: string | null;
    text: string;
}

export type IssueDTO = {
    issueId: number;
    issueType: "prop" | "character_detail" | "timeline" | "plot_thread";
    introducedScene: number;
    missingByScene: number;
    title: string;
    description: string;
};

export type IssueFindingsDTO = {
    established: FindingDetail;
    contradicted: FindingDetail;
    stakes: string | null;
};

export type IssueDetailDTO = IssueDTO & {
    findings: IssueFindingsDTO;
    involved: {
        characters: Entity[];
        props: Entity[];
        locations: Entity[];
    };
    atAGlance: string[];
};
