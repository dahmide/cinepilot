import {
    Clock3Icon,
    GitBranchIcon,
    PackageCheckIcon,
    UserRoundCheckIcon
} from "lucide-react";
import { Section, Container } from "../../layout";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
    {
        number: "01",
        title: "Prop continuity",
        description:
            "Every named object is tracked across the full script. If a prop changes make, disappears without explanation, or reappears inconsistently, CinePilot flags the exact scenes and explains what changed.",
        icon: PackageCheckIcon
    },
    {
        number: "02",
        title: "Character detail tracking",
        description:
            "Injuries, costumes, physical descriptions, and emotional states are cross-referenced across appearances. A bandaged hand or a haircut that undoes itself, nothing slips through.",
        icon: UserRoundCheckIcon
    },
    {
        number: "03",
        title: "Timeline verification",
        description:
            "Scene timestamps, travel durations, and temporal references are validated against each other. If a character crosses a city in three minutes of script time, the tool will catch it.",
        icon: Clock3Icon
    },
    {
        number: "04",
        title: "Plot thread analysis",
        description:
            "Our AI layer reads for narrative setup and payoff. If a thread is established, such as a location or a secret revealed, and never addressed again, it surfaces the gap and explains why it matters.",
        icon: GitBranchIcon
    }
];
export default function Features() {
    return (
        <Section className="py-18">
            <Container className="flex flex-col gap-4">
                <h2>
                    Continuity.{" "}
                    <span className="text-primary">Made visible.</span>
                </h2>
                <p>
                    Track important details across your screenplay before they
                    become problems.
                </p>
                <div className="mt-4 flex flex-col gap-14">
                    {features.map(feature => (
                        <Card key={feature.number}>
                            <CardHeader>
                                <Badge className="size-12 bg-primary/20 text-primary">
                                    <feature.icon />
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
