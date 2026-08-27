"use client";

import { useState } from "react";
import { Container } from "./container";
import { Logo } from "@/components/ui/logo";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

const navItems = [
    { name: "Home", href: "#home" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" }
];

export default function Header() {
    const [open, setOpen] = useState(false);
    console.log("Open:", open);

    return (
        <header className="w-full h-(--header-height) fixed top-0 left-0 z-9">
            <Container className="h-full">
                <div className="h-full hidden lg:block">
                    {/* <div className="h-full flex items-center justify-between"> */}
                    <Logo />
                    <NavigationMenu>
                        <NavigationMenuList>
                            {navItems.map(item => (
                                <NavigationMenuItem key={item.href}>
                                    <a href={item.href}>{item.name}</a>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                    {/* </div> */}
                </div>
                <div className="h-full block lg:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <div className="h-full flex items-center justify-between">
                            <Logo />
                            <SheetTrigger>
                                <div
                                    className="group/menu size-6 p-0.5 relative"
                                    style={{ transform: "translateZ(0)" }}
                                    data-open={open ? "" : undefined}
                                >
                                    <span className="w-full h-[2.5px] absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-0 bg-white rounded-none transition-transform duration-250 group-data-[open]/menu:-translate-y-1/2 group-data-[open]/menu:rotate-[+45deg]" />
                                    <span className="w-full h-[2.5px] absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-0 bg-white rounded-none transition-transform duration-250 group-data-[open]/menu:-translate-y-1/2 group-data-[open]/menu:rotate-[-45deg]" />
                                </div>
                            </SheetTrigger>
                        </div>
                        <SheetContent
                            className="data-[side=top]:h-full data-[side=top]:top-(--header-height) data-[side=top]:border-b-0"
                            side="top"
                            showCloseButton={false}
                            showOverlay={false}
                        >
                            {navItems.map(item => (
                                <SheetHeader key={item.href}>
                                    <SheetTitle
                                        render={
                                            <a href={item.href}>{item.name}</a>
                                        }
                                    />
                                </SheetHeader>
                            ))}
                        </SheetContent>
                    </Sheet>
                </div>
            </Container>
        </header>
    );
}
