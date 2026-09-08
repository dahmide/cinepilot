import { BreadcrumbContext } from "@/components/providers/breadcrumbs";
import { useContext } from "react";

export function useBreadcrumbs() {
    const ctx = useContext(BreadcrumbContext);
    if (!ctx)
        throw new Error(
            "useBreadcrumbLabels must be used inside BreadcrumbProvider"
        );
    return ctx;
}
