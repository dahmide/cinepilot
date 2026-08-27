import { Section, Container } from "../../layout";
import { AstroidIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <Section className="pt-[calc(var(--header-height)+0rem)]">
            <Container>
                <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                    <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                        <Badge variant="outline">
                            <AstroidIcon className="size-4" />
                            Your AI script supervisor
                        </Badge>
                        <h1 className="display-xl">
                            Nothing gets lost between scenes.
                        </h1>
                        <p className="max-w-5xl">
                            CinePilot tracks the props and story threads in your
                            screenplay, and flags what changes without
                            explanation.
                        </p>
                        <div className="w-full flex flex-col justify-center gap-2 sm:flex-row lg:justify-start">
                            <Button
                                variant="default"
                                size="lg"
                                nativeButton={false}
                                className="w-full sm:w-auto"
                                render={<a href="#">Browse Components</a>}
                            />
                            <Button
                                variant="outline"
                                size="lg"
                                nativeButton={false}
                                className="w-full sm:w-auto"
                                render={<a href="#">Browse Components</a>}
                            />
                        </div>
                    </div>
                    <div>
                        <img
                            src={null}
                            alt={null}
                            className="aspect-video w-full rounded-md border border-border object-cover object-top"
                        />
                    </div>
                </div>
            </Container>
        </Section>
    );
}
