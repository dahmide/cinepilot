import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar, Menubar } from "@/components/layout";

export default function Layout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <Sidebar />
            <main className="w-full">
                <Menubar />
                {children}
            </main>
        </SidebarProvider>
    );
}
