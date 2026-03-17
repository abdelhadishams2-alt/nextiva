import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/sections/Footer";

export default async function HomePage() {
  const t = await getTranslations("Hero");

  return (
    <>
      <Navbar />
      <Hero />
      <Footer />
    </>
  );
}
