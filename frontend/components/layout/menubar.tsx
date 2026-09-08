"use client";

import React from "react";
import { Container } from "@/components/layout";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    useBreadcrumb,
} from "@/components/ui/breadcrumb";
import { HomeIcon, TextAlignJustify } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
    RiBookOpenLine,
    RiErrorWarningLine,
    RiFileLine,
    RiFolderLine,
    RiLayoutLine,
} from "react-icons/ri";

const breadcrumbConfig = {
    app: {
        label: "Overview",
        icon: RiLayoutLine,
    },
    projects: {
        label: "Projects",
        icon: RiFolderLine,
    },
    new: {
        label: "New",
        icon: RiFileLine,
    },
    issues: {
        label: "Issues",
        icon: RiErrorWarningLine,
    },
    story: {
        label: "Story",
        icon: RiBookOpenLine,
    },
};

export default function Menubar() {
    const { get } = useBreadcrumb();

    const pathname = usePathname();
    const segments = pathname
        .split("/")
        .filter(Boolean)
        .filter((segment) => segment !== "app");

    const breadcrumbs = get(segments, breadcrumbConfig);

    // console.log("Breadcrumbs: ", breadcrumbs);

    return (
        <header className="h-(--header-height)">
            <Container className="h-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Mobile View: Shows Trigger + Logo on small screens, hidden on desktop */}
                    <div className="flex items-center gap-2 md:hidden">
                        <SidebarTrigger
                            render={
                                <Button variant="outline" size="icon">
                                    <TextAlignJustify />
                                </Button>
                            }
                        />
                        <Logo />
                    </div>

                    {/* Desktop View: Shows Breadcrumbs on medium+ screens, hidden on mobile */}
                    {breadcrumbs && (
                        <Breadcrumb className="hidden md:flex">
                            <BreadcrumbList>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={crumb.href}>
                                        <BreadcrumbItem>
                                            {index ===
                                            breadcrumbs.length - 1 ? (
                                                <BreadcrumbPage>
                                                    {crumb.label}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink
                                                    className="flex items-center gap-1.5"
                                                    render={
                                                        <Link
                                                            href={`/app${crumb.href}`}
                                                        />
                                                    }
                                                >
                                                    {crumb.icon && (
                                                        <crumb.icon className="size-4" />
                                                    )}
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
                    )}
                </div>
                <Button
                    variant="default"
                    render={<Link href="/app/projects/new">New Project</Link>}
                    nativeButton={false}
                />
            </Container>
        </header>
    );
}
