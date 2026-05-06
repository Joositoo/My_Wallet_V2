import Hero from "./components/landing/Hero";
import Features from "./components/landing/Features";
import DetailedFeatures from "./components/landing/DetailedFeatures";
import Benefits from "./components/landing/Benefits";
import CTA from "./components/landing/CTA";

export default function App() {
    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <Hero />
            <Features />
            <DetailedFeatures />
            <Benefits />
            <CTA />
        </div>
    );
}