import { Container, Section } from "@/components/layout";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="flex-1 flex flex-col">
            <section className="py-8 md:py-16 flex-1 flex flex-col gap-6 items-center justify-center">
                <Logo />
                {/** <Container className="flex flex-col items-center justify-center gap-3"> **/}
                {children}
                {/** </Container> **/}
            </section>
        </main>
    );
}
