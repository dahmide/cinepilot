import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar, Menubar } from "@/components/layout";
import { BreadcrumbProvider } from "@/components/ui/breadcrumb";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <BreadcrumbProvider>
            <SidebarProvider>
                <Sidebar />
                {/* <SidebarInset> */}
                <main className="w-full">
                    <div className="p-2">
                        <Menubar />
                    </div>
                    {children}
                </main>
                {/* </SidebarInset> */}
            </SidebarProvider>
        </BreadcrumbProvider>
    );
}
