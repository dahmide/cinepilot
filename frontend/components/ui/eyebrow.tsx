import { cn } from "@/lib/cn";

export function Eyebrow({
    className,
    ...props
}: React.ComponentProps<"small">) {
    return (
        <small
            className={cn(
                "uppercase font-semibold tracking-widest text-primary",
                className
            )}
            {...props}
        />
    );
}
