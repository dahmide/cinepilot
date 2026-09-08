import { useContext } from "react";
import { ChatContext } from "@/app/app/projects/[id]/_components/providers/chat-provider";

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within ChatProvider");
    return ctx;
}
