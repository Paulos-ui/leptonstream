import LandingShell from "@/components/LandingShell";
import Hero from "@/components/acts/Hero";
import QuantumZoom from "@/components/acts/QuantumZoom";
import Instrument from "@/components/acts/Instrument";
import AgentLoop from "@/components/acts/AgentLoop";
import Pipeline from "@/components/acts/Pipeline";
import About from "@/components/acts/About";
import CTA from "@/components/acts/CTA";

export default function Home() {
  return (
    <LandingShell>
      <main className="relative">
        <Hero />
        <QuantumZoom />
        <Instrument />
        <AgentLoop />
        <Pipeline />
        <About />
        <CTA />
      </main>
    </LandingShell>
  );
}
