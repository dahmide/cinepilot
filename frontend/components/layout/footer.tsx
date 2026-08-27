import { Container } from "./container";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";

const footerContent = {
    socials: [],
    columns: [
        {
            title: "Product",
            links: [
                { name: "Link 1", href: "#" },
                { name: "Link 2", href: "#" },
                { name: "Link 3", href: "#" }
            ]
        },
        {
            title: "Company",
            links: [
                { name: "Link 1", href: "#" },
                { name: "Link 2", href: "#" },
                { name: "Link 3", href: "#" }
            ]
        }
    ],
    legal: [
        { name: "Terms and Conditions", href: "#" },
        { name: "Privacy Policy", href: "#" }
    ]
};

export default function Footer() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    return (
        <footer className="py-16">
            <Container className="flex flex-col gap-4">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center lg:justify-start">
                            <Logo />
                        </div>
                        <p>
                            An AI script supervisor that catches continuity
                            mistakes before you shoot.
                        </p>
                    </div>
                    <div className="flex flex-row gap-8">
                        {footerContent.columns.map((column, columnIdx) => (
                            <div key={columnIdx}>
                                <h3 className="mb-2">{column.title}</h3>
                                <ul className="flex flex-col gap-2 text-muted-foreground">
                                    {column.links.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            className="font-medium hover:text-primary"
                                        >
                                            <a href={link.href}>{link.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <p>
                        &copy; {currentYear} Cinepilot. Built for the Agentic
                        Cinema hackathon.
                    </p>
                    <ul className="flex flex-row gap-2 text-muted-foreground">
                        {footerContent.legal.map((link, linkIdx) => (
                            <li
                                key={linkIdx}
                                className="underline hover:text-primary"
                            >
                                <a href={link.href}>{link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </Container>
        </footer>
    );
}
