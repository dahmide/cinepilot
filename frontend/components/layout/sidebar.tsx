"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    FolderOpenIcon,
    LayoutDashboardIcon,
    LucideIcon,
    PanelLeftIcon,
    SearchIcon,
} from "lucide-react";
import {
    RiDashboardLine,
    RiFolderOpenLine,
    RiLayoutLeftLine,
} from "react-icons/ri";
import Link from "next/link";
import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";

const sidebarItems = [
    {
        title: "Overview",
        href: "overview",
        icon: RiDashboardLine,
    },
    {
        title: "Projects",
        href: "projects",
        icon: RiFolderOpenLine,
    },
] as const;

export default function AppSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname.includes(path);
    const { toggleSidebar } = useSidebar();

    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader className="h-(--header-height)">
                <div className="h-full flex items-center justify-between relative">
                    <div className="flex items-center pl-0 h-8 overflow-clip [overflow-clip-margin:4px] transition-opacity duration-150 opacity-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
                        <Logo />
                    </div>
                    <div className="flex items-center pr-0 absolute top-1/2 right-0 -translate-y-1/2 transition-[right] duration-150">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleSidebar()}
                        >
                            <RiLayoutLeftLine />
                        </Button>
                        {/* <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleSidebar()}
                        >
                            <RiLayoutLeftLine />
                        </Button> */}
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {sidebarItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    isActive={isActive(item.href)}
                                    render={
                                        <Link href={`/app/${item.href}`}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    }
                                />
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="h-(--header-height)">
                <div className="h-full flex items-center justify-between"></div>
            </SidebarFooter>
        </Sidebar>
    );
}
