import React from "react";
import { Container, Section } from "@/components/layout";
import type { IssueDetailDTO } from "@/lib/dto/issue.dto";
import { RiArrowLeftSLine, RiErrorWarningLine } from "react-icons/ri";
import { LinkButton } from "@/components/ui/link-button";
import { EntityCard } from "@/components/common/entity-card";
import { EntityChip } from "@/components/common/entity-chip";

const FINDINGS_LABELS: Record<IssueDetailDTO["issueType"], [string, string]> = {
    prop: ["Where it's established", "Where it's contradicted"],
    character_detail: ["Where it's established", "Where it's contradicted"],
    timeline: ["Where it's established", "Where it's contradicted"],
    plot_thread: ["Where it's set up", "Last referenced"],
};

export default function IssueDetail({
    issue,
    projectId,
}: {
    issue: IssueDetailDTO;
    projectId: string;
}) {
    const label = FINDINGS_LABELS[issue.issueType];
    return (
        <div className="pb-10">
            <Container className="flex flex-col gap-10">
                <header className="flex flex-col gap-4">
                    <LinkButton href=".">
                        <RiArrowLeftSLine />
                        Back to Issues
                    </LinkButton>
                    <div className="flex flex-col gap-2">
                        <h1>{issue.title}</h1>
                        <p>{issue.description}</p>
                    </div>
                </header>
                <Section className="">
                    <h2 className="font-hero">Findings</h2>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <article className="p-4 border-l-4 border-l-evidence rounded-none bg-card text-evidence">
                            <h3 className="text-inherit">{label[0]}</h3>
                            <p className="mt-4">
                                {issue.findings.contradicted.heading}
                            </p>
                            <p className="mt-2">
                                {`Scene ${issue.findings.established.scene}: ${issue.findings.established.text}`}
                            </p>
                        </article>
                        <article className="p-4 border-l-4 border-l-conflict rounded-none bg-card text-conflict">
                            <h3 className="text-inherit">{label[1]}</h3>
                            <p className="mt-4">
                                {issue.findings.contradicted.heading}
                            </p>
                            <p className="mt-2">
                                {`Scene ${issue.findings.contradicted.scene}: ${issue.findings.contradicted.text}`}
                            </p>
                        </article>
                    </div>
                </Section>
                <Section className="">
                    <h2 className="font-hero">At a Glance</h2>
                    <ul className="mt-4 space-y-2">
                        {issue.atAGlance.map((line) => (
                            <li
                                key={line}
                                className="flex gap-3 text-sm leading-relaxed"
                            >
                                <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-primary" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
                <Section className="">
                    <h2 className="font-hero">Involved</h2>
                    <div className="mt-4 space-x-2">
                        {issue.involved.props.map((related) => (
                            <EntityChip
                                key={related.id}
                                projectId={projectId}
                                {...related}
                            />
                        ))}
                        {issue.involved.characters.map((related) => (
                            <EntityChip
                                key={related.id}
                                projectId={projectId}
                                {...related}
                            />
                        ))}
                        {issue.involved.locations.map((related) => (
                            <EntityChip
                                key={related.id}
                                projectId={projectId}
                                {...related}
                            />
                        ))}
                    </div>
                </Section>
            </Container>
        </div>
    );
}
