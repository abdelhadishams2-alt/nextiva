import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LogoTrustBar } from "@/components/sections/LogoTrustBar";
import { NextPlatform } from "@/components/sections/NextPlatform";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { EndOfBusywork } from "@/components/sections/EndOfBusywork";
import { SplitShowcase } from "@/components/sections/SplitShowcase";
import { MoreImpact } from "@/components/sections/MoreImpact";
import { SpotlightHero } from "@/components/sections/SpotlightHero";
import { ProvenResults } from "@/components/sections/ProvenResults";
import { FeaturedStories } from "@/components/sections/FeaturedStories";
import { HowWeReview } from "@/components/sections/HowWeReview";
import { CustomerStories } from "@/components/sections/CustomerStories";
import { ContactCenter } from "@/components/sections/ContactCenter";
import { EditorsPick } from "@/components/sections/EditorsPick";
import { CallToAction } from "@/components/sections/CallToAction";
import { Pricing } from "@/components/sections/Pricing";
import { Footer } from "@/components/sections/Footer";

export default async function HomePage() {

  return (
    <>
      <Navbar transparent />
      <Hero />
      <LogoTrustBar />
      <FeaturedStories />
      <HowWeReview />
      <EndOfBusywork />
      <SplitShowcase />
      {/* <NextPlatform /> */}
      {/* <FeatureCards /> */}

      {/* <MoreImpact /> */}
      {/* <SpotlightHero /> */}
      {/* <CustomerStories /> */}
      {/* <ProvenResults /> */}
      {/* <ContactCenter /> */}
      {/* <Pricing /> */}
      <EditorsPick />
      <CallToAction />
      <Footer />
    </>
  );
}
