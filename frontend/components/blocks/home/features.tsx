import {
    RiGitBranchLine,
    RiTimeLine,
    RiStackLine,
    RiUserLine,
} from "react-icons/ri";
import { Section, Container } from "../../layout";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";

const features = [
    {
        number: "01",
        title: "Prop continuity",
        description:
            "Every named object is tracked across the full script. If a prop changes make, disappears without explanation, or reappears inconsistently, CinePilot flags the exact scenes and explains what changed.",
        icon: RiStackLine,
    },
    {
        number: "02",
        title: "Character tracking",
        description:
            "Injuries, costumes, physical descriptions, and emotional states are cross-referenced across appearances. A bandaged hand or a haircut that undoes itself, nothing slips through.",
        icon: RiUserLine,
    },
    {
        number: "03",
        title: "Timeline verification",
        description:
            "Scene timestamps, travel durations, and temporal references are validated against each other. If a character crosses a city in three minutes of script time, the tool will catch it.",
        icon: RiTimeLine,
    },
    {
        number: "04",
        title: "Plot thread analysis",
        description:
            "Our AI layer reads for narrative setup and payoff. If a thread is established, such as a location or a secret revealed, and never addressed again, it surfaces the gap and explains why it matters.",
        icon: RiGitBranchLine,
    },
];
export default function Features() {
    return (
        <Section className="py-18 md:py-26">
            <Container className="flex flex-col gap-4">
                <Eyebrow>Continuity Engine</Eyebrow>
                <h2 className="display-md">Continuity. Made visible.</h2>
                <p>
                    Track important details across your screenplay before they
                    become problems.
                </p>
                <div className="mt-12 grid gap-6 sm:grid-cols-2">
                    {features.map((feature) => (
                        <Card
                            className="transition-colors duration-300 hover:ring-primary/50 hover:bg-card/50"
                            key={feature.number}
                        >
                            <CardHeader>
                                <Badge className="size-12 bg-primary/20 text-primary transition-colors group-hover/card:bg-primary group-hover/card:text-primary-foreground">
                                    <feature.icon className="size-4!" />
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
