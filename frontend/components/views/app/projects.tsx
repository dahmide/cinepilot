import type { ProjectDTO } from "@/lib/dto/project.dto";
import { Container, Section } from "@/components/layout";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea
} from "@/components/ui/input-group";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle
} from "@/components/ui/empty";
import { ClapperboardIcon } from "lucide-react";
// import Link from "next/link";
import { Link } from "next-view-transitions";

export default function Projects({ projects }: ProjectDTO[]) {
    console.log("Projects: ", projects);
    return (
        <Section className="py-2">
            <Container className="flex flex-col gap-1">
                {projects.length ? (
                    <>
                        <h1>Your projects</h1>
                        <p>{projects.length} screenplays analyzed</p>
                        <div className="mt-4 flex flex-row gap-0">
                            <InputGroup>
                                <InputGroupInput placeholder="Search..." />
                            </InputGroup>
                        </div>
                        <div className="mt-4 flex flex-col gap-4">
                            {projects.map(p => (
                                <Link
                                    key={p.projectId}
                                    href={`projects/${p.projectId}`}
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Card Title</CardTitle>
                                            <CardDescription>
                                                Card Description
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p>Card Content</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ClapperboardIcon />
                            </EmptyMedia>
                            <EmptyTitle>No projects yet.</EmptyTitle>
                            <EmptyDescription>
                                Upload your first screenplay to get started.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button
                                nativeButton={false}
                                render={<Link href="new">New Project</Link>}
                            />
                        </EmptyContent>
                    </Empty>
                )}
            </Container>
        </Section>
    );
}
