import { cn } from "@/lib/cn";
import { LuClapperboard, LuVideo } from "react-icons/lu";

export function Word({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                className,
                "font-heading font-semibold text-xl inline-flex items-end whitespace-nowrap"
            )}
        >
            C
            <span className="-mx-0.5 -rotate-90">
                <LuVideo className="w-[0.8em] h-lh" />
            </span>
            nepilot
        </div>
    );
}

export function Logo({ className }: { className?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <LuClapperboard className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            <span className="font-head font-semibold text-xl tracking-wide">
                CinePilot
            </span>
        </div>
    );
}
