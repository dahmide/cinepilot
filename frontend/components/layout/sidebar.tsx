import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { FolderOpen, LayoutDashboard, LucideIcon } from "lucide-react";
import Link from "next/link";

const sidebarItems = [
    {
        title: "Overview",
        href: "/overview",
        icon: LayoutDashboard
    },
    {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen
    }
] as const;

export default function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader />
            <SidebarContent>
                <SidebarMenu>
                    {sidebarItems.map(item => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                render={
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                }
                            />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
