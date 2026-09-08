import { Container, Section } from "@/components/layout";
import { ProjectOverviewDTO } from "@/lib/dto/overview.dto";
import {
    ButtonGroup,
    ButtonGroupSeparator,
    ButtonGroupText
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { RefreshCwIcon, EllipsisVerticalIcon } from "lucide-react";

export default function ProjectOverview({
    title,
    genre,
    pageCount,
    analyzedAt,
    stats
}: ProjectOverviewDTO) {
    const newTitle = title.split(" ")[0];
    return (
        <Section className="py-2">
            <Container className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                    <h1>{newTitle}</h1>
                    <div className="flex items-center gap-2">
                        <ButtonGroup>
                            <Button variant="outline" size="icon">
                                <RefreshCwIcon />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    data-slot="button"
                                    render={
                                        <Button variant="outline" size="icon">
                                            <EllipsisVerticalIcon />
                                        </Button>
                                    }
                                />
                                <DropdownMenuContent></DropdownMenuContent>
                            </DropdownMenu>
                        </ButtonGroup>
                    </div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-px">
                    <dt>Genre</dt>
                    <dd>{genre}</dd>

                    <dt>Pages</dt>
                    <dd>{pageCount}pp</dd>

                    <dt>Analyzed</dt>
                    <dd>{analyzedAt}</dd>
                </dl>
            </Container>
        </Section>
    );
}
