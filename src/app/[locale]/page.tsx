import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LogoTrustBar } from "@/components/sections/LogoTrustBar";
import { NextPlatform } from "@/components/sections/NextPlatform";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { EndOfBusywork } from "@/components/sections/EndOfBusywork";
import { SplitShowcase } from "@/components/sections/SplitShowcase";
import { MoreImpact } from "@/components/sections/MoreImpact";
import { Footer } from "@/components/sections/Footer";

export default async function HomePage() {

  return (
    <>
      <Navbar transparent />
      <Hero />
      <LogoTrustBar />
      <NextPlatform />
      <FeatureCards />
      <EndOfBusywork />
      <SplitShowcase />
      <MoreImpact />
      <Footer />
    </>
  );
}
