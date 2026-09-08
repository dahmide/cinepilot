"use client";

import { createContext, useContext, useState } from "react";
import { Message } from "@/lib/dto/chat.dto";
import { askChat } from "@/lib/dal/chat.dal";

type Response = {
    loading: boolean;
    error: string | null;
};
type ChatContextType = {
    messages: Message[];
    response: Response;
    sendMessage: (question: string) => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
    children,
    projectId
}: {
    children: React.ReactNode;
    projectId: string;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [response, setResponse] = useState<Response>({
        loading: false,
        error: null
    });

    const sendMessage = async (question: string) => {
        const you: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: question,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, you]);
        setResponse(prev => ({ ...prev, loading: true, error: null }));

        try {
            const res = await askChat(projectId, question);
            const bot: Message = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: res.answer,
                createdAt: new Date().toISOString()
            };

            console.log("Chat: ", res);
            setMessages(prev => [...prev, bot]);
        } catch (err) {
            setResponse(prev => ({ ...prev, loading: false, error: null }));
        } finally {
            setResponse(prev => ({ ...prev, loading: false, error: null }));
        }
    };

    return (
        <ChatContext.Provider value={{ messages, response, sendMessage }}>
            {children}
        </ChatContext.Provider>
    );
}
