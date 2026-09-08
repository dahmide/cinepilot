"use client";

import { IconContext } from "react-icons";

export function IconProvider({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <IconContext.Provider value={{ size: "1em" }}>
            {children}
        </IconContext.Provider>
    );
}
