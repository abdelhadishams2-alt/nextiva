import "@/styles/hero.css";
import "@/styles/hero-showcase.css";
import "@/styles/logo-trust-bar.css";
import "@/styles/featured-stories.css";
import "@/styles/how-we-review.css";
import "@/styles/end-of-busywork.css";
import "@/styles/split-showcase.css";
import "@/styles/editors-pick.css";
import "@/styles/from-founder.css";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LogoTrustBar } from "@/components/sections/LogoTrustBar";
import { EndOfBusywork } from "@/components/sections/EndOfBusywork";
import { SplitShowcase } from "@/components/sections/SplitShowcase";
import { FeaturedStories } from "@/components/sections/FeaturedStories";
import { HowWeReview } from "@/components/sections/HowWeReview";
import dynamic from "next/dynamic";
const EditorsPick = dynamic(() => import("@/components/sections/EditorsPick").then(m => ({ default: m.EditorsPick })));
import { CallToAction } from "@/components/sections/CallToAction";
import { Footer } from "@/components/sections/Footer";
import { SITE_CONFIG } from "@/config/site";

export async function generateMetadata() {
  const t = await getTranslations('Metadata');
  return {
    title: t('title'),
    description: t('description'),
    keywords: ['software reviews', 'tool comparison', 'business software', 'MENA', 'Middle East'],
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [{ url: `${SITE_CONFIG.url}/assets/hero-backgrounds/hero-option-12-desert-wide-4x3.webp`, width: 1200, height: 630, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [`${SITE_CONFIG.url}/assets/hero-backgrounds/hero-option-12-desert-wide-4x3.webp`],
    },
    alternates: {
      canonical: SITE_CONFIG.url,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

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
