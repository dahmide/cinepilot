"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { IconType } from "react-icons";

import { cn } from "@/lib/cn";

type Crumb = {
    href: string;
    icon?: IconType;
    label: string;
};

const BreadcrumbContext = createContext<{
    crumbs: Record<string, Crumb>;
    set: (key: string, crumb: Crumb) => void;
    get: (
        segments: string[],
        resolver: Record<string, Omit<Crumb, "href">>
    ) => Crumb[];
} | null>(null);

function useBreadcrumb() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error(
            "useBreadcrumb must be used within a BreadcrumbProvider."
        );
    }

    return context;
}

function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
    const [crumbs, setCrumbs] = useState<Record<string, Crumb>>({});

    const set = useCallback((key: string, crumb: Crumb) => {
        setCrumbs((prev) =>
            prev[key]?.label === crumb.label ? prev : { ...prev, [key]: crumb }
        );
    }, []);

    const get = useCallback(
        (
            segments: string[],
            resolver: Record<string, Omit<Crumb, "href">>
        ): Crumb[] => {
            return segments.map((seg, idx) => {
                const href = "/" + segments.slice(0, idx + 1).join("/");
                const slot = resolver[seg];

                return {
                    href,
                    icon: crumbs[href]?.icon ?? slot?.icon,
                    label: crumbs[href]?.label ?? slot?.label,
                };
            });
        },
        [crumbs]
    );

    return (
        <BreadcrumbContext.Provider value={{ crumbs, set, get }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
    return (
        <nav
            aria-label="breadcrumb"
            data-slot="breadcrumb"
            className={cn(className)}
            {...props}
        />
    );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
    return (
        <ol
            data-slot="breadcrumb-list"
            className={cn(
                "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground",
                className
            )}
            {...props}
        />
    );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="breadcrumb-item"
            className={cn(
                "inline-flex items-center gap-1 capitalize",
                className
            )}
            {...props}
        />
    );
}

function BreadcrumbLink({
    className,
    render,
    ...props
}: useRender.ComponentProps<"a">) {
    return useRender({
        defaultTagName: "a",
        props: mergeProps<"a">(
            {
                className: cn(
                    "capitalize transition-colors hover:text-foreground",
                    className
                ),
            },
            props
        ),
        render,
        state: {
            slot: "breadcrumb-link",
        },
    });
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="breadcrumb-page"
            role="link"
            aria-disabled="true"
            aria-current="page"
            className={cn("font-normal text-foreground", className)}
            {...props}
        />
    );
}

function BreadcrumbSeparator({
    children,
    className,
    ...props
}: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="breadcrumb-separator"
            role="presentation"
            aria-hidden="true"
            className={cn("[&>svg]:size-3.5", className)}
            {...props}
        >
            {children ?? <ChevronRightIcon className="cn-rtl-flip" />}
        </li>
    );
}

function BreadcrumbEllipsis({
    className,
    ...props
}: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="breadcrumb-ellipsis"
            role="presentation"
            aria-hidden="true"
            className={cn(
                "flex size-5 items-center justify-center [&>svg]:size-4",
                className
            )}
            {...props}
        >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
        </span>
    );
}

function BreadcrumbSetter({ href, icon, label }: Crumb) {
    const { set } = useBreadcrumb();
    useEffect(() => {
        set(href, { label, href, icon });
    }, [href, label, icon, set]);

    return null;
}

export {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
    BreadcrumbProvider,
    BreadcrumbSetter,
    useBreadcrumb,
};
