"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Container, Section } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "next-view-transitions";

export default function ProjectSwitcher() {
    const pathname = usePathname();
    const [tab, setTab] = useState(() => {
        return pathname.split("/").filter(Boolean).pop();
    });

    console.log(tab);
    return (
        <Section className="py-2">
            <Container className="flex flex-col">
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList variant="line">
                        <TabsTrigger
                            value="issues"
                            nativeButton={false}
                            render={<Link href="issues">Issues</Link>}
                        />
                        <TabsTrigger
                            value="story"
                            nativeButton={false}
                            render={<Link href="story">Story</Link>}
                        />
                    </TabsList>
                </Tabs>
            </Container>
        </Section>
    );
}
