import { cn } from "@/lib/cn";

export function Blocker({ className }: { className: string }) {
    return (
        <div
            className={cn(
                "w-full h-(--header-height) sticky top-0 left-0 z-8",
                className
            )}
        />
    );
}
