import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { Link } from 'next-view-transitions'

export function LinkButton({
    href,
    children,
    ...props
}: React.ComponentProps<typeof Button> & {
    href: string;
    children?: React.ReactNode;
}) {
    return (
        <Button
            variant="link"
            nativeButton={false}
            // className="w-max p-0! m-0! inline-flex items-center"
            {...props}
            render={<Link href={href}>{children}</Link>}
        />
    );
}
