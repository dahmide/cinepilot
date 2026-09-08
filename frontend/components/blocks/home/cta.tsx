import { Section, Container } from "../../layout";
import { Button } from "@/components/ui/button";
import { CircleSmallIcon } from "lucide-react";

const ctaIndicators = [
    { id: 1, label: "PDF upload" },
    { id: 2, label: "Free to try" },
    { id: 3, label: "Results in minutes" },
];
export default function Cta() {
    return (
        <Section className="py-18 grain relative overflow-hidden bg-primary text-background md:py-26">
            <Container className="flex flex-col gap-4 items-center justify-center text-center">
                <h2 className="display-md text-inherit">
                    Start tracking your next screenplay.
                </h2>
                <p className="text-primary-foreground/80">
                    Quick signup. Then upload and see what it finds.
                </p>
                <div className="mt-9 flex flex-col-reverse gap-3 self-stretch md:mt-10 md:flex-row md:self-center">
                    <Button variant="outline" size="lg" className="bg-transparent">
                        Learn more
                    </Button>
                    <Button variant="outline" size="lg" className="bg-transparent">
                        Get started
                    </Button>
                </div>
                {/*
                <ul className="mt-6 flex flex-row-reverse gap-3 self-stretcm md:mt-10 md:flex-row md:self-center">
                    {ctaIndicators.map(indicator => (
                        <li className="inline-flex gap-px" key={indicator.id}>
                            <CircleSmallIcon className="w-4 h-lh" />
                            <span>{indicator.label}</span>
                        </li>
                    ))}
                </ul>
                */}
            </Container>
        </Section>
    );
}
