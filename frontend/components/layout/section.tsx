import { cn } from "@/lib/cn";

export default function Section({
    className,
    ...props
}: React.ComponentProps<"section">) {
    return <section className={cn("", className)} {...props} />;
}
