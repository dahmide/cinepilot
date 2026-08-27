import { ChatProvider } from "./_components/providers/chat-provider";
import { ProjectChatPane } from "./_components";

export default async function ProjectLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}>) {
    const { id } = await params;

    return (
        <ChatProvider projectId={id}>
            {children}
            <ProjectChatPane />
        </ChatProvider>
    );
}
