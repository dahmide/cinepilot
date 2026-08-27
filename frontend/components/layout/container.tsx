import { cn } from "@/lib/cn";

export function Container({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("container mx-auto px-4 sm:px-6 lg:px-8", className)}
            {...props}
        />
    );
}

export default Container;
