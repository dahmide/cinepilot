"use client";

import { useChat } from "@/hooks/use-chat";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/ui/kbd";
import {
    BotIcon,
    ArrowUpIcon,
    CommandIcon,
    SendIcon,
    MessageCircleIcon,
    UserIcon
} from "lucide-react";
import {
    Message,
    MessageAvatar,
    MessageHeader,
    MessageContent
} from "@/components/ui/message";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle
} from "@/components/ui/empty";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const PREVIEW_LENGTH = 180;

export default function ProjectChatPane() {
    const { messages, response, sendMessage } = useChat();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const elem = e.currentTarget;
        if (!elem) return;

        const form = new FormData(elem);
        const text = form.get("question") as string;

        if (!text) return;
        console.log("Question: ", text);

        elem.reset();
        sendMessage(text);
    };
    return (
        <Sheet>
            <SheetTrigger
                className="flex items-center gap-2 fixed bottom-5 right-5"
                nativeButton={true}
                render={
                    <Button variant="outline">
                        <span>Ask AI</span>
                        <Separator orientation="vertical" />
                        <span>⌘ I</span>
                    </Button>
                }
            />
            <SheetContent className="">
                <SheetHeader>
                    <SheetTitle>AI Chat</SheetTitle>
                    <SheetDescription>Cinepilot AI Assistant</SheetDescription>
                </SheetHeader>
                <div className="flex-1 px-4 no-scrollbar overflow-y-auto">
                    {messages.length ? (
                        <div className="flex flex-1 flex-col gap-3">
                            {messages.map(message => (
                                <Message key={message.id}>
                                    <MessageContent>
                                        <MessageHeader>
                                            {message.role === "user" ? (
                                                <Badge variant="outline">
                                                    You
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Bot
                                                </Badge>
                                            )}
                                        </MessageHeader>
                                        <Bubble>
                                            <BubbleContent>
                                                <span>{message.content}</span>
                                            </BubbleContent>
                                        </Bubble>
                                    </MessageContent>
                                </Message>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center">
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <MessageCircleIcon />
                                    </EmptyMedia>
                                    <EmptyTitle>Start a new chat</EmptyTitle>
                                </EmptyHeader>
                            </Empty>
                        </div>
                    )}
                </div>
                <SheetFooter>
                    <form onSubmit={handleSubmit}>
                        <InputGroup>
                            <InputGroupTextarea
                                name="question"
                                placeholder="Ask about this screenplay..."
                                className="min-h-[1lh]"
                            />
                            <InputGroupAddon
                                className="self-end"
                                align="inline-end"
                            >
                                <InputGroupButton
                                    className="rounded-full"
                                    size="icon-sm"
                                    type="submit"
                                    variant="outline"
                                    disabled={response.loading}
                                >
                                    {response.loading ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <ArrowUpIcon />
                                            <span className="sr-only">
                                                Send question
                                            </span>
                                        </>
                                    )}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </form>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
