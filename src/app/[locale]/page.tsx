import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/sections/Footer";

export default async function HomePage() {

  return (
    <>
      <Navbar transparent />
      <Hero />
      <Footer />
    </>
  );
}
