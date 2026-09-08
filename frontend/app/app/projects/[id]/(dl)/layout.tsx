import { BreadcrumbSetter } from "@/components/ui/breadcrumb";
import { ProjectOverview, ProjectSwitcher } from "../_components";
import { getProjectOverview } from "@/lib/dal/overview.dal";

export default async function ProjectLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}>) {
    const { id } = await params;
    const overview = await getProjectOverview(id);

    // console.log(overview);
    return (
        <>
            <BreadcrumbSetter
                href={`/projects/${id}`}
                label={overview.title}
            />
            <ProjectOverview {...overview} />
            <ProjectSwitcher />
            {children}
        </>
    );
}
