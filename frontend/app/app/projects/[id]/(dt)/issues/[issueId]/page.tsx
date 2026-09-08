import { getIssueDetail } from "@/lib/dal/issues.dal";
import IssueDetail from "@/components/views/app/issue-detail";

export default async function IssueDetailPage({
    params
}: Readonly<{
    params: Promise<{ id: string; issueId: string }>;
}>) {
    const { id, issueId } = await params;
    const issue = await getIssueDetail(id, issueId);

    // console.log(issue);
    return <IssueDetail issue={issue} projectId={id} />;
}
