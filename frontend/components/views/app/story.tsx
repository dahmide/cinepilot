"use client";

import { StoryEntityDTO } from "@/lib/dto/story.dto";
import { Container, Section } from "@/components/layout";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
    RadioGroup,
    RadioGroupItem,
    RadioGroupLabel,
} from "@/components/ui/radio-group";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
// import { Link } from "next-view-transitions";
import {
    RiArrowDownSLine,
    RiSearchLine,
    RiSortAsc,
    RiSortDesc,
} from "react-icons/ri";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

type Option = (typeof options)[number];
const options = ["props", "characters", "locations"] as const;

export default function Story({
    characters,
    props,
    locations,
}: StoryEntityDTO) {
    const [option, setOption] = useState<Option>("props");
    const list = {
        characters: characters,
        props: props,
        locations: locations,
    }[option];

    return (
        <Section className="pt-3 pb-9 md:pt-4 md:pb-12">
            <Container className="flex flex-col gap-4">
                <div className="mb-4 flex flex-col gap-2">
                    <h2>Story Bible</h2>
                </div>
                <div className="mb-4 flex flex-row gap-9">
                    <InputGroup>
                        <div className="flex-1 inline-flex items-center gap-2">
                            <Separator orientation="vertical" />
                            <InputGroupInput
                                placeholder={`Search ${option}...`}
                            />
                        </div>
                        <InputGroupAddon>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className="w-30 p-2 shrink-0 inline-flex items-center justify-between gap-2"
                                    openOnHover={false}
                                >
                                    <span className="capitalize">{option}</span>
                                    <span className="capitalize">
                                        <RiArrowDownSLine />
                                    </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="bottom"
                                    sideOffset={20}
                                    className="w-56 p-2"
                                >
                                    {/* <DropdownMenuGroup> */}
                                    <RadioGroup
                                        value={option}
                                        onValueChange={setOption}
                                        className="flex flex-col gap-4"
                                    >
                                        {options.map((opt) => (
                                            <RadioGroupLabel key={opt}>
                                                {opt}
                                            </RadioGroupLabel>
                                        ))}
                                    </RadioGroup>
                                    {/* </DropdownMenuGroup> */}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </InputGroupAddon>
                        <InputGroupAddon align="inline-end">
                            {list.length} results
                        </InputGroupAddon>
                    </InputGroup>
                    {/* 
                    <div className="flex flex-row gap-2">
                        <Button className="size-12" variant="outline">
                            <RiSortAsc />
                        </Button>
                        <Button className="size-12" variant="outline">
                            <RiSortAsc />
                        </Button>
                    </div>
                     */}
                </div>
                <div className="grid grid-cols gap-6 md:grid-cols-2">
                    {option === "props" &&
                        props.map((prop) => (
                            <Link
                                href={`story/prop/${prop.propId}`}
                                key={prop.propId}
                                className="h-32"
                            >
                                <Card className="h-full">
                                    <CardContent>
                                        <h3>{prop.propName}</h3>
                                        <p className="line-clamp-3">
                                            {prop.intro}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    {option === "characters" &&
                        characters.map((char) => (
                            <Link
                                href={`story/character/${char.characterId}`}
                                key={char.characterId}
                                className="h-32"
                            >
                                <Card className="h-full">
                                    <CardContent>
                                        <h3>{char.characterName}</h3>
                                        <p className="line-clamp-3">
                                            {char.intro}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    {option === "locations" &&
                        locations.map((loc) => (
                            <Link
                                href={`story/location/${loc.locationId}`}
                                key={loc.locationId}
                                className="h-32"
                            >
                                <Card className="h-full">
                                    <CardContent>
                                        <h3>{loc.locationName}</h3>
                                        <p className="line-clamp-3">
                                            {loc.intro}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                </div>
            </Container>
        </Section>
    );
}
