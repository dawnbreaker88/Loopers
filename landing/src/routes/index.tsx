import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AboutLoopers } from "@/components/landing/AboutLoopers";
import { Features } from "@/components/landing/Features";
import { Categories } from "@/components/landing/Categories";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Founders } from "@/components/landing/Founders";
import { OfferBanner } from "@/components/landing/OfferBanner";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { ShopTransition } from "@/components/landing/ShopTransition";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        window.location.href = "/app";
      }
    } catch (e) {
      console.warn("Failed to check auth state on landing page:", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <AboutLoopers />
        <Features />
        <Categories />
        <HowItWorks />
        <Founders />
        <OfferBanner />
        <FAQ />
      </main>
      <Footer />
      <ShopTransition />
    </div>
  );
}
