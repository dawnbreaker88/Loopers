import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AboutLoopers } from "@/components/landing/AboutLoopers";
import { Features } from "@/components/landing/Features";
import { Categories } from "@/components/landing/Categories";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InstallApp } from "@/components/landing/InstallApp";
import { OfferBanner } from "@/components/landing/OfferBanner";
import { FAQ } from "@/components/landing/FAQ";
import { Founders } from "../components/landing/Founders";
import { Footer } from "@/components/landing/Footer";
import { ShopTransition } from "@/components/landing/ShopTransition";

export default function NewLandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <AboutLoopers />
        <Features />
        <Categories />
        <HowItWorks />
        <InstallApp />
        <OfferBanner />
        <Founders />
        <FAQ />
      </main>
      <Footer />
      <ShopTransition />
    </div>
  );
}
