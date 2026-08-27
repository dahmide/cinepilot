"use client";

import React from "react";
import { Container } from "@/components/layout";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { TextAlignJustify } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type Breadcrumb = {
    href: string;
    label: string;
};

function createBreadcrumbItems(segments: string[]): Breadcrumb[] {
    return segments.map((segment, index) => ({
        label: formatBreadcrumbLabel(segment),
        href: "/" + segments.slice(0, index + 1).join("/")
    }));
}

function formatBreadcrumbLabel(segment: string): string {
    return decodeURIComponent(segment)
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}

export default function Menubar() {
    const { isMobile, toggleSidebar } = useSidebar();

    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const breadcrumbs = isMobile ? null : createBreadcrumbItems(segments);

    return (
        <header className="h-(--header-height)">
            <Container className="h-full flex items-center justify-between">
                {/* {breadcrumbs ? (
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.href}>
                                    <BreadcrumbItem>
                                        {index === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage>
                                                {crumb.label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink
                                                render={<a href={crumb.href} />}
                                            >
                                                {crumb.label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>

                                    {index !== breadcrumbs.length - 1 && (
                                        <BreadcrumbSeparator />
                                    )}
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                ) : ( */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <TextAlignJustify />
                    </Button>
                    <Logo />
                </div>
                {/*} )} */}
                <Button
                    variant="default"
                    render={<Link href="/app/projects/new">New Project</Link>}
                    nativeButton={false}
                />
            </Container>
        </header>
    );
}
