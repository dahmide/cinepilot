"use client";

import { Container, Section } from "@/components/layout";
import type { IssueDTO } from "@/lib/dto/issues.dto";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { IssueBadge } from "@/components/blocks/issue/issue-badge";
import Link from "next/link";
// import { Link } from "next-view-transitions";

const items = [
    { label: "All", value: "all" },
    { label: "Prop", value: "prop" },
    { label: "Plot", value: "plot" }
];

export default function Issues({ issues }: { issues: IssueDTO[] }) {
    const [value, setValue] = useState("all");
    const filteredIssueList = issues.filter(issue => {
        if (value === "all") return true;
        return issue.issueType.startsWith(value);
    });
    return (
        <Section className="pt-3 pb-9 md:pt-4 md:pb-12">
            <Container className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2>Continuity Flags</h2>
                    <Select
                        items={items}
                        value={value}
                        onValueChange={setValue}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {items.map(item => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-6">
                    {filteredIssueList.map(issue => (
                        <Link
                            key={issue.issueId}
                            href={`issues/${issue.issueId}`}
                        >
                            <Card>
                                <CardHeader>
                                    <IssueBadge issueType={issue.issueType} />
                                </CardHeader>
                                <CardContent>
                                    <h3 className="line-clamp-1">
                                        {issue.title}
                                    </h3>
                                    <p className="line-clamp-3">
                                        {issue.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
