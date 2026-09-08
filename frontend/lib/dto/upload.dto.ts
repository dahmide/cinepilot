export type UploadStage =
    | "uploading"
    | "reading_script"
    | "building_memory"
    | "checking_issues";

export interface StageEvent {
    stage: UploadStage;
    message: string;
}

export interface UploadCompletePayload {
    status: "success";
    projectId: string;
}

export interface UploadErrorPayload {
    message: string;
}
