import type { Metadata } from "next";
import { Figtree, Geist, Inter } from "next/font/google";
import "@/styles/globals.css";
import { ViewTransitions } from "next-view-transitions";
import DevTools from "@/devtools";

const geist = Geist({
    variable: "--font-geist",
    // weight: ["400"],
    subsets: ["latin"]
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"]
});

const serif = Geist({
    variable: "--font-serif",
    // weight: ["400"],
    subsets: ["latin"]
});

export const metadata: Metadata = {
    title: "CinePilot",
    description:
        "AI script supervisor — catch continuity mistakes before you shoot."
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ViewTransitions>
            <html lang="en">
                <body
                    className={`${serif.variable} ${inter.variable} h-full antialiased`}
                >
                    <div className="root min-h-screen flex flex-col">
                        {children}
                    </div>
                    <DevTools />
                </body>
            </html>
        </ViewTransitions>
    );
}
