import { Entity } from "@/types";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import {
    RiBriefcaseLine,
    RiClapperboardLine,
    RiMapPinLine,
    RiShirtLine,
    RiUserLine,
} from "react-icons/ri";
import { cn } from "@/lib/cn";

type EntityProps = Entity & {
    projectId: string;
    className?: string;
};

const ICONS = {
    character: RiUserLine,
    prop: RiBriefcaseLine,
    costume: RiShirtLine,
    location: RiMapPinLine,
    scene: RiClapperboardLine,
} as const;

export function EntityCard({
    id,
    name,
    type,
    projectId,
    className,
}: EntityProps) {
    const Icon = ICONS[type];
    return (
        <Link
            className={cn("group/entity", className)}
            href={`/app/projects/${projectId}/${type}/${id}`}
        >
            <Card className="" size="sm">
                <CardContent className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                        <Icon className="w-4 h-lh" />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                            {name}
                        </span>
                    </span>
                </CardContent>
            </Card>
        </Link>
    );
}
