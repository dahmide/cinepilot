import { API_BASE } from "@/config/api";
import type { IssueDTO, IssueDetailDTO } from "@/lib/dto/issues.dto";
import { apiFetch } from "@/lib/api/server";

export async function getIssues(projectId: string): Promise<IssueDTO[]> {
    const url = `${API_BASE}/projects/${projectId}/issues`;
    const res = await apiFetch(url);

    if (!res.ok) {
        throw new Error("Failed to fetch issues");
    }
    return res.json();
}

export async function getIssueDetail(
    projectId: string,
    issueId: string
): Promise<IssueDetailDTO | undefined> {
    const url = `${API_BASE}/projects/${projectId}/issues/${issueId}`;
    const res = await apiFetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch issue ${issueId}`);
    }
    return res.json();
}
