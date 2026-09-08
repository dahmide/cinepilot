export interface ChatDTO {
    answer: string;
    question: string;
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}
