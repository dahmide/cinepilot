import { Badge } from "@/components/ui/badge";
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
import { Entity } from "@/types";

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

export function EntityChip({
    id,
    name,
    type,
    projectId,
    className,
    ...props
}: React.ComponentProps<typeof Badge> & EntityProps) {
    const Icon = ICONS[type];
    return (
        <Link
            href={`/app/projects/${projectId}/${type}/${id}`}
            className={cn("group/entity", className)}
        >
            <Badge className="h-auto p-2!" variant="outline" {...props}>
                <Icon className="w-4 h-lh" />
                <span>{name}</span>
            </Badge>
        </Link>
    );
}
