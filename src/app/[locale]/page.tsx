import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LogoTrustBar } from "@/components/sections/LogoTrustBar";
import { NextPlatform } from "@/components/sections/NextPlatform";
import { Footer } from "@/components/sections/Footer";

export default async function HomePage() {

  return (
    <>
      <Navbar transparent />
      <Hero />
      <LogoTrustBar />
      <NextPlatform />
      <Footer />
    </>
  );
}
