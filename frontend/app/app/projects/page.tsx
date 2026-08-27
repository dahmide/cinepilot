import Projects from "@/components/views/app/projects";
import { getProjects } from "@/lib/dal/projects.dal";

export default async function ProjectsPage() {
    const projects = await getProjects();
    console.log("Projects: ", projects);

    return <Projects projects={projects} />;
}
