import { Container, Section } from "@/components/layout";
import type { IssueDetailDTO } from "@/lib/dto/issue.dto";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { Link } from 'next-view-transitions'
import { ChevronLeftIcon } from "lucide-react";

const FINDINGS_LABELS: Record<IssueDTO["issueType"], [string, string]> = {
    prop: ["Where it's established", "Where it's contradicted"],
    character_detail: ["Where it's established", "Where it's contradicted"],
    timeline: ["Where it's established", "Where it's contradicted"],
    plot_thread: ["Where it's set up", "Last referenced"]
};

export default function IssueDetail({
    issue,
    projectId
}: {
    issue: IssueDetailDTO;
    projectId: string;
}) {
    const label = FINDINGS_LABELS[issue.issueType];
    return (
        <Section className="py-2">
            <Container className="flex flex-col gap-8">
                <Button
                    variant="link"
                    nativeButton={false}
                    className="w-max p-0! m-0!"
                    render={
                        <Link href=".">
                            <ChevronLeftIcon />
                            Back to Issues
                        </Link>
                    }
                />
                <div className="flex flex-col gap-2">
                    <h1>{issue.title}</h1>
                    <p>{issue.description}</p>
                </div>
                <article className="flex flex-col gap-4">
                    <h2>Findings</h2>
                    <div className="p-4 border-l-4 bg-success/14 text-success">
                        <h3 className="text-inherit">{label[0]}</h3>
                        <p>{issue.findings.established}</p>
                    </div>
                    <div className="p-4 border-l-4 bg-warning/14 text-warning">
                        <h3 className="text-inherit">{label[1]}</h3>
                        <p>{issue.findings.contradicted}</p>
                    </div>
                </article>
                <article className="flex flex-col gap-2">
                    <h2>Involved</h2>
                </article>
            </Container>
        </Section>
    );
}
