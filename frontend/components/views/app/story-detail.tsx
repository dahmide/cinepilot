import React from "react";
import { Container, Section } from "@/components/layout";
import { StoryEntityDetailDTO } from "@/lib/dto/story.dto";
// import Link from "next/link";
import {
    RiArrowLeftSLine,
    RiCheckLine,
    RiErrorWarningLine,
} from "react-icons/ri";
import { Link } from "next-view-transitions";
import { LinkButton } from "@/components/ui/link-button";
import { RiBriefcaseLine, RiMapPinLine, RiUserLine } from "react-icons/ri";
import { Entity } from "@/types";
import { IconType } from "react-icons";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/common/entity-card";
import { EntityChip } from "@/components/common/entity-chip";

const ICONS: Record<Entity["type"], IconType> = {
    prop: RiBriefcaseLine,
    character: RiUserLine,
    location: RiMapPinLine,
};

export default function StoryDetail({
    id: projectId,
    entityId,
    entityType,
    entity,
}: {
    id: string;
    entityId: string;
    entityType: Entity["type"];
    entity: StoryEntityDetailDTO;
}) {
    const Icon = ICONS[entityType];
    return (
        <div className="pb-10">
            <Container className="flex flex-col gap-10">
                <header className="flex flex-col gap-4">
                    <LinkButton href={`/app/projects/${projectId}/story`}>
                        <RiArrowLeftSLine />
                        Back to Story
                    </LinkButton>
                    <div className="flex flex-col gap-2">
                        <p className="inline-flex gap-2 items-center label">
                            <Icon className="h-lh" />
                            <span>{entity.meta}</span>
                        </p>
                        <h1>{entity.name}</h1>
                        <p className="inline-flex gap-2 items-center space"></p>
                        <p>{entity.intro}</p>
                    </div>
                </header>
                <Section className="">
                    <h2 className="font-hero">
                        Continuity Flags ({entity.relatedIssues.length})
                    </h2>
                    <div className="mt-4 flex flex-col gap-2">
                        {entity.relatedIssues.length < 1 && (
                            <span>
                                No continuity issues associated with{" "}
                                {entity.name}.
                            </span>
                        )}
                        {entity.relatedIssues.map((related) => (
                            <Link
                                href={`/app/projects/${projectId}/`}
                                key={related}
                            ></Link>
                        ))}
                    </div>
                </Section>
                <Section className="">
                    <h2 className="font-hero">At A Glance</h2>
                    <ul className="mt-4 space-y-2">
                        {entity.atAGlance.map((fact, i) => (
                            <li
                                key={i}
                                className="flex gap-3 text-sm leading-relaxed"
                            >
                                <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-primary" />
                                <span>{fact}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
                <Section className="">
                    <h2 className="font-hero">Sub Facts</h2>
                    <ul className="mt-4 space-y-2">
                        {entity.subFacts.map((fact, i) => (
                            <li
                                key={i}
                                className="flex gap-3 text-sm leading-relaxed"
                            >
                                <RiCheckLine className="mt-0.5 size-4 shrink-0 text-primary" />
                                <span>{fact}</span>
                            </li>
                        ))}
                    </ul>
                </Section>
                <Section className="">
                    <h2 className="font-hero">Related</h2>
                    <div className="mt-4 space-x-2">
                        {entity.relatedEntities.map((related) => (
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
