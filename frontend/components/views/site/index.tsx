import { Cta, Features, Hero, HowItWorks } from "@/components/blocks/home";
import { Blocker } from "@/components/ui/blocker";

export default function Site() {
    return (
        <main>
            <div className="relative">
                <Blocker className="bg-background" />
                <Hero />
            </div>
            <div className="relative">
                <Blocker className="bg-background" />
                <Features />
                <HowItWorks />
                <Cta />
            </div>
        </main>
    );
}
