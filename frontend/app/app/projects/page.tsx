import { getProjects } from "@/lib/dal/projects.dal";
import Projects from "@/components/views/app/projects";

export default async function ProjectsPage() {
    const projects = await getProjects();
    // console.log("Projects: ", projects);

    return <Projects projects={projects} />;
}
