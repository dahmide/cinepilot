"use client";

import { useState } from "react";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import type {
    CharacterEntityDTO,
    PropEntityDTO,
    LocationEntityDTO
} from "@/lib/dto/story.dto";

type EntityCardProps =
    | { kind: "character"; entity: CharacterEntityDTO }
    | { kind: "prop"; entity: PropEntityDTO }
    | { kind: "location"; entity: LocationEntityDTO };

export function EntityCard(props: EntityCardProps) {
    const [open, setOpen] = useState(false);
    const { kind, entity } = props;

    const name =
        kind === "character"
            ? entity.characterName
            : kind === "prop"
              ? entity.propName
              : entity.locationName;

    const subtitle =
        kind === "character"
            ? `S${entity.firstScene} • ${entity.appearsIn.length} appearances`
            : kind === "location"
              ? `S${entity.firstScene} • ${entity.appearsIn.length} scenes`
              : `S${entity.introducedScene} • Last seen S${entity.lastSeenScene}`;

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="rounded-lg border border-border bg-card"
        >
            <CollapsibleTrigger className="flex w-full items-start justify-between gap-4 p-4 text-left">
                <div>
                    <h3 className="font-medium">{name}</h3>
                    <span className="font-mono text-xs text-muted-foreground">
                        {subtitle}
                    </span>
                </div>
                <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <Separator />
                <dl className="flex flex-col gap-4 p-4">
                    {kind === "character" && (
                        <>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Appears In
                                </dt>
                                <dd className="font-mono text-sm">
                                    {entity.appearsIn
                                        .map(s => `S${s}`)
                                        .join(", ")}
                                </dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Locations
                                </dt>
                                <dd>
                                    <ul className="flex flex-col gap-1">
                                        {entity.locations.map(l => (
                                            <li
                                                key={l}
                                                className="text-sm before:mr-2 before:text-muted-foreground before:content-['•']"
                                            >
                                                {l}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Props
                                </dt>
                                <dd>
                                    <ul className="flex flex-col gap-1">
                                        {entity.props.map(p => (
                                            <li
                                                key={p}
                                                className="text-sm before:mr-2 before:text-muted-foreground before:content-['•']"
                                            >
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </div>
                        </>
                    )}

                    {kind === "prop" && (
                        <>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Introduced
                                </dt>
                                <dd className="font-mono text-sm">
                                    Scene {entity.introducedScene}
                                </dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Seen In
                                </dt>
                                <dd className="font-mono text-sm">
                                    {entity.seenIn.map(s => `S${s}`).join(", ")}
                                </dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Associated Characters
                                </dt>
                                <dd>
                                    <ul className="flex flex-col gap-1">
                                        {entity.associatedCharacters.map(c => (
                                            <li
                                                key={c}
                                                className="text-sm before:mr-2 before:text-muted-foreground before:content-['•']"
                                            >
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </div>
                        </>
                    )}

                    {kind === "location" && (
                        <>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Appears In
                                </dt>
                                <dd className="font-mono text-sm">
                                    {entity.appearsIn
                                        .map(s => `S${s}`)
                                        .join(", ")}
                                </dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Characters
                                </dt>
                                <dd>
                                    <ul className="flex flex-col gap-1">
                                        {entity.characters.map(c => (
                                            <li
                                                key={c}
                                                className="text-sm before:mr-2 before:text-muted-foreground before:content-['•']"
                                            >
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Props
                                </dt>
                                <dd>
                                    <ul className="flex flex-col gap-1">
                                        {entity.props.map(p => (
                                            <li
                                                key={p}
                                                className="text-sm before:mr-2 before:text-muted-foreground before:content-['•']"
                                            >
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </div>
                        </>
                    )}
                </dl>
            </CollapsibleContent>
        </Collapsible>
    );
}
