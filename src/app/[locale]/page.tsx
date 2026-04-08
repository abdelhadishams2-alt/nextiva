import "@/styles/hero.css";
import "@/styles/hero-showcase.css";
import "@/styles/logo-trust-bar.css";
import "@/styles/featured-stories.css";
import "@/styles/how-we-review.css";
import "@/styles/end-of-busywork.css";
import "@/styles/split-showcase.css";
import "@/styles/editors-pick.css";
import "@/styles/from-founder.css";
import "@/styles/pricing.css";
import "@/styles/pricing-cards.css";
import "@/styles/feature-cards.css";
import "@/styles/next-platform.css";
import "@/styles/more-impact.css";
import "@/styles/spotlight-hero.css";
import "@/styles/proven-results.css";
import "@/styles/customer-stories.css";
import "@/styles/contact-center.css";

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
import { SITE_CONFIG } from "@/config/site";

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              description: SITE_CONFIG.description,
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              logo: `${SITE_CONFIG.url}/assets/mansati-logo.svg`,
            },
          ]),
        }}
      />
    </>
  );
}
