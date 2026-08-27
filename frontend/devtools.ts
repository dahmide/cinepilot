"use client";

import { useEffect } from "react";

async function initDevTools() {
    if (process.env.NODE_ENV !== "development") return;

    const eruda = await import("eruda");
    eruda.default.init();
}

export default function DevTools() {
    useEffect(() => {
        initDevTools();
    }, []);

    return null;
}
