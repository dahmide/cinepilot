import { StoryEntityDTO } from "@/lib/dto/story.dto";
import { Container, Section } from "@/components/layout";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import Link from "next/link";
// import { Link } from "next-view-transitions";

interface CharacterMetaInput {
    firstScene: number;
    appearsIn: number[];
}

export function buildCharMeta(entity: CharacterMetaInput): string {
    return `First appears S${entity.firstScene} · ${entity.appearsIn.length} scene${entity.appearsIn.length !== 1 ? "s" : ""}`;
}

interface PropMetaInput {
    introducedScene: number;
    lastSeenScene: number;
    category: string;
}

export function buildPropMeta(entity: PropMetaInput): string {
    const span = `Sc. ${entity.introducedScene} → Sc. ${entity.lastSeenScene}`;
    return entity.category === "costume" ? `Costume · ${span}` : span;
}

interface LocationMetaInput {
    firstScene: number;
    appearsIn: number[];
}

export function buildLocMeta(entity: LocationMetaInput): string {
    return `First appears S${entity.firstScene} · ${entity.appearsIn.length} scene${entity.appearsIn.length !== 1 ? "s" : ""}`;
}

export default function Story({
    characters,
    props,
    locations
}: StoryEntityDTO) {
    return (
        <Section className="pt-3 pb-9 md:pt-4 md:pb-12">
            <Container className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <h2>Story Bible</h2>
                    <p></p>
                </div>
                <Accordion defaultValue={["char"]}>
                    <AccordionItem value="char">
                        <AccordionTrigger>
                            Characters ({characters.length})
                        </AccordionTrigger>
                        <AccordionContent className="py-4 flex flex-col gap-6">
                            {characters.map((char, i) => (
                                <Link
                                    key={`char-${i}`}
                                    href={`characters/${char.characterId}`}
                                >
                                    <Card>
                                        <CardContent>
                                            <h3>{char.characterName}</h3>
                                            <p className="line-clamp-3">
                                                {char.intro}
                                            </p>
                                            <p>
                                                {buildCharMeta({
                                                    firstScene: char.firstScene,
                                                    appearsIn: char.appearsIn
                                                })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="prop">
                        <AccordionTrigger>
                            Props ({props.length})
                        </AccordionTrigger>
                        <AccordionContent className="py-4 flex flex-col gap-6">
                            {props.map((prop, i) => (
                                <Link
                                    key={`prop-${i}`}
                                    href={`props/${prop.propId}`}
                                >
                                    <Card>
                                        <CardContent>
                                            <h3>{prop.propName}</h3>
                                            <p className="line-clamp-3">
                                                {prop.intro}
                                            </p>
                                            <p>
                                                {buildPropMeta({
                                                    introducedScene:
                                                        prop.introducedScene,
                                                    lastSeenScene:
                                                        prop.lastSeenScene,
                                                    category: prop.category
                                                })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="loc">
                        <AccordionTrigger>
                            Locations ({locations.length})
                        </AccordionTrigger>
                        <AccordionContent className="py-4 flex flex-col gap-6">
                            {locations.map((loc, i) => (
                                <Link
                                    key={`loc-${i}`}
                                    href={`locations/${loc.locationId}`}
                                >
                                    <Card>
                                        <CardContent>
                                            <h3>{loc.locationName}</h3>
                                            <p className="line-clamp-3">
                                                {loc.intro}
                                            </p>
                                            <p>
                                                {buildLocMeta({
                                                    firstScene: loc.firstScene,
                                                    appearsIn: loc.appearsIn
                                                })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Container>
        </Section>
    );
}
