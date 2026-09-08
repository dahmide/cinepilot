import Issues from "@/components/views/app/issues";
import { getIssues } from "@/lib/dal/issues.dal";
import { BreadcrumbSetter } from "@/components/ui/breadcrumb";

export default async function IssuesPage({
    params
}: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = await params;
    const issues = await getIssues(id);

    // console.log(issues);
    return <Issues issues={issues} />;
}
