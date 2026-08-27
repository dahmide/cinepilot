import { cn } from "@/lib/cn";
import { VideoIcon } from "lucide-react";

export function Logo({ className }: { className }) {
    return (
        <div
            className={cn(
                className,
                "font-heading text-2xl inline-flex items-end whitespace-nowrap"
            )}
        >
            C
            <span className="-mx-0.5 -rotate-90">
                <VideoIcon className="w-[0.8em] h-lh fill-current" />
            </span>
            nepilot
        </div>
    );
}
