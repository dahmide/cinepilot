import { Section, Container } from "../../layout";
import { Button } from "@/components/ui/button";
import { CircleSmallIcon } from "lucide-react";

const ctaIndicators = [
    { id: 1, label: "PDF upload" },
    { id: 2, label: "Free to try" },
    { id: 3, label: "Results in minutes" }
];
export default function Cta() {
    return (
        <Section className="py-12 bg-[#C79A16]">
            <Container className="flex flex-col gap-2 justify-center text-center">
                <h2 className="text-display-sm">
                    Start tracking your next screenplay.
                </h2>
                <p className="text-white/80">
                    Quick signup. Then upload and see what it finds.
                </p>
                <div className="mt-8 flex flex-col-reverse gap-3 self-stretch md:mt-10 md:flex-row md:self-center">
                    <Button variant="default" size="lg" className="">
                        Learn more
                    </Button>
                    <Button variant="default" size="lg" className="bg-white">
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
