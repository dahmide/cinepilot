import { Section, Container } from "../../layout";
import { RiFilmAiLine } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Alert,
    AlertAction,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

export default function Hero() {
    return (
        <Section className="pt-[calc(var(--header-height)+0rem)]">
            <Container className="">
                {/* <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12"> */}
                <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                    <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                        <Badge variant="primary">
                            <RiFilmAiLine className="size-4" />
                            Your AI script supervisor
                        </Badge>
                        <h1 className="display-xl">
                            Nothing gets lost{" "}
                            <em className="text-primary not-italic">
                                Between scenes.
                            </em>
                        </h1>
                        <p className="max-w-5xl">
                            CinePilot tracks the props and story threads in your
                            screenplay, and flags what changes without
                            explanation.
                        </p>
                        <div className="w-full flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
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
                    <div className="relative">
                        <img
                            src="/images/hero-set.jpg"
                            alt="A film set at night, camera rig in the foreground, warm key light cutting through haze"
                            className="aspect-video w-full rounded-md border border-border object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
                        <Alert className="w-auto px-4 py-3 gap-1 absolute bottom-5 left-5 bg-background/70 backdrop-blur-sm">
                            <AlertTitle className="text-xs tracking-widest text-primary uppercase">
                                Scene 42 · INT. Apartment — Night
                            </AlertTitle>
                            <AlertDescription className="text-foreground">
                                Flagged: the whiskey glass is full in shot 3,
                                empty in shot 4.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
