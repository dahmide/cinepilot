import type { Metadata } from "next";
import { Geist, Inter, Lora } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toast";
import { ViewTransitions } from "next-view-transitions";
import { IconProvider } from "@/components/providers/icons";

const hero = Lora({
    variable: "--ff-hero",
    weight: ["400"],
    subsets: ["latin"],
});

const head = Geist({
    variable: "--ff-head",
    weight: ["400"],
    subsets: ["latin"],
});

const body = Inter({
    variable: "--ff-body",
    weight: ["400"],
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "CinePilot",
    description:
        "AI script supervisor — catch continuity mistakes before you shoot.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ViewTransitions>
            <IconProvider>
                <html lang="en">
                    <body
                        className={`${hero.variable} ${head.variable} ${body.variable} h-full antialiased`}
                    >
                        <div className="root min-h-screen flex flex-col">
                            {children}
                            <Toaster />
                        </div>
                    </body>
                </html>
            </IconProvider>
        </ViewTransitions>
    );
}
