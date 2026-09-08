"use client";

import { useState } from "react";
import { Section, Container } from "../../layout";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Eyebrow } from "@/components/ui/eyebrow";

type Value = number;

const howItWorks = [
    {
        number: "01",
        title: "Upload your draft",
        description:
            "Drop in a PDF or Final Draft file. CinePilot parses the script structure, including scenes, characters, and action lines, without any manual tagging on your part.",
        meta: "Supports .pdf, .fdx, .fountain",
        image: 1,
    },
    {
        number: "02",
        title: "The engine runs 16 passes",
        description:
            "Rule-based checks scan props, costumes, character details, and timestamps. A second AI pass reads for narrative thread consistency, including setups without payoffs and paths without setups.",
        meta: "Typically completes in under 90 seconds",
        image: 2,
    },
    {
        number: "03",
        title: "Read the findings",
        description:
            "Each issue is presented as a brief editorial piece: what was found, where it appears in the script, and why it matters. Script excerpts are pulled verbatim, with no paraphrasing or guessing.",
        meta: "Exact page and scene references throughout",
        image: 3,
    },
    {
        number: "04",
        title: "Resolve and re-run",
        description:
            "Mark issues resolved or dismissed as you revise. Re-upload the new draft and CinePilot will compare against the previous run, flagging regressions and confirming fixes.",
        meta: "Cross-draft comparison included",
        image: 4,
    },
];
export default function HowItWorks() {
    const [api, setApi] = useState<CarouselApi | undefined>(undefined);
    const [val, setVal] = useState<Value[]>([0]);

    const loopValChange = (v: Value[]) => {
        let value = v[0];
        if (value) {
            let idx = Number(value) - 1;
            api?.scrollTo(idx);
        }
        setVal([value]);
    };
    return (
        <Section className="py-18 md:py-26">
            <Container className="flex flex-col gap-4">
                <Eyebrow>The workflow</Eyebrow>
                <h2 className="display-md">
                    From screenplay to story intelligence.
                </h2>
                <p>
                    Upload your script, and CinePilot maps its characters,
                    props, costumes, locations, and timelines. It then tracks
                    them across scenes to surface inconsistencies and give you
                    the evidence to verify them.
                </p>
                <div className="mt-12 flex flex-col-reverse gap-4 md:flex-row md:gap-12">
                    <div className="md:flex-1">
                        <Accordion
                            value={val}
                            onValueChange={(v) => loopValChange(v)}
                        >
                            {howItWorks.map((step) => (
                                <AccordionItem
                                    key={step.number}
                                    value={step.number}
                                >
                                    <AccordionTrigger>
                                        <span className="flex items-baseline gap-4">
                                            <span className="font-head text-primary text-lg">
                                                {step.number}
                                            </span>
                                            <span className="font-body text-surface text-sm">
                                                {step.title}
                                            </span>
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p>{step.description}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                    <div className="md:flex-1">
                        <Carousel setApi={setApi}>
                            <CarouselContent>
                                {howItWorks.map((step) => (
                                    <CarouselItem key={step.number}>
                                        <div className="aspect-video">
                                            {step.image}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
